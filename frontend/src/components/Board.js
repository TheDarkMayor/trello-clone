import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getBoard, createList, reorderLists, reorderCards } from '../api';
import List from './List';
import CardModal from './CardModal';
import SearchBar from './SearchBar';
import DashboardBackdrop from './DashboardBackdrop';

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [labels, setLabels] = useState([]);
  const [members, setMembers] = useState([]);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ label_ids: [], member_ids: [], due: '' });

  const loadBoard = useCallback(async () => {
    const { data } = await getBoard(id);
    setBoard(data);
    setLists(data.lists);
    setCards(data.cards);
    setLabels(data.labels);
    setMembers(data.members);
  }, [id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'LIST') {
      const reordered = Array.from(lists);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      setLists(reordered);
      await reorderLists(reordered.map((list, index) => ({ id: list.id, position: index + 1 })));
      return;
    }

    const srcListId = Number.parseInt(source.droppableId, 10);
    const dstListId = Number.parseInt(destination.droppableId, 10);

    const srcCards = cards.filter((card) => card.list_id === srcListId).sort((a, b) => a.position - b.position);
    const dstCards = srcListId === dstListId
      ? srcCards
      : cards.filter((card) => card.list_id === dstListId).sort((a, b) => a.position - b.position);

    const [movedCard] = srcCards.splice(source.index, 1);
    const updatedCard = { ...movedCard, list_id: dstListId };

    if (srcListId === dstListId) {
      srcCards.splice(destination.index, 0, updatedCard);
      const updated = srcCards.map((card, index) => ({ ...card, position: index + 1 }));
      setCards((prev) => prev.map((card) => updated.find((next) => next.id === card.id) || card));
      await reorderCards(updated.map((card) => ({ id: card.id, list_id: card.list_id, position: card.position })));
      return;
    }

    dstCards.splice(destination.index, 0, updatedCard);
    const updatedSrc = srcCards.map((card, index) => ({ ...card, position: index + 1 }));
    const updatedDst = dstCards.map((card, index) => ({ ...card, position: index + 1 }));
    const allUpdated = [...updatedSrc, ...updatedDst];

    setCards((prev) => prev.map((card) => allUpdated.find((next) => next.id === card.id) || card));
    await reorderCards(allUpdated.map((card) => ({ id: card.id, list_id: card.list_id, position: card.position })));
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    await createList({ board_id: id, title: newListTitle.trim() });
    setNewListTitle('');
    setAddingList(false);
    loadBoard();
  };

  if (!board) {
    return (
      <div className="loading-shell">
        <div className="loading-spinner" aria-hidden="true" />
        <div className="loading">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="board-wrapper" style={{ '--board-background': board.background }}>
      <DashboardBackdrop variant="board" />
      <div className="board-header">
        <Link to="/" className="back-link" title="All boards">Back</Link>
        <span className="board-title-btn">{board.title}</span>
        <div className="spacer" />
        <div className="board-tools">
          <button type="button" className="header-action" onClick={() => navigate('/login')}>
            Sign out
          </button>
          <SearchBar
            boardId={id}
            labels={labels}
            members={members}
            onFilterChange={setFilters}
          />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              className="board-canvas"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {lists.map((list, index) => {
                const listCards = cards
                  .filter((card) => card.list_id === list.id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <DraggableList key={list.id} list={list} index={index}>
                    {(dragHandleProps) => (
                      <List
                        list={list}
                        cards={listCards}
                        labels={labels}
                        members={members}
                        filters={filters}
                        dragHandleProps={dragHandleProps}
                        onCardClick={(cardId, listTitle) => setModal({ cardId, listTitle })}
                        onUpdate={loadBoard}
                      />
                    )}
                  </DraggableList>
                );
              })}
              {provided.placeholder}

              <div className="add-list-wrapper">
                {addingList ? (
                  <form className="add-list-form" onSubmit={handleAddList}>
                    <input
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      placeholder="Enter list title..."
                      onKeyDown={(e) => e.key === 'Escape' && setAddingList(false)}
                    />
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Add list</button>
                      <button type="button" className="btn-icon" onClick={() => setAddingList(false)}>x</button>
                    </div>
                  </form>
                ) : (
                  <button className="add-list-btn" onClick={() => setAddingList(true)}>
                    + Add another list
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {modal && (
        <CardModal
          cardId={modal.cardId}
          listTitle={modal.listTitle}
          boardLabels={labels}
          boardMembers={members}
          onClose={() => setModal(null)}
          onUpdate={loadBoard}
          onDelete={loadBoard}
        />
      )}
    </div>
  );
}

function DraggableList({ list, index, children }) {
  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style, display: 'flex' }}
        >
          {typeof children === 'function' ? children(provided.dragHandleProps) : children}
        </div>
      )}
    </Draggable>
  );
}
