export type ScheduleViewMode = 'day' | '3-day' | 'week'

export type EventStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled'

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  allDay: boolean
  color?: string
  status: EventStatus
  cardId?: string // Link to Kanban card if created from card
  tags?: string[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  updatedAt: Date
}

export interface TimeSlot {
  hour: number
  minute: number
  events: ScheduleEvent[]
}

export interface DaySchedule {
  date: Date
  events: ScheduleEvent[]
}

export interface ScheduleState {
  events: ScheduleEvent[]
  viewMode: ScheduleViewMode
  selectedDate: Date
  draggedEvent: ScheduleEvent | null
}
