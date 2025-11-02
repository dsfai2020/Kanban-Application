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

interface DayRecord {
  date: string
  isClosedOut: boolean
  closeOutTime?: string
  clockEntries: ClockEntry[]
  totalDuration: number
  totalCardsCompleted: number
}

interface DayStatusData {
  currentDay: DayRecord
  history: DayRecord[]
  currentClockEntry?: ClockEntry
}

const DayStatus: React.FC = () => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSessions, setShowSessions] = useState(true)
  
  // Initialize with today's date
  const defaultDayStatus: DayStatusData = {
    currentDay: {
      date: today,
      isClosedOut: false,
      clockEntries: [],
      totalDuration: 0,
      totalCardsCompleted: 0
    },
    history: [],
    currentClockEntry: undefined
  }

  const [dayStatus, setDayStatus] = useLocalStorage<DayStatusData>('day-status-v2', defaultDayStatus)

  // Data migration will be handled inline in components where needed

  // Check if we need to reset for a new day
  useEffect(() => {
    if (dayStatus.currentDay.date !== today) {
      console.log('New day detected, finalizing previous day and starting new day')
      
      // Finalize previous day if it wasn't closed out properly
      let updatedHistory = [...dayStatus.history]
      if (!dayStatus.currentDay.isClosedOut) {
        // Auto-close previous day and clock out if needed
        let finalCurrentDay = { ...dayStatus.currentDay }
        if (dayStatus.currentClockEntry) {
          const autoClockOut = new Date().toISOString()
          finalCurrentDay.clockEntries.push({
            ...dayStatus.currentClockEntry,
            clockOut: autoClockOut,
            duration: calculateDuration(dayStatus.currentClockEntry.clockIn, autoClockOut)
          })
          finalCurrentDay.totalDuration = calculateTotalDuration(finalCurrentDay.clockEntries)
        }
        finalCurrentDay.isClosedOut = true
        finalCurrentDay.closeOutTime = 'Auto-closed for new day'
        updatedHistory.push(finalCurrentDay)
      }
      
      // Start new day
      setDayStatus({
        currentDay: {
          date: today,
          isClosedOut: false,
          clockEntries: [],
          totalDuration: 0,
          totalCardsCompleted: 0
        },
        history: updatedHistory,
        currentClockEntry: undefined
      })
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
        completedCards: [...dayStatus.currentClockEntry.completedCards, completedCard]
      }
      
      setDayStatus({
        ...dayStatus,
        currentClockEntry: updatedCurrentEntry
      })
      console.log(`Card completion tracked: ${cardTitle}`)
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
      
      setDayStatus({
        ...dayStatus,
        currentDay: updatedCurrentDay,
        currentClockEntry: undefined
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
    
    // Auto clock-out if currently clocked in
    if (dayStatus.currentClockEntry) {
      const now = new Date().toISOString()
      const completedEntry: ClockEntry = {
        ...dayStatus.currentClockEntry,
        clockOut: now,
        duration: calculateDuration(dayStatus.currentClockEntry.clockIn, now)
      }
      
      const updatedEntries = [...finalCurrentDay.clockEntries, completedEntry]
      finalCurrentDay = {
        ...finalCurrentDay,
        clockEntries: updatedEntries,
        totalDuration: calculateTotalDuration(updatedEntries)
      }
    }
    
    finalCurrentDay.isClosedOut = true
    finalCurrentDay.closeOutTime = new Date().toISOString()
    
    // Move to history and reset current day for potential reopening
    const updatedHistory = [...dayStatus.history, finalCurrentDay]
    
    setDayStatus({
      ...dayStatus,
      currentDay: finalCurrentDay,
      history: updatedHistory,
      currentClockEntry: undefined
    })
    console.log(`Day closed out at ${new Date().toLocaleTimeString()}`)
  }

  const handleReopenDay = () => {
    setDayStatus({
      ...dayStatus,
      currentDay: {
        ...dayStatus.currentDay,
        isClosedOut: false,
        closeOutTime: undefined
      }
    })
    console.log('Day reopened')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
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
                            {safeEntry.completedCards.length > 0 && (
                              <div className="entry-cards">
                                <span className="cards-label">Cards completed:</span>
                                {safeEntry.completedCards.map((card) => (
                                  <span key={card.id} className="completed-card">
                                    {card.title}
                                  </span>
                                ))}
                              </div>
                            )}
                            
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
          </div>

          {/* Calendar/History View */}
          {showCalendar && (
            <div className="calendar-section">
              <div className="section-header">
                <Calendar size={16} />
                <span>Day History</span>
              </div>
              
              {dayStatus.history.length === 0 ? (
                <p className="no-history">No previous days recorded yet.</p>
              ) : (
                <div className="history-list">
                  {dayStatus.history.slice(-10).reverse().map((record) => {
                    const safeRecord = ensureDayRecord(record)
                    return (
                      <div key={safeRecord.date} className="history-item">
                        <div className="history-main">
                          <div className="history-date">
                            {formatDate(safeRecord.date)}
                          </div>
                          <div className="history-stats">
                            <span className={`history-status ${safeRecord.isClosedOut ? 'closed' : 'open'}`}>
                              {safeRecord.isClosedOut ? 'Closed' : 'Open'}
                            </span>
                            <span className="history-time">
                              {formatDuration(safeRecord.totalDuration)}
                            </span>
                            <span className="history-sessions">
                              {safeRecord.clockEntries.length} sessions
                            </span>
                            <span className="history-cards">
                              {safeRecord.totalCardsCompleted} cards
                            </span>
                          </div>
                        </div>
                        
                        {/* Remove history day button */}
                        <button
                          className="remove-history-btn"
                          onClick={() => {
                            if (window.confirm(`Remove history for ${formatDate(safeRecord.date)}?`)) {
                              removeHistoryDay(safeRecord.date)
                            }
                          }}
                          title="Remove this day from history"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DayStatus