import { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  Plus,
  Check,
  X
} from 'lucide-react'
import { achievementManager } from '../utils/achievementManager'
import type { Card as CardType, ChecklistItem } from '../types'

interface CardModalProps {
  card: CardType
  onUpdate: (card: CardType) => void
  onDelete: (cardId: string) => void
  onClose: () => void
}

export default function CardModal({ card, onUpdate, onDelete, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [priority, setPriority] = useState(card.priority || 'medium')
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const [assignee, setAssignee] = useState(card.assignee || '')
  const [tags, setTags] = useState(card.tags || [])
  const [newTag, setNewTag] = useState('')
  const [checklist, setChecklist] = useState(card.checklist || [])
  const [newChecklistItem, setNewChecklistItem] = useState('')

  const handleSave = () => {
    const updatedCard: CardType = {
      ...card,
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority as any,
      dueDate: dueDate || undefined,
      assignee: assignee.trim() || undefined,
      tags,
      checklist,
      updatedAt: new Date()
    }
    
    onUpdate(updatedCard)
    onClose()
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: `check-${Date.now()}`,
        text: newChecklistItem.trim(),
        completed: false
      }
      setChecklist([...checklist, newItem])
      setNewChecklistItem('')
    }
  }

  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = checklist.map(item => {
      if (item.id === itemId) {
        const wasCompleted = item.completed
        const nowCompleted = !item.completed
        
        // Track checklist completion achievement
        if (!wasCompleted && nowCompleted) {
          try {
            achievementManager.trackChecklistCompleted()
          } catch (error) {
            console.warn('Achievement tracking failed:', error)
          }
        }
        
        return { ...item, completed: nowCompleted }
      }
      return item
    })
    
    setChecklist(updatedChecklist)
  }

  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId))
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Card</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={4}
              placeholder="Add a description..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Assignee</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="form-input"
              placeholder="Assign to someone..."
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-container">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="tag-remove">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="add-tag-input">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="form-input"
                placeholder="Add a tag..."
              />
              <button onClick={addTag} className="btn btn-sm btn-secondary">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Checklist</label>
            <div className="checklist-container">
              {checklist.map((item) => (
                <div key={item.id} className="checklist-item">
                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`checklist-toggle ${item.completed ? 'completed' : ''}`}
                  >
                    {item.completed && <Check size={12} />}
                  </button>
                  <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="checklist-remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="add-checklist-input">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                className="form-input"
                placeholder="Add a checklist item..."
              />
              <button onClick={addChecklistItem} className="btn btn-sm btn-secondary">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="btn btn-primary">
            Save Changes
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this card?')) {
                onDelete(card.id)
                onClose()
              }
            }}
            className="btn btn-danger"
          >
            Delete Card
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
