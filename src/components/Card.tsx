import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  Check
} from 'lucide-react'
import CardModal from './CardModal'
import type { Card as CardType } from '../types'

interface CardProps {
  card: CardType
  onUpdate?: (card: CardType) => void
  onDelete?: (cardId: string) => void
  isDragging?: boolean
}

export default function Card({ card, onUpdate, onDelete, isDragging = false }: CardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'low': return 'var(--success)'
      case 'medium': return 'var(--accent-primary)'
      case 'high': return 'orange'
      case 'urgent': return 'var(--danger)'
      default: return 'var(--text-muted)'
    }
  }

  const completedTasks = card.checklist?.filter(item => item.completed).length || 0
  const totalTasks = card.checklist?.length || 0

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`card ${isDragging ? 'dragging' : ''}`}
        {...attributes}
        {...listeners}
      >
        <div className="card-content">
          <div className="card-header">
            <h4 className="card-title">{card.title}</h4>
            {onUpdate && onDelete && (
              <div className="card-actions">
                <button
                  className="card-menu-btn"
                  onClick={handleMenuClick}
                  title="Card options"
                >
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <div className="card-menu">
                    <button
                      className="card-menu-item"
                      onClick={() => {
                        setShowModal(true)
                        setShowMenu(false)
                      }}
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      className="card-menu-item delete"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this card?')) {
                          onDelete(card.id)
                        }
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {card.description && (
            <p className="card-description">{card.description}</p>
          )}

          <div className="card-metadata">
            {card.priority && (
              <div className="card-priority" style={{ color: getPriorityColor(card.priority) }}>
                <Tag size={12} />
                {card.priority}
              </div>
            )}

            {card.dueDate && (
              <div className="card-due-date">
                <Calendar size={12} />
                {new Date(card.dueDate).toLocaleDateString()}
              </div>
            )}

            {card.assignee && (
              <div className="card-assignee">
                <User size={12} />
                {card.assignee}
              </div>
            )}

            {totalTasks > 0 && (
              <div className="card-checklist-progress">
                <Check size={12} />
                {completedTasks}/{totalTasks}
              </div>
            )}
          </div>

          {card.tags && card.tags.length > 0 && (
            <div className="card-tags">
              {card.tags.map((tag) => (
                <span key={tag} className="card-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && onUpdate && onDelete && (
        <CardModal
          card={card}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}