import React, { useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './DayStatus.css'

interface DayStatusData {
  isClosedOut: boolean
  clockedIn: boolean
  clockInTime?: string
  clockOutTime?: string
  closeOutTime?: string
  date: string
}

const DayStatus: React.FC = () => {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Initialize with today's date
  const defaultDayStatus: DayStatusData = {
    isClosedOut: false,
    clockedIn: false,
    date: today
  }

  const [dayStatus, setDayStatus] = useLocalStorage<DayStatusData>('day-status', defaultDayStatus)

  // Check if we need to reset for a new day
  useEffect(() => {
    if (dayStatus.date !== today) {
      console.log('New day detected, resetting day status')
      setDayStatus({
        isClosedOut: false,
        clockedIn: false,
        date: today
      })
    }
  }, [dayStatus.date, today, setDayStatus])

  const handleClockToggle = () => {
    const now = new Date()
    const timeString = now.toLocaleTimeString()
    
    if (dayStatus.clockedIn) {
      // Clock out
      setDayStatus({
        ...dayStatus,
        clockedIn: false,
        clockOutTime: timeString
      })
      console.log(`Clocked out at ${timeString}`)
    } else {
      // Clock in
      setDayStatus({
        ...dayStatus,
        clockedIn: true,
        clockInTime: timeString,
        clockOutTime: undefined // Clear previous clock out time
      })
      console.log(`Clocked in at ${timeString}`)
    }
  }

  const handleCloseOut = () => {
    const now = new Date()
    const timeString = now.toLocaleTimeString()
    
    setDayStatus({
      ...dayStatus,
      isClosedOut: true,
      closeOutTime: timeString
    })
    console.log(`Day closed out at ${timeString}`)
  }

  const handleReopenDay = () => {
    setDayStatus({
      ...dayStatus,
      isClosedOut: false,
      closeOutTime: undefined
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

  return (
    <div className="day-status-container">
      <div className="day-status-header">
        <h2 className="day-status-date">{formatDate(dayStatus.date)}</h2>
        <div className={`day-status-indicator ${dayStatus.isClosedOut ? 'closed-out' : 'open'}`}>
          {dayStatus.isClosedOut ? '✅ Day Closed Out' : '⏳ Day Open'}
        </div>
      </div>

      <div className="day-status-controls">
        {/* Clock In/Out Button */}
        <div className="clock-section">
          <button 
            className={`clock-btn ${dayStatus.clockedIn ? 'clocked-in' : 'clocked-out'}`}
            onClick={handleClockToggle}
            disabled={dayStatus.isClosedOut}
          >
            {dayStatus.clockedIn ? '🔓 Clock Out' : '🔒 Clock In'}
          </button>
          
          {dayStatus.clockInTime && (
            <div className="time-info">
              <span className="time-label">In: </span>
              <span className="time-value">{dayStatus.clockInTime}</span>
            </div>
          )}
          
          {dayStatus.clockOutTime && (
            <div className="time-info">
              <span className="time-label">Out: </span>
              <span className="time-value">{dayStatus.clockOutTime}</span>
            </div>
          )}
        </div>

        {/* Close Out Button */}
        <div className="closeout-section">
          {!dayStatus.isClosedOut ? (
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
              {dayStatus.closeOutTime && (
                <div className="time-info">
                  <span className="time-label">Closed: </span>
                  <span className="time-value">{dayStatus.closeOutTime}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="day-status-summary">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className={`status-value ${dayStatus.isClosedOut ? 'closed' : 'open'}`}>
            {dayStatus.isClosedOut ? 'Closed Out' : 'Open'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Clock:</span>
          <span className={`status-value ${dayStatus.clockedIn ? 'in' : 'out'}`}>
            {dayStatus.clockedIn ? 'Clocked In' : 'Clocked Out'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default DayStatus