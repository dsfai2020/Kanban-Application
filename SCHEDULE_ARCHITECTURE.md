# Schedule Component Architecture

## Component Hierarchy

```
App (src/App.tsx)
├── DndContext (drag & drop provider)
│   ├── Sidebar
│   └── main.main-content
│       ├── DayStatus
│       ├── div.view-toggle
│       │   ├── Button: Board View
│       │   └── Button: Schedule View
│       │
│       ├── Schedule (when showSchedule = true)
│       │   ├── div.schedule-header
│       │   │   ├── Controls
│       │   │   │   ├── Button: Today
│       │   │   │   ├── Navigation (Prev/Next)
│       │   │   │   └── h2: Date Range
│       │   │   └── View Mode Controls
│       │   │       ├── Button: Day
│       │   │       ├── Button: 3 Days
│       │   │       ├── Button: Week
│       │   │       └── Button: New Event
│       │   │
│       │   ├── div.schedule-grid
│       │   │   ├── div.schedule-time-column
│       │   │   │   ├── div.schedule-day-header (empty)
│       │   │   │   └── div.schedule-time-label × 24 (hours)
│       │   │   │
│       │   │   └── ScheduleDayColumn × N (1, 3, or 7 days)
│       │   │       ├── div.schedule-day-header
│       │   │       └── ScheduleTimeSlot × 24 (hours)
│       │   │           └── ScheduleEventCard × N (events)
│       │   │               ├── Event Header
│       │   │               │   ├── Status Icon
│       │   │               │   ├── Title
│       │   │               │   └── Time
│       │   │               ├── Description
│       │   │               └── Tags
│       │   │
│       │   └── EventModal (conditionally rendered)
│       │       ├── Modal Header
│       │       ├── Form
│       │       │   ├── Input: Title
│       │       │   ├── Textarea: Description
│       │       │   ├── Checkbox: All Day
│       │       │   ├── Date/Time Inputs
│       │       │   ├── Color Picker
│       │       │   ├── Select: Status
│       │       │   ├── Select: Priority
│       │       │   └── Input: Tags
│       │       └── Modal Actions
│       │           ├── Button: Delete (edit mode)
│       │           ├── Button: Cancel
│       │           └── Button: Create/Update
│       │
│       └── KanbanBoard (when showSchedule = false)
│           └── ... existing structure
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                          App State                          │
├─────────────────────────────────────────────────────────────┤
│  scheduleEvents: ScheduleEvent[]                           │
│  scheduleViewMode: 'day' | '3-day' | 'week'               │
│  selectedDate: Date                                        │
│  showSchedule: boolean                                     │
│  draggedItem: { type, data } | null                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─ localStorage: 'kanban-schedule-events'
                            │
        ┌───────────────────┴────────────────────┐
        │                                        │
        ▼                                        ▼
┌───────────────┐                      ┌──────────────────┐
│   Schedule    │                      │  KanbanBoard     │
└───────────────┘                      └──────────────────┘
        │                                        │
        ├─ onEventCreate ─────────────────────┐  │
        ├─ onEventUpdate ─────────────────────┤  │
        ├─ onEventDelete ─────────────────────┤  │
        └─ onViewModeChange ──────────────────┤  │
                                              │  │
                                              ▼  ▼
                                    ┌──────────────────┐
                                    │   App Handlers   │
                                    ├──────────────────┤
                                    │ handleEventCreate│
                                    │ handleEventUpdate│
                                    │ handleEventDelete│
                                    │ handleDragStart  │
                                    │ handleDragEnd    │
                                    └──────────────────┘
```

## Drag & Drop Flow

```
Card Dragged (Board)                 Event Dragged (Schedule)
       │                                      │
       ├─ onDragStart                        ├─ onDragStart
       │  └─ Set draggedItem                 │  └─ Set draggedItem
       │                                      │
       ├─ Dragging...                         ├─ Dragging...
       │  └─ Visual feedback                  │  └─ Visual feedback
       │                                      │
       ├─ Drop on ScheduleTimeSlot            ├─ Drop on ScheduleTimeSlot
       │  └─ over.data.current                │  └─ over.data.current
       │      { type: 'schedule-slot',        │      { type: 'schedule-slot',
       │        day: Date,                     │        day: Date,
       │        hour: number }                 │        hour: number }
       │                                      │
       └─ onDragEnd                           └─ onDragEnd
          └─ handleCardDroppedOnSchedule      └─ handleEventRescheduled
              │                                    │
              ├─ Create ScheduleEvent              ├─ Update event times
              │  with card data                    │  keep duration
              └─ Add to scheduleEvents             └─ Update scheduleEvents
```

## State Management

