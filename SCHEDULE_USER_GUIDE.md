# Quick Start Guide - Schedule Feature

## Overview
Your Kanban app now includes a powerful scheduling system! You can create events, schedule cards, and manage your time with day, 3-day, and week views.

## Getting Started

### 1. Access the Schedule
- Look for the **view toggle buttons** at the top of the main content area
- Click **"Schedule View"** to switch from the Kanban board to the schedule

### 2. Navigate the Calendar

**View Modes:**
- **Day** - Shows one day with 24 hourly slots
- **3 Days** - Shows three consecutive days
- **Week** - Shows a full week (Sunday to Saturday)

**Date Navigation:**
- Click **Previous/Next arrows** to move through dates
- Click **"Today"** to jump back to the current date
- The current date header is highlighted in blue

### 3. Create Events

**Method 1: Click a Time Slot**
1. Click any empty time slot in the schedule
2. Fill in the event details
3. Click "Create Event"

**Method 2: Use the New Event Button**
1. Click **"New Event"** in the header
2. Fill in all event details
3. Click "Create Event"

**Event Properties:**
- **Title** (required) - Name of your event
- **Description** - Optional details
- **All Day** - Toggle for all-day events
- **Start/End Date & Time** - When the event occurs
- **Color** - Choose from 8 presets or pick custom
- **Status** - Scheduled, In Progress, Completed, or Cancelled
- **Priority** - Low, Medium, High, or Urgent
- **Tags** - Add comma-separated labels

### 4. Schedule Kanban Cards

**Drag and Drop from Board:**
1. Switch to **Board View**
2. Drag any card you want to schedule
3. Switch to **Schedule View** (while dragging if possible)
4. Drop the card on a time slot
5. An event is automatically created with:
   - Card's title and description
   - 1-hour default duration
   - Color matching the priority
   - Link to the original card

### 5. Manage Events

**Edit an Event:**
1. Click on any event in the schedule
2. Modify the details in the modal
3. Click "Update Event"

**Reschedule an Event:**
1. Click and drag an event
2. Drop it on a different time slot
3. The event time updates automatically

**Delete an Event:**
1. Click on the event
2. Click the **Delete** button in the modal
3. Confirm deletion

## Tips & Tricks

### Color Coding
- Use different colors for different types of events
- Example: Blue for meetings, Green for tasks, Red for urgent items

### Priority Levels
- **Urgent** - Events pulse with a red border (highest priority)
- **High** - Orange border
- **Medium** - Blue border (default)
- **Low** - Gray border

### Status Tracking
- **Scheduled** - Circle icon, default state
- **In Progress** - Pause icon, currently working
- **Completed** - Check icon, task done
- **Cancelled** - X icon, greyed out

### Tags for Organization
- Add tags like "work", "meeting", "personal"
- Use tags to categorize and identify events quickly
- Tags appear as small badges on events

### All-Day Events
- Check "All Day Event" for tasks without specific times
- All-day events appear at the top of each day (hour 0)
- Great for deadlines, holidays, or day-long activities

## Best Practices

1. **Plan Your Week**
   - Start each week in Week View to see the big picture
   - Schedule important tasks first

2. **Use Both Views**
   - Schedule View for time-based planning
   - Board View for task workflow
   - Switch between them as needed

3. **Link Cards to Events**
   - Drag cards from the board to schedule deadlines
   - Keeps both systems in sync

4. **Update Status**
   - Mark events as "In Progress" when you start
   - Change to "Completed" when done
   - This helps track productivity

5. **Color Your Calendar**
   - Develop a consistent color system
   - Makes it easy to identify event types at a glance

## Keyboard Shortcuts (Future)

Currently planning:
- Arrow keys for navigation
- Enter to create event
- Delete to remove event
- Esc to close modals

## Troubleshooting

**Events not saving?**
- Check that localStorage is enabled in your browser
- Try refreshing the page

**Can't drag cards?**
- Make sure you're clicking the drag handle (grip icon)
- Try clicking and holding for a moment before dragging

**Schedule looks compressed?**
- Try zooming out in your browser
- Switch to a larger view mode (e.g., Day view)
- Scroll horizontally to see all days

**Colors not showing?**
- Make sure you selected a color in the event modal
- Default color is blue if none selected

## Mobile Usage

**Touch Gestures:**
- Tap a time slot to create an event
- Tap an event to edit it
- Touch and hold to drag (events only, not cards on mobile)
- Swipe horizontally to scroll through days

**Mobile Optimizations:**
- Larger touch targets
- Simplified layout for small screens
- Horizontal scrolling for multi-day views
- Bottom sheet modals

## Example Workflows

### Morning Planning
1. Switch to Schedule View
2. Look at today (Day view)
3. Create events for today's priorities
4. Check Week view for upcoming items

### Weekly Review
1. Switch to Week view
2. Review completed events
3. Reschedule incomplete items
4. Plan next week's priorities

### Task Scheduling
1. Create cards in Board View for all tasks
2. Switch to Schedule View
3. Drag cards to appropriate time slots
4. Work through scheduled items

### Meeting Management
1. Create all-day or timed events for meetings
2. Use "In Progress" during meetings
3. Mark as "Completed" when done
4. Add notes in description for follow-ups

## What's Next?

The schedule is fully integrated and ready to use! Start by:
1. Creating your first event
2. Scheduling a card from your board
3. Experimenting with different view modes
4. Finding a workflow that works for you

Enjoy your enhanced productivity system!
