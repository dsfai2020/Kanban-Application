import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Calendar, Clock, CheckCircle, Circle } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './DayStatus.css'

interface CompletedCard {
  id: string
  title: string
  completedAt: string
}

interface ClockEntry {
  id: string
  clockIn: string
  clockOut?: string
  duration?: number // in minutes
  completedCards: CompletedCard[]
}

interface WorkShift {
  id: string
  name: string
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
  targetHours: number
}

interface DayGoals {
  targetMinutes: number // Daily time goal in minutes
  targetCards?: number  // Optional daily card completion goal
}

interface DayRecord {
  date: string
  isClosedOut: boolean
  closeOutTime?: string
  clockEntries: ClockEntry[]
  totalDuration: number
  totalCardsCompleted: number
  goals?: DayGoals
  workShift?: WorkShift
}

interface DayStatusData {
  currentDay: DayRecord
  history: DayRecord[]
  currentClockEntry?: ClockEntry
  savedWorkShifts: WorkShift[]
  allSessions: Record<string, ClockEntry[]> // All sessions by date
  closeOutStatus: Record<string, boolean> // Close-out status by date
}

const DayStatus: React.FC = () => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSessions, setShowSessions] = useState(true)
  const [showGoals, setShowGoals] = useState(false)
  const [showWorkShift, setShowWorkShift] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  
  // Initialize with today's date
  const defaultDayStatus: DayStatusData = {
    currentDay: {
      date: today,
      isClosedOut: false,
      clockEntries: [],
      totalDuration: 0,
      totalCardsCompleted: 0,
      goals: { targetMinutes: 480 } // Default 8 hours
    },
    history: [],
    currentClockEntry: undefined,
    savedWorkShifts: [
      {
        id: 'default-shift',
        name: 'Standard Shift',
        startTime: '09:00',
        endTime: '17:00',
        targetHours: 8
      },
      {
        id: 'early-shift',
        name: 'Early Shift',
        startTime: '06:00',
        endTime: '14:00',
        targetHours: 8
      },
      {
        id: 'late-shift',
        name: 'Late Shift',
        startTime: '14:00',
        endTime: '22:00',
        targetHours: 8
      },
      {
        id: 'night-shift',
        name: 'Night Shift',
        startTime: '22:00',
        endTime: '06:00',
        targetHours: 8
      }
    ],
    allSessions: {},
    closeOutStatus: {}
  }

  const [dayStatus, setDayStatus] = useLocalStorage<DayStatusData>('day-status-v2', defaultDayStatus)

  // Helper function to ensure dayStatus has all required properties
  const ensureDayStatusIntegrity = (status: DayStatusData): DayStatusData => {
    return {
      ...status,
      allSessions: status.allSessions || {},
      closeOutStatus: status.closeOutStatus || {},
      savedWorkShifts: status.savedWorkShifts || defaultDayStatus.savedWorkShifts
    }
  }

  // Helper function to safely access allSessions
  const safeGetAllSessions = () => {
    return dayStatus.allSessions || {}
  }

  // Helper function to safely access closeOutStatus
  const safeGetCloseOutStatus = () => {
    return dayStatus.closeOutStatus || {}
  }

  // Ensure data integrity on component mount
  useEffect(() => {
    if (!dayStatus.allSessions || !dayStatus.closeOutStatus) {
      console.log('Migrating dayStatus data structure...')
      setDayStatus(ensureDayStatusIntegrity(dayStatus))
    }
  }, [dayStatus, setDayStatus]) // Dependencies for safety

  // Data migration will be handled inline in components where needed

  // Initialize and load data on startup
  useEffect(() => {
    try {
      // Load today's sessions from persistent storage with safe access
      const allSessions = safeGetAllSessions()
      const closeOutStatus = safeGetCloseOutStatus()
      const todaySessions = allSessions[today] || []
      const todayCloseOutStatus = closeOutStatus[today] || false
    
      // Update current day with loaded sessions
      const totalDuration = todaySessions.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const totalCards = todaySessions.reduce((sum, entry) => sum + entry.completedCards.length, 0)
      
      if (dayStatus.currentDay.date !== today) {
        console.log('New day detected, finalizing previous day and starting new day')
        
        // Finalize previous day if it wasn't closed out properly
        let updatedHistory = [...dayStatus.history]
        const prevDate = dayStatus.currentDay.date
        
        if (!dayStatus.currentDay.isClosedOut && !closeOutStatus[prevDate]) {
          // Auto-close previous day and clock out if needed
          let finalCurrentDay = { ...dayStatus.currentDay }
          let updatedSessions = allSessions[prevDate] || []
          
          if (dayStatus.currentClockEntry) {
            const autoClockOut = new Date().toISOString()
            const completedEntry = {
              ...dayStatus.currentClockEntry,
              clockOut: autoClockOut,
              duration: calculateDuration(dayStatus.currentClockEntry.clockIn, autoClockOut)
            }
            updatedSessions.push(completedEntry)
            finalCurrentDay.clockEntries = updatedSessions
            finalCurrentDay.totalDuration = calculateTotalDuration(updatedSessions)
          }
          finalCurrentDay.isClosedOut = true
          finalCurrentDay.closeOutTime = 'Auto-closed for new day'
          updatedHistory.push(finalCurrentDay)
          
          // Update persistent storage
          const updatedAllSessions = { ...allSessions, [prevDate]: updatedSessions }
          const updatedCloseOutStatus = { ...closeOutStatus, [prevDate]: true }
          
          setDayStatus({
            currentDay: {
              date: today,
              isClosedOut: todayCloseOutStatus,
              clockEntries: todaySessions,
              totalDuration: totalDuration,
              totalCardsCompleted: totalCards,
              goals: { targetMinutes: 480 } // Default 8 hours
            },
            history: updatedHistory,
            currentClockEntry: undefined,
            savedWorkShifts: dayStatus.savedWorkShifts,
            allSessions: updatedAllSessions,
            closeOutStatus: updatedCloseOutStatus
          })
        } else {
          // Same day, just update with loaded session data
          setDayStatus({
            ...dayStatus,
            currentDay: {
              ...dayStatus.currentDay,
              clockEntries: todaySessions,
              totalDuration: totalDuration,
              totalCardsCompleted: totalCards,
              isClosedOut: todayCloseOutStatus
            }
          })
        }
      }
    } catch (error) {
      console.error('Error initializing day status:', error)
      // Fallback to default state if data is corrupted
      if (!dayStatus.allSessions || !dayStatus.closeOutStatus) {
        setDayStatus({
          ...dayStatus,
          allSessions: dayStatus.allSessions || {},
          closeOutStatus: dayStatus.closeOutStatus || {}
        })
      }
    }
  }, [dayStatus.currentDay.date, today, setDayStatus, dayStatus.currentClockEntry, dayStatus.currentDay, dayStatus.history])



  const calculateDuration = (clockIn: string, clockOut: string): number => {
    const start = new Date(clockIn).getTime()
    const end = new Date(clockOut).getTime()
    return Math.round((end - start) / (1000 * 60)) // minutes
  }

  const calculateTotalDuration = (entries: ClockEntry[]): number => {
    return entries.reduce((total, entry) => total + (entry.duration || 0), 0)
  }

  const calculateTotalCards = (entries: ClockEntry[]): number => {
    return entries.reduce((total, entry) => total + (entry.completedCards?.length || 0), 0)
  }

  // Helper function to ensure entry has completedCards array
  const ensureCompletedCards = (entry: ClockEntry): ClockEntry => {
    if (!entry.completedCards) {
      return { ...entry, completedCards: [] }
    }
    return entry
  }

  // Helper function to ensure day record has all required fields
  const ensureDayRecord = (record: DayRecord): DayRecord => {
    const updatedRecord = { ...record }
    updatedRecord.clockEntries = record.clockEntries.map(ensureCompletedCards)
    if (updatedRecord.totalCardsCompleted === undefined) {
      updatedRecord.totalCardsCompleted = calculateTotalCards(updatedRecord.clockEntries)
    }
    if (!updatedRecord.goals) {
      updatedRecord.goals = { targetMinutes: 480 } // Default 8 hours
    }
    return updatedRecord
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Validation: Ensure only one active session
  const validateSingleActiveSession = (): boolean => {
    const hasCurrentEntry = !!dayStatus.currentClockEntry
    const hasIncompleteEntry = dayStatus.currentDay.clockEntries.some(entry => !entry.clockOut)
    
    if (hasCurrentEntry && hasIncompleteEntry) {
      console.error('Data integrity issue: Multiple active sessions detected!')
      return false
    }
    return true
  }

  // Session management functions
  const removeSession = (sessionId: string) => {
    const updatedEntries = dayStatus.currentDay.clockEntries.filter(entry => entry.id !== sessionId)
    const updatedCurrentDay = {
      ...dayStatus.currentDay,
      clockEntries: updatedEntries,
      totalDuration: calculateTotalDuration(updatedEntries),
      totalCardsCompleted: calculateTotalCards(updatedEntries)
    }

    setDayStatus({
      ...dayStatus,
      currentDay: updatedCurrentDay
    })
    console.log(`Session ${sessionId} removed`)
  }

  const removeHistoryDay = (dateToRemove: string) => {
    const updatedHistory = dayStatus.history.filter(record => record.date !== dateToRemove)
    setDayStatus({
      ...dayStatus,
      history: updatedHistory
    })
    console.log(`History day ${dateToRemove} removed`)
  }

  // Card completion tracking (to be called from outside when cards are completed)
  const trackCardCompletion = (cardId: string, cardTitle: string) => {
    if (dayStatus.currentClockEntry) {
      const completedCard: CompletedCard = {
        id: cardId,
        title: cardTitle,
        completedAt: new Date().toISOString()
      }
      
      const updatedCurrentEntry = {
        ...dayStatus.currentClockEntry,
        completedCards: [...(dayStatus.currentClockEntry.completedCards || []), completedCard]
      }
      
      setDayStatus({
        ...dayStatus,
        currentClockEntry: updatedCurrentEntry
      })
      console.log(`Card completion tracked: ${cardTitle}`)
    }
  }

  // Goal management functions
  const updateDayGoal = (targetMinutes: number) => {
    const updatedCurrentDay = {
      ...dayStatus.currentDay,
      goals: {
        ...dayStatus.currentDay.goals,
        targetMinutes
      }
    }
    
    setDayStatus({
      ...dayStatus,
      currentDay: updatedCurrentDay
    })
    console.log(`Day goal updated to ${formatDuration(targetMinutes)}`)
  }

  const startWorkShift = (shiftId: string) => {
    const shift = dayStatus.savedWorkShifts.find(s => s.id === shiftId)
    if (shift) {
      const updatedCurrentDay = {
        ...dayStatus.currentDay,
        workShift: shift
      }
      
      setDayStatus({
        ...dayStatus,
        currentDay: updatedCurrentDay
      })
      console.log(`Work shift started: ${shift.name}`)
    }
  }

  const endWorkShift = () => {
    const updatedCurrentDay = {
      ...dayStatus.currentDay,
      workShift: undefined
    }
    
    setDayStatus({
      ...dayStatus,
      currentDay: updatedCurrentDay
    })
    console.log('Work shift ended')
  }

  // Calculate progress towards goals
  const calculateTimeProgress = (): number => {
    const currentMinutes = currentDay.totalDuration + (currentClockEntry ? 
      calculateDuration(currentClockEntry.clockIn, new Date().toISOString()) : 0)
    const targetMinutes = currentDay.goals?.targetMinutes || 480
    return Math.min((currentMinutes / targetMinutes) * 100, 100)
  }

  const calculateWorkShiftProgress = (): { isOnSchedule: boolean, minutesAhead: number, minutesBehind: number } => {
    if (!currentDay.workShift) {
      return { isOnSchedule: true, minutesAhead: 0, minutesBehind: 0 }
    }

    const now = new Date()
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()
    const [startHour, startMinute] = currentDay.workShift.startTime.split(':').map(Number)
    const [endHour, endMinute] = currentDay.workShift.endTime.split(':').map(Number)
    const shiftStartMinutes = startHour * 60 + startMinute
    const shiftEndMinutes = endHour * 60 + endMinute
    const shiftDurationMinutes = shiftEndMinutes - shiftStartMinutes

    // Calculate expected work time based on current time within shift
    if (currentTimeMinutes < shiftStartMinutes) {
      return { isOnSchedule: true, minutesAhead: 0, minutesBehind: 0 } // Before shift
    }
    
    if (currentTimeMinutes > shiftEndMinutes) {
      return { isOnSchedule: true, minutesAhead: 0, minutesBehind: 0 } // After shift
    }

    const timeIntoShift = currentTimeMinutes - shiftStartMinutes
    const expectedWorkTime = (timeIntoShift / shiftDurationMinutes) * (currentDay.workShift.targetHours * 60)
    const actualWorkTime = currentDay.totalDuration + (currentClockEntry ? 
      calculateDuration(currentClockEntry.clockIn, new Date().toISOString()) : 0)

    const difference = actualWorkTime - expectedWorkTime
    
    if (Math.abs(difference) <= 15) { // Within 15 minutes is considered on schedule
      return { isOnSchedule: true, minutesAhead: 0, minutesBehind: 0 }
    } else if (difference > 0) {
      return { isOnSchedule: false, minutesAhead: difference, minutesBehind: 0 }
    } else {
      return { isOnSchedule: false, minutesAhead: 0, minutesBehind: Math.abs(difference) }
    }
  }

  const handleClockToggle = () => {
    // Validate data integrity before proceeding
    if (!validateSingleActiveSession()) {
      alert('Data integrity issue detected. Please refresh and try again.')
      return
    }

    const now = new Date().toISOString()
    
    if (dayStatus.currentClockEntry) {
      // Clock out
      const completedEntry: ClockEntry = {
        ...dayStatus.currentClockEntry,
        clockOut: now,
        duration: calculateDuration(dayStatus.currentClockEntry.clockIn, now)
      }
      
      const updatedEntries = [...dayStatus.currentDay.clockEntries, completedEntry]
      const updatedCurrentDay = {
        ...dayStatus.currentDay,
        clockEntries: updatedEntries,
        totalDuration: calculateTotalDuration(updatedEntries),
        totalCardsCompleted: calculateTotalCards(updatedEntries)
      }
      
      // Update persistent session storage
      const updatedAllSessions = {
        ...dayStatus.allSessions,
        [today]: updatedEntries
      }
      
      setDayStatus({
        ...dayStatus,
        currentDay: updatedCurrentDay,
        currentClockEntry: undefined,
        allSessions: updatedAllSessions
      })
      console.log(`Clocked out at ${new Date(now).toLocaleTimeString()}`)
    } else {
      // Clock in - double check no incomplete sessions exist
      const incompleteSession = dayStatus.currentDay.clockEntries.find(entry => !entry.clockOut)
      if (incompleteSession) {
        alert('Found incomplete session. Please resolve data conflicts.')
        return
      }

      const newEntry: ClockEntry = {
        id: `${Date.now()}`,
        clockIn: now,
        completedCards: []
      }
      
      setDayStatus({
        ...dayStatus,
        currentClockEntry: newEntry
      })
      console.log(`Clocked in at ${new Date(now).toLocaleTimeString()}`)
    }
  }

  const handleCloseOut = () => {
    let finalCurrentDay = { ...dayStatus.currentDay }
    let finalEntries = [...finalCurrentDay.clockEntries]
    
    // Auto clock-out if currently clocked in
    if (dayStatus.currentClockEntry) {
      const now = new Date().toISOString()
      const completedEntry: ClockEntry = {
        ...dayStatus.currentClockEntry,
        clockOut: now,
        duration: calculateDuration(dayStatus.currentClockEntry.clockIn, now)
      }
      
      finalEntries = [...finalEntries, completedEntry]
      finalCurrentDay = {
        ...finalCurrentDay,
        clockEntries: finalEntries,
        totalDuration: calculateTotalDuration(finalEntries)
      }
    }
    
    finalCurrentDay.isClosedOut = true
    finalCurrentDay.closeOutTime = new Date().toISOString()
    
    // Move to history and reset current day for potential reopening
    const updatedHistory = [...dayStatus.history, finalCurrentDay]
    
    // Update persistent storage for close-out status and sessions
    const updatedAllSessions = {
      ...safeGetAllSessions(),
      [today]: finalEntries
    }
    
    const updatedCloseOutStatus = {
      ...safeGetCloseOutStatus(),
      [today]: true
    }
    
    setDayStatus({
      ...dayStatus,
      currentDay: finalCurrentDay,
      history: updatedHistory,
      currentClockEntry: undefined,
      allSessions: updatedAllSessions,
      closeOutStatus: updatedCloseOutStatus
    })
    console.log(`Day closed out at ${new Date().toLocaleTimeString()}`)
  }

  const handleReopenDay = () => {
    // Update persistent close-out status
    const updatedCloseOutStatus = {
      ...safeGetCloseOutStatus(),
      [today]: false
    }
    
    setDayStatus({
      ...dayStatus,
      currentDay: {
        ...dayStatus.currentDay,
        isClosedOut: false,
        closeOutTime: undefined
      },
      closeOutStatus: updatedCloseOutStatus
    })
    console.log('Day reopened')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Calendar helper functions
  const generateCalendarData = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Start from the first day of the month
    const firstDay = new Date(currentYear, currentMonth, 1)
    
    // Get the first Monday of the calendar (may be from previous month)
    const startDate = new Date(firstDay)
    startDate.setDate(firstDay.getDate() - (firstDay.getDay() + 6) % 7)
    
    // Generate 6 weeks of calendar data
    const calendarDays = []
    const currentDate = new Date(startDate)
    
    for (let week = 0; week < 6; week++) {
      const weekDays = []
      for (let day = 0; day < 7; day++) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const isCurrentMonth = currentDate.getMonth() === currentMonth
        const isToday = dateStr === today
        
        // Find history data for this date with safe access
        const allSessions = safeGetAllSessions()
        const closeOutStatus = safeGetCloseOutStatus()
        const historyData = dayStatus.history.find(record => record.date === dateStr) ||
                           allSessions[dateStr] ? {
                             date: dateStr,
                             isClosedOut: closeOutStatus[dateStr] || false,
                             clockEntries: allSessions[dateStr] || [],
                             totalDuration: (allSessions[dateStr] || []).reduce((sum, entry) => sum + (entry.duration || 0), 0),
                             totalCardsCompleted: (allSessions[dateStr] || []).reduce((sum, entry) => sum + entry.completedCards.length, 0)
                           } : null
        
        weekDays.push({
          date: dateStr,
          day: currentDate.getDate(),
          isCurrentMonth,
          isToday,
          hasData: !!historyData,
          data: historyData
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
      calendarDays.push(weekDays)
    }
    
    return {
      monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      weeks: calendarDays
    }
  }

  const isCurrentlyClockedIn = !!dayStatus.currentClockEntry
  // Ensure current day has all required fields
  const currentDay = ensureDayRecord(dayStatus.currentDay)
  // Ensure current clock entry has completedCards if it exists
  const currentClockEntry = dayStatus.currentClockEntry ? ensureCompletedCards(dayStatus.currentClockEntry) : undefined

  // Expose trackCardCompletion globally for integration with achievement system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).dayStatusTrackCard = trackCardCompletion
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).dayStatusTrackCard
      }
    }
  }, [trackCardCompletion])

  return (
    <div className="day-status-container">
      {/* Collapsible Header */}
      <div 
        className="day-status-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        tabIndex={0}
        aria-label={isCollapsed ? 'Show day status' : 'Hide day status'}
      >
        <div className="day-status-toggle-content">
          <div className="day-status-title">
            <Clock size={20} />
            <span>Day Management</span>
          </div>
          <div className="day-status-quick-info">
            <span className={`status-indicator ${currentDay.isClosedOut ? 'closed' : 'open'}`}>
              {currentDay.isClosedOut ? <CheckCircle size={16} /> : <Circle size={16} />}
              {currentDay.isClosedOut ? 'Closed' : 'Open'}
            </span>
            <span className="total-time">
              {formatDuration(currentDay.totalDuration + (currentClockEntry ? 
                calculateDuration(currentClockEntry.clockIn, new Date().toISOString()) : 0))}
            </span>
            <span className="progress-indicator">
              {calculateTimeProgress().toFixed(0)}% of goal
            </span>
          </div>
        </div>
        <div className="day-status-toggle-icon">
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="day-status-content">
          <div className="day-status-header">
            <div className="day-info">
              <h3 className="day-date">{formatDate(currentDay.date)}</h3>
              <div className={`day-indicator ${currentDay.isClosedOut ? 'closed-out' : 'open'}`}>
                {currentDay.isClosedOut ? '✅ Day Closed Out' : '⏳ Day Open'}
              </div>
            </div>
            <button 
              className="calendar-btn"
              onClick={() => setShowCalendar(!showCalendar)}
              title="View history"
            >
              <Calendar size={18} />
              History
            </button>
          </div>

          <div className="day-status-controls">
            {/* Clock In/Out Section */}
            <div className="clock-section">
              <div className="section-header">
                <Clock size={16} />
                <span>Time Tracking</span>
              </div>
              
              <button 
                className={`clock-btn ${isCurrentlyClockedIn ? 'clocked-in' : 'clocked-out'}`}
                onClick={handleClockToggle}
                disabled={currentDay.isClosedOut}
              >
                {isCurrentlyClockedIn ? '🔓 Clock Out' : '🔒 Clock In'}
              </button>
              
              {/* Current Session Info */}
              {currentClockEntry && (
                <div className="current-session">
                  <span className="session-label">Current Session:</span>
                  <span className="session-time">
                    {new Date(currentClockEntry.clockIn).toLocaleTimeString()} - 
                    {formatDuration(calculateDuration(currentClockEntry.clockIn, new Date().toISOString()))}
                  </span>
                </div>
              )}
              
              {/* Today's Sessions - Collapsible */}
              {currentDay.clockEntries.length > 0 && (
                <div className="clock-entries">
                  <div 
                    className="entries-header"
                    onClick={() => setShowSessions(!showSessions)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="entries-label">
                      Today's Sessions ({currentDay.clockEntries.length})
                    </span>
                    <div className="entries-toggle">
                      {showSessions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  
                  {showSessions && (
                    <div className="sessions-list">
                      {currentDay.clockEntries.map((entry) => {
                        const safeEntry = ensureCompletedCards(entry)
                        return (
                          <div key={safeEntry.id} className="clock-entry">
                            <div className="entry-main">
                              <span className="entry-time">
                                {new Date(safeEntry.clockIn).toLocaleTimeString()} - 
                                {safeEntry.clockOut ? new Date(safeEntry.clockOut).toLocaleTimeString() : 'In Progress'}
                              </span>
                              <span className="entry-duration">
                                {safeEntry.duration ? formatDuration(safeEntry.duration) : 'Ongoing'}
                              </span>
                            </div>
                            
                            {/* Cards completed during this session */}
                            <div className="entry-cards">
                              <span className="cards-label">Cards completed ({safeEntry.completedCards.length}):</span>
                              {safeEntry.completedCards.length > 0 ? (
                                safeEntry.completedCards.map((card) => (
                                  <span key={card.id} className="completed-card">
                                    {card.title}
                                  </span>
                                ))
                              ) : (
                                <span className="completed-card">No cards completed</span>
                              )}
                            </div>
                            
                            {/* Remove session button (only if day not closed) */}
                            {!currentDay.isClosedOut && (
                              <button
                                className="remove-session-btn"
                                onClick={() => {
                                  if (window.confirm(`Remove this session (${formatDuration(safeEntry.duration || 0)})?`)) {
                                    removeSession(safeEntry.id)
                                  }
                                }}
                                title="Remove session"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Out Section */}
            <div className="closeout-section">
              <div className="section-header">
                <CheckCircle size={16} />
                <span>Day Status</span>
              </div>
              
              {!currentDay.isClosedOut ? (
                <button 
                  className="closeout-btn open"
                  onClick={handleCloseOut}
                >
                  🏁 Close Out Day
                </button>
              ) : (
                <div className="closeout-complete">
                  <button 
                    className="closeout-btn closed"
                    onClick={handleReopenDay}
                  >
                    ✅ Day Closed Out
                  </button>
                  {currentDay.closeOutTime && (
                    <div className="time-info">
                      <span className="time-label">Closed: </span>
                      <span className="time-value">
                        {new Date(currentDay.closeOutTime).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="day-totals">
                <div className="total-time-display">
                  <span className="total-label">Total Time Today:</span>
                  <span className="total-value">
                    {formatDuration(currentDay.totalDuration + (currentClockEntry ? 
                      calculateDuration(currentClockEntry.clockIn, new Date().toISOString()) : 0))}
                  </span>
                </div>
                
                <div className="total-cards-display">
                  <span className="total-label">Cards Completed:</span>
                  <span className="total-value">
                    {currentDay.totalCardsCompleted + (currentClockEntry ? 
                      currentClockEntry.completedCards.length : 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Goals Section */}
            <div className="goals-section">
              <div 
                className="section-header clickable"
                onClick={() => setShowGoals(!showGoals)}
              >
                <CheckCircle size={16} />
                <span>Daily Goals</span>
                <div className="section-toggle">
                  {showGoals ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              
              {showGoals && (
                <div className="goals-content">
                  <div className="goal-item">
                    <div className="goal-info">
                      <span className="goal-label">Time Goal:</span>
                      {editingGoal ? (
                        <div className="goal-edit">
                          <input 
                            type="number" 
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            placeholder="Hours (e.g., 8)"
                            className="goal-input"
                          />
                          <button 
                            onClick={() => {
                              const hours = parseFloat(goalInput)
                              if (hours > 0) {
                                updateDayGoal(hours * 60)
                                setEditingGoal(false)
                                setGoalInput('')
                              }
                            }}
                            className="goal-save-btn"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => {
                              setEditingGoal(false)
                              setGoalInput('')
                            }}
                            className="goal-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="goal-display">
                          <span className="goal-value">
                            {formatDuration(currentDay.goals?.targetMinutes || 480)}
                          </span>
                          <button 
                            onClick={() => {
                              setEditingGoal(true)
                              setGoalInput(((currentDay.goals?.targetMinutes || 480) / 60).toString())
                            }}
                            className="goal-edit-btn"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${calculateTimeProgress()}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {calculateTimeProgress().toFixed(1)}% complete
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Work Shift Section */}
            <div className="workshift-section">
              <div 
                className="section-header clickable"
                onClick={() => setShowWorkShift(!showWorkShift)}
              >
                <Calendar size={16} />
                <span>Work Shift</span>
                <div className="section-toggle">
                  {showWorkShift ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              
              {showWorkShift && (
                <div className="workshift-content">
                  {currentDay.workShift ? (
                    <div className="active-shift">
                      <div className="shift-info">
                        <div className="shift-name">{currentDay.workShift.name}</div>
                        <div className="shift-time">
                          {currentDay.workShift.startTime} - {currentDay.workShift.endTime}
                        </div>
                        <div className="shift-target">
                          Target: {currentDay.workShift.targetHours}h
                        </div>
                      </div>
                      
                      <div className="shift-progress">
                        {(() => {
                          const progress = calculateWorkShiftProgress()
                          return (
                            <div className={`schedule-status ${progress.isOnSchedule ? 'on-schedule' : 'off-schedule'}`}>
                              {progress.isOnSchedule ? (
                                <span>✅ On Schedule</span>
                              ) : progress.minutesAhead > 0 ? (
                                <span>⚡ {formatDuration(progress.minutesAhead)} ahead</span>
                              ) : (
                                <span>⚠️ {formatDuration(progress.minutesBehind)} behind</span>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                      
                      <button 
                        onClick={endWorkShift}
                        className="end-shift-btn"
                      >
                        End Shift
                      </button>
                    </div>
                  ) : (
                    <div className="shift-selection">
                      <span className="shift-label">Select a work shift:</span>
                      {dayStatus.savedWorkShifts.map((shift) => (
                        <button
                          key={shift.id}
                          onClick={() => startWorkShift(shift.id)}
                          className="shift-option"
                        >
                          <div className="shift-option-name">{shift.name}</div>
                          <div className="shift-option-time">
                            {shift.startTime} - {shift.endTime} ({shift.targetHours}h)
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calendar/History View */}
          {showCalendar && (
            <div className="calendar-section">
              <div className="section-header">
                <Calendar size={16} />
                <span>Day History Calendar</span>
              </div>
              
              {(() => {
                try {
                  const calendarData = generateCalendarData()
                  return (
                  <div className="calendar-container">
                    <div className="calendar-header">
                      <h3>{calendarData.monthName}</h3>
                    </div>
                    
                    <div className="calendar-grid">
                      {/* Day headers */}
                      <div className="calendar-day-headers">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div key={day} className="calendar-day-header">{day}</div>
                        ))}
                      </div>
                      
                      {/* Calendar weeks */}
                      {calendarData.weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="calendar-week">
                          {week.map((dayData) => (
                            <div
                              key={dayData.date}
                              className={`calendar-day ${!dayData.isCurrentMonth ? 'other-month' : ''} ${dayData.isToday ? 'today' : ''} ${dayData.hasData ? 'has-data' : ''}`}
                              title={dayData.hasData ? `${formatDate(dayData.date)}: ${formatDuration(dayData.data?.totalDuration || 0)} worked, ${dayData.data?.totalCardsCompleted || 0} cards completed` : formatDate(dayData.date)}
                            >
                              <div className="calendar-day-number">{dayData.day}</div>
                              {dayData.hasData && (
                                <div className="calendar-day-indicators">
                                  <div className={`calendar-status-dot ${dayData.data?.isClosedOut ? 'closed' : 'open'}`}></div>
                                  <div className="calendar-day-stats">
                                    <div className="calendar-time">{formatDuration(dayData.data?.totalDuration || 0)}</div>
                                    {(dayData.data?.totalCardsCompleted || 0) > 0 && (
                                      <div className="calendar-cards">{dayData.data?.totalCardsCompleted}c</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    
                    {/* Legend */}
                    <div className="calendar-legend">
                      <div className="legend-item">
                        <div className="legend-dot closed"></div>
                        <span>Day closed out</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot open"></div>
                        <span>Day with sessions</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-today"></div>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                  )
                } catch (error) {
                  console.error('Error generating calendar:', error)
                  return (
                    <div className="calendar-error">
                      <p>Unable to display calendar. Please refresh the page.</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="refresh-btn"
                      >
                        Refresh Page
                      </button>
                    </div>
                  )
                }
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DayStatus