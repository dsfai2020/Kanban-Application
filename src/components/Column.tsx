import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { memo } from 'react'
import Card from './Card'
import type { Column as ColumnType, Card as CardType, AppSettings } from '../types'
import { achievementManager } from '../utils/achievementManager'

interface ColumnProps {
  column: ColumnType
  settings: AppSettings
  onUpdateColumn: (column: ColumnType) => void
  onDeleteColumn: (columnId: string) => void
}

function Column({ column, settings, onUpdateColumn, onDeleteColumn }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [isCreatingCard, setIsCreatingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [newCardDescription, setNewCardDescription] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const handleEditTitle = (e: React.FormEvent) => {
    e.preventDefault()
    if (editTitle.trim()) {
      onUpdateColumn({
        ...column,
        title: editTitle.trim()
      })
      setIsEditing(false)
    }
  }

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (newCardTitle.trim()) {
      const newCard: CardType = {
        id: uuidv4(),
        title: newCardTitle.trim(),
        description: newCardDescription.trim() || undefined,
        columnId: column.id,
        position: column.cards.length,
        tags: [],
        priority: 'medium',
        checklist: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Track card creation achievement
      try {
        achievementManager.trackCardCreated()
      } catch (error) {
        console.warn('Achievement tracking failed:', error)
      }

      onUpdateColumn({
        ...column,
        cards: [...column.cards, newCard]
      })

      setNewCardTitle('')
      setNewCardDescription('')
      setIsCreatingCard(false)
    }
  }

  const handleUpdateCard = (updatedCard: CardType) => {
    onUpdateColumn({
      ...column,
      cards: column.cards.map(card => 
        card.id === updatedCard.id ? updatedCard : card
      )
    })
  }

  const handleDeleteCard = (cardId: string) => {
    onUpdateColumn({
      ...column,
      cards: column.cards.filter(card => card.id !== cardId)
    })
  }

  const handleDeleteColumn = () => {
    if (window.confirm('Are you sure you want to delete this column?')) {
      onDeleteColumn(column.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="column"
      {...attributes}
    >
      <div className="column-header" {...listeners}>
        <div className="column-title-section">
          {isEditing ? (
            <form onSubmit={handleEditTitle} className="edit-title-form">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-title-input"
                autoFocus
                onBlur={() => setIsEditing(false)}
                required
              />
            </form>
          ) : (
            <h3 
              className="column-title"
              onClick={() => setIsEditing(true)}
            >
              {column.title}
            </h3>
          )}
          <span className="card-count">{column.cards.length}</span>
        </div>
        
        <div className="column-actions">
          <button
            className="column-menu-btn"
            onClick={() => setShowMenu(!showMenu)}
            title="Column options"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="column-menu">
              <button
                className="column-menu-item"
                onClick={() => {
                  setIsEditing(true)
                  setShowMenu(false)
                }}
              >
                <Edit2 size={14} />
                Edit Title
              </button>
              <button
                className="column-menu-item delete"
                onClick={handleDeleteColumn}
              >
                <Trash2 size={14} />
                Delete Column
              </button>
            </div>
          )}
        </div>
      </div>

      <SortableContext 
        items={column.cards.map(card => card.id)} 
        strategy={verticalListSortingStrategy}
      >
        <div 
          className={`cards-container ${column.cards.length > settings.columnCardLimit ? 'scrollable' : ''}`}
          style={{
            maxHeight: column.cards.length > settings.columnCardLimit 
              ? `${settings.columnCardLimit * 120 + 40}px` 
              : 'none'
          }}
        >
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onUpdate={handleUpdateCard}
              onDelete={handleDeleteCard}
            />
          ))}
        </div>
      </SortableContext>

      <div className="add-card-section">
        {isCreatingCard ? (
          <form onSubmit={handleCreateCard} className="add-card-form">
            <input
              type="text"
              placeholder="Enter card title"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className="form-input"
              autoFocus
              required
            />
            <textarea
              placeholder="Enter card description (optional)"
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              className="form-textarea"
              rows={3}
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                Add Card
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsCreatingCard(false)
                  setNewCardTitle('')
                  setNewCardDescription('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            className="add-card-btn"
            onClick={() => setIsCreatingCard(true)}
          >
            <Plus size={16} />
            Add a card
          </button>
        )}
      </div>
    </div>
  )
}

export default memo(Column)