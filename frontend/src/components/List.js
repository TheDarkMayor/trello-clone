import { useState, useRef } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';
import { createCard, updateList, deleteList } from '../api';

export default function List({ list, cards, labels, members, filters, dragHandleProps, onCardClick, onUpdate }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const saveTitle = async () => {
    setEditingTitle(false);
    if (titleVal.trim() && titleVal !== list.title) {
      await updateList(list.id, { title: titleVal.trim() });
      onUpdate();
      return;
    }
    setTitleVal(list.title);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;
    await createCard({ list_id: list.id, title: newCardTitle.trim() });
    setNewCardTitle('');
    setAddingCard(false);
    onUpdate();
  };

  const handleDeleteList = async () => {
    if (!window.confirm(`Archive list "${list.title}"?`)) return;
    await deleteList(list.id);
    onUpdate();
  };

  const visibleCards = cards.filter((card) => {
    if (filters.label_ids.length > 0 && !filters.label_ids.some((id) => card.label_ids.includes(id))) return false;
    if (filters.member_ids.length > 0 && !filters.member_ids.some((id) => card.member_ids.includes(id))) return false;
    if (filters.due) {
      if (!card.due_date) return false;
      const dueDate = new Date(card.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const week = new Date(today);
      week.setDate(week.getDate() + 7);
      if (filters.due === 'overdue' && dueDate >= today) return false;
      if (filters.due === 'today' && dueDate.toDateString() !== today.toDateString()) return false;
      if (filters.due === 'week' && (dueDate < today || dueDate > week)) return false;
    }
    return true;
  });

  return (
    <div className="list-wrapper">
      <div className="list-header" {...dragHandleProps}>
        {editingTitle ? (
          <input
            className="list-title-input"
            value={titleVal}
            autoFocus
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setTitleVal(list.title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <button type="button" className="list-title-btn" onClick={() => setEditingTitle(true)}>
            {list.title}
          </button>
        )}

        <div className="popover-wrapper list-menu-wrapper" ref={menuRef}>
          <button type="button" className="list-menu-btn" onClick={() => setShowMenu((value) => !value)}>
            ...
          </button>
          {showMenu && (
            <div className="list-menu-popover">
              <button
                type="button"
                className="popover-action"
                onClick={() => {
                  setShowMenu(false);
                  setEditingTitle(true);
                }}
              >
                Rename list
              </button>
              <button
                type="button"
                className="popover-action danger"
                onClick={() => {
                  setShowMenu(false);
                  handleDeleteList();
                }}
              >
                Archive list
              </button>
            </div>
          )}
        </div>
      </div>

      <Droppable droppableId={String(list.id)}>
        {(provided) => (
          <div className="cards-container" ref={provided.innerRef} {...provided.droppableProps}>
            {visibleCards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                index={index}
                labels={labels}
                members={members}
                onClick={() => onCardClick(card.id, list.title)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {addingCard ? (
        <form className="add-card-form" onSubmit={handleAddCard}>
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Enter a title for this card..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCard(e);
              }
              if (e.key === 'Escape') setAddingCard(false);
            }}
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary">Add card</button>
            <button type="button" className="btn-icon" onClick={() => setAddingCard(false)}>x</button>
          </div>
        </form>
      ) : (
        <button type="button" className="add-card-btn" onClick={() => setAddingCard(true)}>
          + Add a card
        </button>
      )}
    </div>
  );
}
