import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  getCard,
  updateCard,
  deleteCard,
  addCardLabel,
  removeCardLabel,
  addCardMember,
  removeCardMember,
  addChecklist,
  deleteChecklist,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addComment,
} from '../api';
import { format, parseISO } from 'date-fns';

const DEFAULT_MEMBER_ID = 1;
const COVER_COLORS = ['', '#6366F1', '#8B5CF6', '#06B6D4', '#22C55E', '#F97316', '#F43F5E', '#F8FAFC'];

export default function CardModal({ cardId, listTitle, boardLabels, boardMembers, onClose, onUpdate, onDelete }) {
  const [card, setCard] = useState(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [newItemText, setNewItemText] = useState({});
  const [commentText, setCommentText] = useState('');
  const overlayRef = useRef(null);

  useEffect(() => {
    getCard(cardId).then((response) => {
      setCard(response.data);
      setTitle(response.data.title);
      setDesc(response.data.description || '');
    });
  }, [cardId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const saveTitle = async () => {
    if (!title.trim() || title === card.title) return;
    await updateCard(cardId, { ...card, title: title.trim() });
    setCard((prev) => ({ ...prev, title: title.trim() }));
    onUpdate();
  };

  const saveDesc = async () => {
    if (desc === (card.description || '')) return;
    await updateCard(cardId, { ...card, description: desc });
    setCard((prev) => ({ ...prev, description: desc }));
    onUpdate();
  };

  const saveDueDate = async (value) => {
    await updateCard(cardId, { ...card, due_date: value || null });
    setCard((prev) => ({ ...prev, due_date: value || null }));
    onUpdate();
  };

  const saveCoverColor = async (color) => {
    await updateCard(cardId, { ...card, cover_color: color || null });
    setCard((prev) => ({ ...prev, cover_color: color }));
    onUpdate();
  };

  const toggleLabel = async (labelId) => {
    const hasLabel = card.labels.some((label) => label.id === labelId);
    if (hasLabel) {
      await removeCardLabel(cardId, labelId);
      setCard((prev) => ({ ...prev, labels: prev.labels.filter((label) => label.id !== labelId) }));
    } else {
      await addCardLabel(cardId, labelId);
      const label = boardLabels.find((item) => item.id === labelId);
      setCard((prev) => ({ ...prev, labels: [...prev.labels, label] }));
    }
    onUpdate();
  };

  const toggleMember = async (memberId) => {
    const hasMember = card.members.some((member) => member.id === memberId);
    if (hasMember) {
      await removeCardMember(cardId, memberId);
      setCard((prev) => ({ ...prev, members: prev.members.filter((member) => member.id !== memberId) }));
    } else {
      await addCardMember(cardId, memberId);
      const member = boardMembers.find((item) => item.id === memberId);
      setCard((prev) => ({ ...prev, members: [...prev.members, member] }));
    }
    onUpdate();
  };

  const handleAddChecklist = async () => {
    const { data } = await addChecklist(cardId, 'Checklist');
    setCard((prev) => ({ ...prev, checklists: [...prev.checklists, data] }));
  };

  const handleDeleteChecklist = async (checklistId) => {
    await deleteChecklist(cardId, checklistId);
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((checklist) => checklist.id !== checklistId),
    }));
  };

  const handleAddItem = async (checklistId) => {
    const text = (newItemText[checklistId] || '').trim();
    if (!text) return;
    const { data } = await addChecklistItem(cardId, checklistId, text);
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.map((checklist) => (
        checklist.id === checklistId
          ? { ...checklist, items: [...checklist.items, data] }
          : checklist
      )),
    }));
    setNewItemText((prev) => ({ ...prev, [checklistId]: '' }));
  };

  const handleToggleItem = async (checklistId, item) => {
    const { data } = await updateChecklistItem(cardId, checklistId, item.id, {
      text: item.text,
      completed: item.completed ? 0 : 1,
    });
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.map((checklist) => (
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((current) => (current.id === item.id ? data : current)),
            }
          : checklist
      )),
    }));
  };

  const handleDeleteItem = async (checklistId, itemId) => {
    await deleteChecklistItem(cardId, checklistId, itemId);
    setCard((prev) => ({
      ...prev,
      checklists: prev.checklists.map((checklist) => (
        checklist.id === checklistId
          ? { ...checklist, items: checklist.items.filter((item) => item.id !== itemId) }
          : checklist
      )),
    }));
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const { data } = await addComment(cardId, { member_id: DEFAULT_MEMBER_ID, text: commentText.trim() });
    setCard((prev) => ({ ...prev, comments: [data, ...prev.comments] }));
    setCommentText('');
  };

  const handleArchive = async () => {
    await updateCard(cardId, { ...card, archived: 1 });
    onDelete();
    onClose();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this card permanently?')) return;
    await deleteCard(cardId);
    onDelete();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!card) {
    return createPortal(
      <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="modal">
          <div className="modal-loading">Loading...</div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal">
        <button type="button" className="modal-close" onClick={onClose}>x</button>

        {card.cover_color && (
          <div className="modal-cover" style={{ background: card.cover_color }} />
        )}

        <div className="modal-body">
          <div className="modal-main">
            <textarea
              className="modal-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              rows={2}
            />
            <div className="modal-list-label">In list <strong>{listTitle}</strong></div>

            {card.labels.length > 0 && (
              <div className="modal-section">
                <div className="sidebar-label">Labels</div>
                <div className="label-list">
                  {card.labels.map((label) => (
                    <span key={label.id} className="label-tag" style={{ background: label.color }}>
                      {label.name}
                      <button type="button" className="remove-btn" onClick={() => toggleLabel(label.id)}>x</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {card.members.length > 0 && (
              <div className="modal-section">
                <div className="sidebar-label">Members</div>
                <div className="member-list">
                  {card.members.map((member) => (
                    <div
                      key={member.id}
                      className="avatar"
                      style={{ background: member.avatar_color }}
                      title={member.name}
                    >
                      {member.initials}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {card.due_date && (
              <div className="modal-section">
                <div className="sidebar-label">Due Date</div>
                <span className="modal-meta-value">{format(parseISO(card.due_date), 'EEE, dd MMM yyyy')}</span>
              </div>
            )}

            <div className="modal-section">
              <div className="modal-section-header">
                <span className="modal-section-icon">i</span>
                <h3>Description</h3>
              </div>
              <textarea
                className="modal-desc-textarea"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={saveDesc}
                placeholder="Add a more detailed description..."
                rows={4}
              />
            </div>

            {card.checklists.map((checklist) => {
              const total = checklist.items.length;
              const complete = checklist.items.filter((item) => item.completed).length;
              const pct = total ? Math.round((complete / total) * 100) : 0;

              return (
                <div key={checklist.id} className="modal-section">
                  <div className="modal-section-header">
                    <span className="modal-section-icon">[]</span>
                    <h3>{checklist.title}</h3>
                    <button
                      type="button"
                      className="sidebar-btn sidebar-btn-inline"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="checklist-progress">
                    <span className="checklist-pct">{pct}%</span>
                    <div className="checklist-progress-bar">
                      <div className="checklist-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {checklist.items.map((item) => (
                    <div key={item.id} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={Boolean(item.completed)}
                        onChange={() => handleToggleItem(checklist.id, item)}
                      />
                      <span className={`checklist-item-text ${item.completed ? 'done' : ''}`}>{item.text}</span>
                      <button
                        type="button"
                        className="checklist-item-del"
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                      >
                        x
                      </button>
                    </div>
                  ))}

                  <div className="add-item-form">
                    <input
                      value={newItemText[checklist.id] || ''}
                      onChange={(e) => setNewItemText((prev) => ({ ...prev, [checklist.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem(checklist.id)}
                      placeholder="Add an item..."
                    />
                    <button type="button" className="btn-primary" onClick={() => handleAddItem(checklist.id)}>
                      Add
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="modal-section">
              <div className="modal-section-header">
                <span className="modal-section-icon">+</span>
                <h3>Activity</h3>
              </div>
              <div className="comment-form">
                <div className="avatar sm" style={{ background: '#6366F1' }}>AJ</div>
                <textarea
                  className="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                {commentText && (
                  <button type="button" className="btn-primary" onClick={handleAddComment}>
                    Save
                  </button>
                )}
              </div>

              {card.comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="avatar sm" style={{ background: comment.avatar_color }}>{comment.initials}</div>
                  <div className="comment-content">
                    <span className="comment-author">{comment.member_name}</span>
                    <span className="comment-time">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-sidebar">
            <div className="sidebar-label">Add to card</div>

            <div className="popover-wrapper">
              <button
                type="button"
                className="sidebar-btn"
                onClick={() => {
                  setShowMemberPicker((value) => !value);
                  setShowLabelPicker(false);
                }}
              >
                Members
              </button>
              {showMemberPicker && (
                <div className="member-picker floating-picker">
                  {boardMembers.map((member) => {
                    const assigned = card.members.some((current) => current.id === member.id);
                    return (
                      <div key={member.id} className="member-picker-item" onClick={() => toggleMember(member.id)}>
                        <div className="avatar sm" style={{ background: member.avatar_color }}>{member.initials}</div>
                        <span className="name">{member.name}</span>
                        {assigned && <span className="check">Yes</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="popover-wrapper">
              <button
                type="button"
                className="sidebar-btn"
                onClick={() => {
                  setShowLabelPicker((value) => !value);
                  setShowMemberPicker(false);
                }}
              >
                Labels
              </button>
              {showLabelPicker && (
                <div className="label-picker floating-picker">
                  {boardLabels.map((label) => {
                    const active = card.labels.some((current) => current.id === label.id);
                    return (
                      <div key={label.id} className="label-picker-item" onClick={() => toggleLabel(label.id)}>
                        <div className="label-picker-swatch" style={{ background: label.color }}>{label.name}</div>
                        <span className="label-picker-check">{active ? 'Yes' : ''}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sidebar-block">
              <div className="sidebar-label">Due Date</div>
              <input
                type="date"
                className="due-date-input"
                value={card.due_date ? card.due_date.split('T')[0] : ''}
                onChange={(e) => saveDueDate(e.target.value)}
              />
            </div>

            <button type="button" className="sidebar-btn" onClick={handleAddChecklist}>
              Checklist
            </button>

            <div className="sidebar-block">
              <div className="sidebar-label">Cover</div>
              <div className="cover-swatch-grid">
                {COVER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`cover-swatch ${(card.cover_color || '') === color ? 'active' : ''}`}
                    onClick={() => saveCoverColor(color)}
                    style={{ '--swatch-color': color || 'rgba(255,255,255,0.16)' }}
                    title={color || 'None'}
                  />
                ))}
              </div>
            </div>

            <div className="divider modal-divider" />
            <div className="sidebar-label">Actions</div>
            <button type="button" className="sidebar-btn" onClick={handleArchive}>Archive</button>
            <button type="button" className="sidebar-btn danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
