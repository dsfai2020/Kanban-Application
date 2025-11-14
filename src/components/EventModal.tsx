import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { ScheduleEvent, EventStatus } from '../types/schedule'
import './EventModal.css'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  onDelete?: () => void
  event?: ScheduleEvent | null
  defaultDate?: Date
  defaultHour?: number
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
]

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  defaultDate,
  defaultHour
}: EventModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [status, setStatus] = useState<EventStatus>('scheduled')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode
        setTitle(event.title)
        setDescription(event.description || '')
        
        const start = new Date(event.startTime)
        const end = new Date(event.endTime)
        
        // Format dates properly for date inputs (YYYY-MM-DD)
        const formatDateForInput = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        setStartDate(formatDateForInput(start))
        setStartTime(start.toTimeString().slice(0, 5))
        setEndDate(formatDateForInput(end))
        setEndTime(end.toTimeString().slice(0, 5))
        setAllDay(event.allDay)
        setColor(event.color || PRESET_COLORS[0])
        setStatus(event.status)
        setPriority(event.priority || 'medium')
        setTags(event.tags?.join(', ') || '')
      } else {
        // Create mode - use today's date
        const now = defaultDate ? new Date(defaultDate) : new Date()
        now.setHours(0, 0, 0, 0) // Reset to start of day
        
        const hour = defaultHour !== undefined ? defaultHour : new Date().getHours()
        
        // Format today's date for input (YYYY-MM-DD)
        const formatDateForInput = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
        
        setTitle('')
        setDescription('')
        setStartDate(formatDateForInput(now))
        setStartTime(`${hour.toString().padStart(2, '0')}:00`)
        setEndDate(formatDateForInput(now))
        setEndTime(`${(hour + 1).toString().padStart(2, '0')}:00`)
        setAllDay(false)
        setColor(PRESET_COLORS[0])
        setStatus('scheduled')
        setPriority('medium')
        setTags('')
      }
    }
  }, [isOpen, event, defaultDate, defaultHour])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const startDateTime = allDay
      ? new Date(`${startDate}T00:00:00`)
      : new Date(`${startDate}T${startTime}`)
    
    const endDateTime = allDay
      ? new Date(`${endDate}T23:59:59`)
      : new Date(`${endDate}T${endTime}`)

    const eventTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    onSave({
      title,
      description: description || undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      allDay,
      color,
      status,
      priority,
      tags: eventTags.length > 0 ? eventTags : undefined,
      cardId: event?.cardId
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? 'Edit Event' : 'Create Event'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
              />
              <span>All Day Event</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start-date">Start Date *</label>
              <input
                type="date"
                id="start-date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {!allDay && (
              <div className="form-group">
                <label htmlFor="start-time">Start Time *</label>
                <input
                  type="time"
                  id="start-time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="end-date">End Date *</label>
              <input
                type="date"
                id="end-date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            {!allDay && (
              <div className="form-group">
                <label htmlFor="end-time">End Time *</label>
                <input
                  type="time"
                  id="end-time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className={`color-option ${color === presetColor ? 'selected' : ''}`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
              <input
                type="color"
                className="color-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              className="form-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="work, meeting, personal"
            />
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this event?')) {
                    onDelete()
                  }
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {event ? 'Update' : 'Create'} Event
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
