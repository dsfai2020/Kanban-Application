# Schedule Component Documentation

## Overview

The Schedule component is a fully-featured calendar and scheduling system integrated with the Kanban board. It allows you to create, manage, and visualize events with drag-and-drop functionality from the Kanban board.

## Features

### View Modes
- **Day View**: Single day with hourly time slots
- **3-Day View**: Three consecutive days for short-term planning
- **Week View**: Full 7-day week starting from Sunday

### Event Customization
Events support the following properties:
- **Title** (required): Event name
- **Description**: Optional detailed description
- **Time**: Start and end times, or all-day events
- **Color**: Visual color coding with preset colors and custom color picker
- **Status**: Scheduled, In Progress, Completed, or Cancelled
- **Priority**: Low, Medium, High, or Urgent
- **Tags**: Comma-separated labels for categorization

### Drag and Drop

#### From Board to Schedule
1. Switch to Board View
2. Drag any card from the Kanban board
3. Drop it onto a time slot in the Schedule
4. A new event is created with:
   - Card's title and description
   - Default 1-hour duration
   - Color based on priority
   - Linked to the original card

#### Within Schedule
1. Drag any event in the Schedule
2. Drop it on a different time slot
3. Event is rescheduled while maintaining duration

### Event Creation
- Click any empty time slot to create an event
- Click "New Event" button in the header
- Events can be edited by clicking them

### Event Management
- **Edit**: Click an event to open the edit modal
- **Delete**: Use the delete button in the edit modal
- **Update**: Modify any property and save

## User Interface

### Header Controls
- **Navigation**: Previous/Next buttons to move through dates
- **Today**: Jump to current date
- **Date Range**: Display of current view period
- **View Mode Buttons**: Switch between Day/3-Day/Week
- **New Event**: Create event button

### Schedule Grid
- **Time Column**: Fixed left column showing hours (12 AM - 11 PM)
- **Day Columns**: One or more columns showing days
- **Time Slots**: Hourly slots (60px height each)
- **Current Day Indicator**: Highlighted header for today
- **Hover Effects**: Visual feedback on time slots

### Event Display
Events show:
- Status icon (Circle for scheduled, CheckCircle for completed, etc.)
- Title
- Time range (for non-all-day events)
- Description (truncated)
- Tags
- Color-coded left border
- Priority-based styling (urgent events pulse)

## Styling

### Theme Integration
The schedule uses the existing Kanban theme variables:
- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`: Backgrounds
- `--text-primary`, `--text-secondary`: Text colors
- `--accent-primary`, `--success`, `--danger`: Accent colors
- `--border-color`: Borders and dividers
- `--shadow-sm`, `--shadow-md`: Drop shadows
- `--radius-sm`, `--radius-lg`: Border radius

### Responsive Design
- Mobile-optimized with touch-friendly targets
- Horizontal scroll for multiple day views
- Sticky time column and day headers
- Adaptive font sizes and spacing

## Code Structure

### Components

#### `Schedule.tsx`
Main schedule container component
- Props: events, viewMode, selectedDate, handlers
- Manages view state and date navigation
- Renders grid layout and day columns
- Handles slot clicks and event modal

#### `ScheduleEventCard.tsx`
Individual event display component
- Draggable event card
- Shows event details with icons
- Status and priority styling
- Click handler for editing

#### `EventModal.tsx`
Event creation/editing modal
- Form with all event properties
- Color picker with presets
- Date/time inputs
- Save/delete actions

### Types (`src/types/schedule.ts`)

```typescript
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
  cardId?: string // Link to Kanban card
  tags?: string[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  updatedAt: Date
}
```

### State Management

Schedule state is managed in `App.tsx`:
- `scheduleEvents`: Array of all events (persisted in localStorage)
- `scheduleViewMode`: Current view mode
- `selectedDate`: Currently displayed date
- `showSchedule`: Toggle between board and schedule views

## Integration with Kanban Board

### Drag and Drop System
Uses `@dnd-kit/core` for drag-and-drop:
- Kanban cards expose `type: 'card'` in drag data
- Schedule slots expose `type: 'schedule-slot'` with date and hour
- Events expose `type: 'schedule-event'`
- `handleDragEnd` in App.tsx processes drops

### Data Synchronization
- Events linked to cards store `cardId`
- Completed events can track card completion
- Priority and tags transferred from cards to events
- Both systems use localStorage for persistence

## Usage Example

### Creating an Event
1. Switch to Schedule View
2. Click "New Event" or click a time slot
3. Fill in event details:
   - Title: "Team Meeting"
   - Time: 2:00 PM - 3:00 PM
   - Color: Blue
   - Status: Scheduled
   - Priority: High
4. Click "Create Event"

### Scheduling a Card
1. Switch to Board View
2. Find a card you want to schedule
3. Switch to Schedule View
4. Drag the card from memory or:
   - Go back to Board View
   - Drag card and drop on schedule (when both are visible)
5. Event is created with card details

### Rescheduling
1. Click and drag any event
2. Drop on new time slot
3. Event time updates while maintaining duration

## Best Practices

1. **Use All-Day Events** for tasks without specific times
2. **Color Code** by category or team
3. **Set Priorities** for important events
4. **Use Tags** for filtering and organization
5. **Link Cards** for tasks that need scheduling
6. **Update Status** as work progresses

## Future Enhancements

Potential additions:
- Recurring events
- Event reminders/notifications
- Multi-day events (spanning multiple days)
- Month view
- Search and filter by tags/status
- Export to calendar formats (iCal, Google Calendar)
- Collaboration features
- Time zone support
