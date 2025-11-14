import { useDraggable } from '@dnd-kit/core'
import { Clock, CheckCircle, Circle, XCircle, Pause, GripVertical } from 'lucide-react'
import type { ScheduleEvent } from '../types/schedule'
import './ScheduleEventCard.css'

interface ScheduleEventCardProps {
  event: ScheduleEvent
  onClick: () => void
  onToggleComplete?: (event: ScheduleEvent) => void
}

export default function ScheduleEventCard({ event, onClick, onToggleComplete }: ScheduleEventCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging, setActivatorNodeRef } = useDraggable({
    id: event.id,
    data: { type: 'schedule-event', event }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : {}

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleComplete) {
      const newStatus = event.status === 'completed' ? 'scheduled' : 'completed'
      onToggleComplete({ ...event, status: newStatus, updatedAt: new Date() })
    }
  }

  const isCompleted = event.status === 'completed'

  const getStatusIcon = () => {
    switch (event.status) {
      case 'completed':
        return <CheckCircle size={14} className="status-icon completed" />
      case 'in-progress':
        return <Pause size={14} className="status-icon in-progress" />
      case 'cancelled':
        return <XCircle size={14} className="status-icon cancelled" />
      default:
        return <Circle size={14} className="status-icon scheduled" />
    }
  }

  const getEventDuration = () => {
    if (event.allDay) return 'All Day'
    
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    
    const formatTime = (date: Date) => {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    }
    
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  const getPriorityClass = () => {
    switch (event.priority) {
      case 'urgent':
        return 'priority-urgent'
      case 'high':
        return 'priority-high'
      case 'medium':
        return 'priority-medium'
      case 'low':
        return 'priority-low'
      default:
        return ''
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderLeft: event.color ? `4px solid ${event.color}` : undefined
      }}
      className={`schedule-event-card ${event.allDay ? 'all-day' : ''} ${getPriorityClass()} status-${event.status}`}
      onClick={(e) => {
        e.stopPropagation()
        if (!isDragging) {
          onClick()
        }
      }}
      {...attributes}
    >
      {/* Drag Handle */}
      <div 
        ref={setActivatorNodeRef}
        className="event-drag-handle"
        {...listeners}
      >
        <GripVertical size={14} />
      </div>

      <div className="event-content">
        <div className="event-header">
          <div className="event-title-row">
            {getStatusIcon()}
            <h4 className={`event-title ${isCompleted ? 'completed' : ''}`}>{event.title}</h4>
          </div>
          {!event.allDay && (
            <div className="event-time">
              <Clock size={12} />
              <span>{getEventDuration()}</span>
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="event-description">{event.description}</p>
        )}
        
        {event.tags && event.tags.length > 0 && (
          <div className="event-tags">
            {event.tags.map((tag, index) => (
              <span key={index} className="event-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Complete Checkbox */}
      {onToggleComplete && (
        <div className="event-actions">
          <button
            className={`event-complete-btn ${isCompleted ? 'completed' : ''}`}
            onClick={handleToggleComplete}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <div className="checkbox">
              {isCompleted && <CheckCircle size={14} />}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