```
┌──────────────────────────────────────────────────────────┐
│                   localStorage                           │
├──────────────────────────────────────────────────────────┤
│  Key: 'kanban-schedule-events'                          │
│  Value: ScheduleEvent[]                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ScheduleEvent {                                    │ │
│  │   id: string                                       │ │
│  │   title: string                                    │ │
│  │   description?: string                             │ │
│  │   startTime: Date                                  │ │
│  │   endTime: Date                                    │ │
│  │   allDay: boolean                                  │ │
│  │   color?: string                                   │ │
│  │   status: EventStatus                              │ │
│  │   cardId?: string  ◄── Links to Kanban card        │ │
│  │   tags?: string[]                                  │ │
│  │   priority?: Priority                              │ │
│  │   createdAt: Date                                  │ │
│  │   updatedAt: Date                                  │ │
│  │ }                                                  │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Event Creation Flow

```
User Interaction
       │
       ├─ Click Time Slot ──────┐
       │                        │
       ├─ Click New Event ───────┤
       │                        │
       └─ Drop Card on Slot ─────┤
                                │
                                ▼
                        ┌───────────────┐
                        │ Set Modal     │
                        │ State         │
                        └───────────────┘
                                │
                                ├─ selectedSlot: { date, hour }
                                ├─ editingEvent: null
                                └─ isEventModalOpen: true
                                │
                                ▼
                        ┌───────────────┐
                        │ EventModal    │
                        │ Opens         │
                        └───────────────┘
                                │
                                ├─ User fills form
                                ├─ Selects color
                                ├─ Sets priority
                                └─ Adds tags
                                │
                                ▼
                        ┌───────────────┐
                        │ Click Create/ │
                        │ Update        │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ onSave        │
                        │ callback      │
                        └───────────────┘
                                │
                                ├─ Create: handleEventCreate
                                │  └─ Add new event with UUID
                                │
                                └─ Update: handleEventUpdate
                                   └─ Update existing event
                                │
                                ▼
                        ┌───────────────┐
                        │ setSchedule   │
                        │ Events        │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Save to       │
                        │ localStorage  │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Re-render     │
                        │ Schedule      │
                        └───────────────┘
```

## View Mode Rendering

```
ViewMode State
       │
       ├─ 'day' ────────────┐
       ├─ '3-day' ──────────┤
       └─ 'week' ───────────┤
                           │
                           ▼
                   ┌─────────────────┐
                   │ Calculate       │
                   │ displayDays[]   │
                   └─────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
   Day: [date]      3-Day: [d1,d2,d3]    Week: [Sun-Sat]
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │ Map to          │
                   │ ScheduleDay     │
                   │ Column × N      │
                   └─────────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │ Each column     │
                   │ renders 24      │
                   │ time slots      │
                   └─────────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │ Filter events   │
                   │ by day & hour   │
                   └─────────────────┘
                           │
                           ▼
                   ┌─────────────────┐
                   │ Render          │
                   │ ScheduleEvent   │
                   │ Cards           │
                   └─────────────────┘
```

## File Organization

```
src/
├── types/
│   ├── index.ts ─────────────── Re-exports all types
│   ├── schedule.ts ──────────── Schedule-specific types
│   └── achievements.ts ──────── Achievement types
│
├── components/
│   ├── Schedule.tsx ─────────── Main schedule container
│   ├── Schedule.css ─────────── Schedule grid & layout
│   │
│   ├── ScheduleEventCard.tsx ── Event display card
│   ├── ScheduleEventCard.css ── Event card styling
│   │
│   ├── EventModal.tsx ───────── Event create/edit form
│   ├── EventModal.css ───────── Modal form styling
│   │
│   ├── KanbanBoard.tsx ──────── Existing board
│   ├── Card.tsx ─────────────── Existing cards
│   └── ... other components
│
├── App.tsx ──────────────────── Root component with state
├── App.css ──────────────────── Global styles + theme
└── main.tsx ─────────────────── Entry point
```

## Integration Points

### With Kanban Board
- **Drag & Drop**: Cards can be dragged to schedule
- **Data Link**: Events can reference cards via `cardId`
- **Shared State**: Both use same `appState` in App.tsx

### With Theme System
- **CSS Variables**: Uses existing theme variables
- **Dark/Light Mode**: Automatically switches with theme
- **Consistent Styling**: Matches board aesthetics

### With localStorage
- **Persistence**: Events saved separately
- **Auto-save**: Changes persist immediately
- **Data Structure**: Compatible with existing save system

### With Authentication
- **User Context**: Events are per-user (guest or signed-in)
- **Profile Integration**: Could extend to sync settings
- **Data Isolation**: Each user has separate events

## Performance Considerations

### Memoization
- `displayDays` - Calculated only when view mode or date changes
- `eventsByDay` - Filtered when events or display days change
- `getEventsForSlot` - Wrapped in useCallback

### Rendering Optimization
- Individual event cards are separate components
- Time slots only re-render when events change
- Drag overlay uses separate render tree

### Data Structure
- Events indexed by date for fast lookup
- Flat array structure for simple updates
- UUID-based IDs for stable references

## Future Extension Points

### Recurring Events
- Add `recurrence` field to ScheduleEvent
- Expand events during rendering
- Store pattern, not instances

### Notifications
- Add `reminder` field with time offset
- Use browser Notification API
- Integrate with achievement system

### Multi-day Events
- Add `endDate` distinct from `endTime`
- Render spanning blocks
- Handle edge cases in grid

### Search/Filter
- Add search component above grid
- Filter by tags, status, priority
- Highlight matching events

### Export
- Add export button to header
- Generate iCal format
- Download or copy to clipboard
