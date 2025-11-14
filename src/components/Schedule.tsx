import { useState, useMemo, useCallback, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react'
import type { ScheduleEvent, ScheduleViewMode } from '../types/schedule'
import ScheduleEventCard from './ScheduleEventCard'
import EventModal from './EventModal'
import './Schedule.css'

interface ScheduleProps {
  events: ScheduleEvent[]
  viewMode: ScheduleViewMode
  selectedDate: Date
  onViewModeChange: (mode: ScheduleViewMode) => void
  onDateChange: (date: Date) => void
  onEventCreate: (event: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>) => void
  onEventUpdate: (event: ScheduleEvent) => void
  onEventDelete: (eventId: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

export default function Schedule({
  events,
  viewMode,
  selectedDate,
  onViewModeChange,
  onDateChange,
  onEventCreate,
  onEventUpdate,
  onEventDelete
}: ScheduleProps) {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const currentHour = currentTime.getHours()

  // Calculate the days to display based on view mode
  const displayDays = useMemo(() => {
    const days: Date[] = []
    const start = new Date(selectedDate)
    start.setHours(0, 0, 0, 0)

    switch (viewMode) {
      case 'day':
        days.push(new Date(start))
        break
      case '3-day':
        for (let i = 0; i < 3; i++) {
          const day = new Date(start)
          day.setDate(start.getDate() + i)
          days.push(day)
        }
        break
      case 'week':
        // Start from Sunday of the week
        const dayOfWeek = start.getDay()
        start.setDate(start.getDate() - dayOfWeek)
        for (let i = 0; i < 7; i++) {
          const day = new Date(start)
          day.setDate(start.getDate() + i)
          days.push(day)
        }
        break
    }
    return days
  }, [selectedDate, viewMode])

  // Organize events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()
    
    displayDays.forEach(day => {
      const dateKey = day.toDateString()
      map.set(dateKey, [])
    })

    events.forEach(event => {
      const eventDate = new Date(event.startTime)
      eventDate.setHours(0, 0, 0, 0)
      const dateKey = eventDate.toDateString()
      
      if (map.has(dateKey)) {
        map.get(dateKey)!.push(event)
      }
    })

    return map
  }, [events, displayDays])

  // Get events for a specific hour on a specific day
  const getEventsForSlot = useCallback((day: Date, hour: number): ScheduleEvent[] => {
    const dateKey = day.toDateString()
    const dayEvents = eventsByDay.get(dateKey) || []
    
    return dayEvents.filter(event => {
      if (event.allDay) return hour === 0 // Show all-day events in the first slot
      
      const startHour = new Date(event.startTime).getHours()
      const endHour = new Date(event.endTime).getHours()
      const endMinute = new Date(event.endTime).getMinutes()
      
      return hour >= startHour && (hour < endHour || (hour === endHour && endMinute === 0))
    })
  }, [eventsByDay])

  const handlePrevious = () => {
    const newDate = new Date(selectedDate)
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1)
        break
      case '3-day':
        newDate.setDate(newDate.getDate() - 3)
        break
      case 'week':
        newDate.setDate(newDate.getDate() - 7)
        break
    }
    onDateChange(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(selectedDate)
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1)
        break
      case '3-day':
        newDate.setDate(newDate.getDate() + 3)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7)
        break
    }
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleSlotClick = (day: Date, hour: number) => {
    setSelectedSlot({ date: day, hour })
    setEditingEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setSelectedSlot(null)
    setIsEventModalOpen(true)
  }

  const formatDateRange = () => {
    if (displayDays.length === 0) return ''
    
    const firstDay = displayDays[0]
    const lastDay = displayDays[displayDays.length - 1]
    
    if (displayDays.length === 1) {
      return firstDay.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  const formatDayHeader = (day: Date) => {
    return day.toLocaleDateString('en-US', { 
      weekday: viewMode === 'week' ? 'short' : 'long',
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (day: Date) => {
    const today = new Date()
    return day.toDateString() === today.toDateString()
  }

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <div className="schedule-controls">
          <button className="btn btn-secondary btn-sm" onClick={handleToday}>
            <Calendar size={16} />
            Today
          </button>
          <div className="date-navigation">
            <button className="btn-icon" onClick={handlePrevious}>
              <ChevronLeft size={20} />
            </button>
            <h2 className="schedule-title">{formatDateRange()}</h2>
            <button className="btn-icon" onClick={handleNext}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="view-mode-controls">
          <button
            className={`btn ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => onViewModeChange('day')}
          >
            Day
          </button>
          <button
            className={`btn ${viewMode === '3-day' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => onViewModeChange('3-day')}
          >
            3 Days
          </button>
          <button
            className={`btn ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => onViewModeChange('week')}
          >
            Week
          </button>
          <button 
            className="btn btn-accent btn-sm"
            onClick={() => {
              setSelectedSlot({ date: selectedDate, hour: new Date().getHours() })
              setEditingEvent(null)
              setIsEventModalOpen(true)
            }}
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      </div>

      <div className="schedule-grid">
        <div className="schedule-time-column">
          <div className="schedule-day-header"></div>
          {HOURS.map(hour => (
            <div 
              key={hour} 
              className={`schedule-time-label ${hour === currentHour ? 'current-hour' : ''}`}
            >
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {displayDays.map((day) => (
          <ScheduleDayColumn
            key={day.toDateString()}
            day={day}
            isToday={isToday(day)}
            currentHour={currentHour}
            hours={HOURS}
            getEventsForSlot={getEventsForSlot}
            onSlotClick={handleSlotClick}
            onEventClick={handleEventClick}
            onToggleComplete={onEventUpdate}
            dayHeader={formatDayHeader(day)}
          />
        ))}
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false)
          setSelectedSlot(null)
          setEditingEvent(null)
        }}
        onSave={(eventData: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
          if (editingEvent) {
            onEventUpdate({ ...editingEvent, ...eventData, updatedAt: new Date() })
          } else {
            onEventCreate(eventData)
          }
          setIsEventModalOpen(false)
          setSelectedSlot(null)
          setEditingEvent(null)
        }}
        onDelete={editingEvent ? () => {
          onEventDelete(editingEvent.id)
          setIsEventModalOpen(false)
          setEditingEvent(null)
        } : undefined}
        event={editingEvent}
        defaultDate={selectedSlot?.date}
        defaultHour={selectedSlot?.hour}
      />
    </div>
  )
}

interface ScheduleDayColumnProps {
  day: Date
  isToday: boolean
  currentHour: number
  hours: number[]
  getEventsForSlot: (day: Date, hour: number) => ScheduleEvent[]
  onSlotClick: (day: Date, hour: number) => void
  onEventClick: (event: ScheduleEvent) => void
  onToggleComplete: (event: ScheduleEvent) => void
  dayHeader: string
}

function ScheduleDayColumn({
  day,
  isToday,
  currentHour,
  hours,
  getEventsForSlot,
  onSlotClick,
  onEventClick,
  onToggleComplete,
  dayHeader
}: ScheduleDayColumnProps) {
  return (
    <div className={`schedule-day-column ${isToday ? 'is-today' : ''}`}>
      <div className="schedule-day-header">
        <span className={isToday ? 'today-indicator' : ''}>{dayHeader}</span>
      </div>
      {hours.map(hour => {
        const slotEvents = getEventsForSlot(day, hour)
        const isCurrentHour = isToday && hour === currentHour
        return (
          <ScheduleTimeSlot
            key={hour}
            day={day}
            hour={hour}
            events={slotEvents}
            isCurrentHour={isCurrentHour}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
            onToggleComplete={onToggleComplete}
          />
        )
      })}
    </div>
  )
}

interface ScheduleTimeSlotProps {
  day: Date
  hour: number
  events: ScheduleEvent[]
  isCurrentHour: boolean
  onSlotClick: (day: Date, hour: number) => void
  onEventClick: (event: ScheduleEvent) => void
  onToggleComplete: (event: ScheduleEvent) => void
}

function ScheduleTimeSlot({
  day,
  hour,
  events,
  isCurrentHour,
  onSlotClick,
  onEventClick,
  onToggleComplete
}: ScheduleTimeSlotProps) {
  const slotId = `${day.toDateString()}-${hour}`
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { type: 'schedule-slot', day, hour }
  })

  return (
    <div
      ref={setNodeRef}
      className={`schedule-time-slot ${isOver ? 'slot-over' : ''} ${isCurrentHour ? 'current-hour-slot' : ''}`}
      onClick={() => events.length === 0 && onSlotClick(day, hour)}
    >
      {events.map(event => (
        <ScheduleEventCard
          key={event.id}
          event={event}
          onClick={() => onEventClick(event)}
          onToggleComplete={onToggleComplete}
        />
      ))}
    </div>
  )
}
