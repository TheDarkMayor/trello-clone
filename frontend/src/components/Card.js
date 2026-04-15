import { Draggable } from '@hello-pangea/dnd';
import { format, isPast, isToday, parseISO } from 'date-fns';

export default function Card({ card, index, labels, members, onClick }) {
  const cardLabels = labels.filter((label) => card.label_ids.includes(label.id));
  const cardMembers = members.filter((member) => card.member_ids.includes(member.id));

  const dueDate = card.due_date ? parseISO(card.due_date) : null;
  const dueBadgeClass = dueDate
    ? isPast(dueDate) && !isToday(dueDate)
      ? 'overdue'
      : isToday(dueDate)
        ? 'due-soon'
        : ''
    : '';

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          className={`card ${snapshot.isDragging ? 'is-dragging' : ''}`}
          onClick={onClick}
        >
          {card.cover_color && (
            <div className="card-cover" style={{ background: card.cover_color }} />
          )}

          {cardLabels.length > 0 && (
            <div className="card-labels">
              {cardLabels.map((label) => (
                <div key={label.id} className="card-label" style={{ background: label.color }} title={label.name} />
              ))}
            </div>
          )}

          <div className="card-title">{card.title}</div>

          <div className="card-badges">
            {dueDate && (
              <span className={`card-badge ${dueBadgeClass}`}>
                Due {format(dueDate, 'MMM d')}
              </span>
            )}
            {card.description && <span className="card-badge" title="Has description">Notes</span>}
          </div>

          {cardMembers.length > 0 && (
            <div className="card-members-row">
              {cardMembers.map((member) => (
                <div
                  key={member.id}
                  className="avatar sm"
                  style={{ background: member.avatar_color }}
                  title={member.name}
                >
                  {member.initials}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
