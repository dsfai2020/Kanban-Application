import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  Check,
  GripVertical
} from 'lucide-react'
import { memo } from 'react'
import CardModal from './CardModal'
import type { Card as CardType } from '../types'

interface CardProps {
  card: CardType
  onUpdate?: (card: CardType) => void
  onDelete?: (cardId: string) => void
  isDragging?: boolean
}

function Card({ card, onUpdate, onDelete, isDragging = false }: CardProps) {
  const [showModal, setShowModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
    setActivatorNodeRef
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card
    }
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging || isSortableDragging ? 0.3 : 1,
    willChange: isDragging || isSortableDragging ? 'transform' : 'auto',
    ...(isDragging && {
      pointerEvents: 'none' as const,
      userSelect: 'none' as const
    })
  }

  const handleMenuClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      const menuWidth = 120
      let left = rect.right - menuWidth + window.scrollX
      
      // Ensure menu stays on screen (mobile viewport adjustment)
      if (left < 0) left = 10
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 10
      }
      
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: left
      })
    }
    
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      const isMenuButton = menuButtonRef.current && menuButtonRef.current.contains(target)
      const isMenuPortal = document.querySelector('.card-menu-portal')?.contains(target)
      
      if (showMenu && !isMenuButton && !isMenuPortal) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }
  }, [showMenu])

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`card ${isDragging ? 'dragging' : ''}`}
        {...attributes}
      >
        <div className="card-content">
          <div className="card-header">
            <button
              ref={setActivatorNodeRef}
              {...listeners}
              className="card-drag-handle"
              title="Hold for 1 second to drag"
              aria-label="Drag handle"
            >
              <GripVertical size={16} />
            </button>
            <h4 className="card-title">{card.title}</h4>
            {onUpdate && onDelete ? (
              <div className="card-actions">
                <button
                  ref={menuButtonRef}
                  className="card-menu-btn"
                  onClick={handleMenuClick}
                  onTouchStart={(e) => e.stopPropagation()}
                  title="Card options"
                  style={{ touchAction: 'manipulation' }}
                >
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && createPortal(
                  <div 
                    className="card-menu-portal"
                    style={{
                      position: 'fixed',
                      top: menuPosition.top,
                      left: menuPosition.left,
                      zIndex: 9999,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '120px'
                    }}
                  >
                    <button
                      className="card-menu-item"
                      onClick={() => {
                        setShowModal(true)
                        setShowMenu(false)
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ touchAction: 'manipulation' }}
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
                        setShowMenu(false)
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <div className="card-actions">
                <button
                  className="card-menu-btn card-menu-btn-disabled"
                  title="Editing not available"
                  disabled
                >
                  <MoreHorizontal size={14} />
                </button>
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

export default memo(Card)