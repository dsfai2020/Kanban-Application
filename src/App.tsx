import { useEffect, useState, useRef } from 'react'
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { v4 as uuidv4 } from 'uuid'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import KanbanBoard from './components/KanbanBoard'
import Schedule from './components/Schedule'
import SettingsModal from './components/SettingsModal'
import SignInModal from './components/SignInModal'
import ProfileModal from './components/ProfileModal'
import DayStatus from './components/DayStatus'
import type { Board, AppState, AppSettings, Card, ScheduleEvent, ScheduleViewMode } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { achievementManager } from './utils/achievementManager'
import AchievementNotificationsContainer, { useAchievementNotifications } from './components/AchievementNotificationsContainer'
import { localStorageDebug } from './utils/localStorageDebug'
import './App.css'

function KanbanApp() {
  const { authState } = useAuth()
  const defaultSettings: AppSettings = {
    columnCardLimit: 8,
    theme: 'dark',
    autoSave: true
  }

  const defaultAppState: AppState = {
    boards: [],
    activeBoard: null,
    settings: defaultSettings,
    user: null
  }

  const [appState, setAppState] = useLocalStorage<AppState>('kanban-app-state', defaultAppState)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const lastThemeRef = useRef<string | null>(null)
  
  // Schedule state
  const [scheduleEvents, setScheduleEvents] = useLocalStorage<ScheduleEvent[]>('kanban-schedule-events', [])
  const [scheduleViewMode, setScheduleViewMode] = useState<ScheduleViewMode>('week')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showSchedule, setShowSchedule] = useState(false)
  const [draggedItem, setDraggedItem] = useState<{ type: 'card' | 'event', data: Card | ScheduleEvent } | null>(null)
  
  // Achievement notifications
  const { notifications, showNotification, removeNotification } = useAchievementNotifications()

  // Expose debugging tools to window for testing (development only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).achievementManager = achievementManager
      ;(window as any).localStorageDebug = localStorageDebug
      
      // Auto-run localStorage diagnostic on app start
      if (import.meta.env.DEV) {
        console.log('🛠️ Development mode - localStorage diagnostic available')
        console.log('Run localStorageDebug.runFullDiagnostic() in console to test')
      }
    }
  }, [])

  // Sync user state with auth context
  useEffect(() => {
    if (authState.user !== appState.user) {
      setAppState((prev: AppState) => ({
        ...prev,
        user: authState.user
      }))
    }
  }, [authState.user, appState.user]) // Add appState.user to prevent unnecessary updates

  // Initialize achievement tracking (daily login is automatically tracked)
  useEffect(() => {
    if (authState.isAuthenticated || authState.isGuest) {
      // Set up achievement notification callback
      achievementManager.addNotificationCallback(showNotification)
      console.log('Achievement system initialized for user')
      
      // Cleanup callback on unmount or auth change
      return () => {
        achievementManager.removeNotificationCallback(showNotification)
      }
    }
  }, [authState.isAuthenticated, authState.isGuest, showNotification])

  // Initialize with a welcome board only if no boards exist and user is authenticated or guest
  useEffect(() => {
    if ((authState.isAuthenticated || authState.isGuest) && 
        appState.boards.length === 0 && 
        !authState.isLoading) {
      const welcomeBoard: Board = {
        id: uuidv4(),
        title: authState.isGuest ? 'Welcome Guest!' : 'Welcome to Kanban',
        description: authState.isGuest 
          ? 'You\'re using guest mode. Sign up to save your boards permanently!' 
          : 'Your first board - feel free to rename or delete it!',
        columns: [
          {
            id: uuidv4(),
            title: 'To Do',
            boardId: '',
            position: 0,
            cards: [
              {
                id: uuidv4(),
                title: 'Welcome to your Kanban board! 🎉',
                description: 'Click the menu (⋯) to edit this card and explore the features: priorities, tags, checklists, due dates, and more!',
                columnId: '',
                position: 0,
                tags: ['welcome', 'getting-started'],
                priority: 'medium',
                createdAt: new Date(),
                updatedAt: new Date(),
                checklist: [
                  {
                    id: 'check-1',
                    text: 'Explore the card editing features',
                    completed: false
                  },
                  {
                    id: 'check-2',
                    text: 'Create a new board',
                    completed: false
                  },
                  {
                    id: 'check-3',
                    text: 'Try drag and drop between columns',
                    completed: false
                  }
                ]
              }
            ]
          },
          {
            id: uuidv4(),
            title: 'In Progress',
            boardId: '',
            position: 1,
            cards: []
          },
          {
            id: uuidv4(),
            title: 'Done',
            boardId: '',
            position: 2,
            cards: []
          }
        ],
        createdAt: new Date(),
        isActive: true
      }

      setAppState({
        boards: [welcomeBoard],
        activeBoard: welcomeBoard.id,
        settings: appState.settings || defaultSettings,
        user: authState.user
      })
    }
  }, [authState.isAuthenticated, authState.isGuest, authState.isLoading, appState.boards.length, authState.user]) // Add missing dependencies

  // Apply theme to document
  useEffect(() => {
    const theme = authState.profile?.preferences.theme || appState.settings?.theme || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [authState.profile?.preferences.theme, appState.settings?.theme])

  // Show sign in modal if not authenticated and not a guest
  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated && !authState.isGuest) {
      setIsSignInOpen(true)
    } else {
      setIsSignInOpen(false)
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.isGuest])

  // Sync profile preferences with app settings
  useEffect(() => {
    if (authState.profile?.preferences) {
      const profileTheme = authState.profile.preferences.theme
      const currentTheme = appState.settings?.theme
      
      // Only update if theme actually changed and is different from last update
      if (profileTheme !== currentTheme && profileTheme !== lastThemeRef.current) {
        lastThemeRef.current = profileTheme
        
        const profileSettings: AppSettings = {
          columnCardLimit: appState.settings?.columnCardLimit || 8,
          theme: profileTheme,
          autoSave: authState.profile.preferences.autoSave,
        }
        
        setAppState((prev: AppState) => ({
          ...prev,
          settings: profileSettings
        }))
      }
    }
  }, [authState.profile?.preferences?.theme, authState.profile?.preferences?.autoSave, appState.settings?.theme]) // Specific dependencies

  // Set the first board as active if none is selected
  useEffect(() => {
    if (appState.boards.length > 0 && !appState.activeBoard) {
      const firstBoardId = appState.boards[0].id
      setAppState((prev: AppState) => ({
        ...prev,
        activeBoard: firstBoardId
      }))
    }
  }, [appState.boards.length, appState.activeBoard]) // Keep specific dependencies

  const activeBoard = appState.boards.find((board: Board) => board.id === appState.activeBoard)

  const handleCreateBoard = (title: string, description?: string) => {
    const newBoard: Board = {
      id: uuidv4(),
      title,
      description,
      columns: [
        {
          id: uuidv4(),
          title: 'To Do',
          boardId: '',
          position: 0,
          cards: [] // New boards start with empty columns
        },
        {
          id: uuidv4(),
          title: 'In Progress',
          boardId: '',
          position: 1,
          cards: [] // New boards start with empty columns
        },
        {
          id: uuidv4(),
          title: 'Done',
          boardId: '',
          position: 2,
          cards: [] // New boards start with empty columns
        }
      ],
      createdAt: new Date(),
      isActive: false
    }

    // Track board creation achievement
    try {
      achievementManager.trackBoardCreated()
    } catch (error) {
      console.warn('Achievement tracking failed:', error)
    }

    setAppState((prev: AppState) => ({
      ...prev,
      boards: [...prev.boards, newBoard]
    }))
  }

  const handleSelectBoard = (boardId: string) => {
    setAppState((prev: AppState) => ({
      ...prev,
      activeBoard: boardId
    }))
  }

  const handleRenameBoard = (boardId: string, newTitle: string, newDescription?: string) => {
    setAppState((prev: AppState) => ({
      ...prev,
      boards: prev.boards.map((board: Board) => 
        board.id === boardId 
          ? { ...board, title: newTitle, description: newDescription }
          : board
      )
    }))
  }

  const handleDeleteBoard = (boardId: string) => {
    setAppState((prev: AppState) => {
      const updatedBoards = prev.boards.filter((board: Board) => board.id !== boardId)
      const newActiveBoard = prev.activeBoard === boardId 
        ? (updatedBoards.length > 0 ? updatedBoards[0].id : null)
        : prev.activeBoard

      return {
        ...prev,
        boards: updatedBoards,
        activeBoard: newActiveBoard
      }
    })
  }

  const handleReorderBoards = (reorderedBoards: Board[]) => {
    setAppState((prev: AppState) => ({
      ...prev,
      boards: reorderedBoards
    }))
  }

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setAppState((prev: AppState) => ({
      ...prev,
      settings: newSettings
    }))
  }

  const handleUpdateBoard = (updatedBoard: Board) => {
    setAppState((prev: AppState) => ({
      ...prev,
      boards: prev.boards.map((board: Board) => 
        board.id === updatedBoard.id ? updatedBoard : board
      )
    }))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    // Determine what's being dragged
    if (active.data.current?.type === 'card') {
      setDraggedItem({ type: 'card', data: active.data.current.card as Card })
    } else if (active.data.current?.type === 'schedule-event') {
      setDraggedItem({ type: 'event', data: active.data.current.event as ScheduleEvent })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedItem(null)

    if (!over) return

    // Handle card dropped on schedule slot
    if (over.data.current?.type === 'schedule-slot' && active.data.current?.type === 'card') {
      const card = active.data.current.card as Card
      const { day, hour } = over.data.current
      handleCardDroppedOnSchedule(card, day, hour)
    }
    
    // Handle event dropped on schedule slot (rescheduling)
    if (over.data.current?.type === 'schedule-slot' && active.data.current?.type === 'schedule-event') {
      const event = active.data.current.event as ScheduleEvent
      const { day, hour } = over.data.current
      handleEventRescheduled(event, day, hour)
    }
  }

  const handleCardDroppedOnSchedule = (card: Card, date: Date, hour: number) => {
    const startTime = new Date(date)
    startTime.setHours(hour, 0, 0, 0)
    
    const endTime = new Date(startTime)
    endTime.setHours(hour + 1, 0, 0, 0)

    const newEvent: ScheduleEvent = {
      id: uuidv4(),
      title: card.title,
      description: card.description,
      startTime,
      endTime,
      allDay: false,
      color: card.priority === 'urgent' ? '#dc2626' : 
             card.priority === 'high' ? '#f59e0b' :
             card.priority === 'medium' ? '#3b82f6' : '#6b7280',
      status: 'scheduled',
      cardId: card.id,
      tags: card.tags,
      priority: card.priority,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setScheduleEvents(prev => [...prev, newEvent])
  }

  const handleEventRescheduled = (event: ScheduleEvent, date: Date, hour: number) => {
    const startTime = new Date(date)
    startTime.setHours(hour, 0, 0, 0)
    
    const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
    const endTime = new Date(startTime.getTime() + duration)

    setScheduleEvents(prev => 
      prev.map(e => e.id === event.id ? { ...e, startTime, endTime, updatedAt: new Date() } : e)
    )
  }

  const handleEventCreate = (eventData: Omit<ScheduleEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent: ScheduleEvent = {
      ...eventData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setScheduleEvents(prev => [...prev, newEvent])
  }

  const handleEventUpdate = (event: ScheduleEvent) => {
    setScheduleEvents(prev => 
      prev.map(e => e.id === event.id ? event : e)
    )
  }

  const handleEventDelete = (eventId: string) => {
    setScheduleEvents(prev => prev.filter(e => e.id !== eventId))
  }

  return (
    <div className="app">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Sidebar
          boards={appState.boards}
          activeBoard={appState.activeBoard}
          onCreateBoard={handleCreateBoard}
          onSelectBoard={handleSelectBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          onReorderBoards={handleReorderBoards}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSignIn={() => setIsSignInOpen(true)}
          user={authState.user}
          isGuest={authState.isGuest}
        />
        <main className="main-content">
          {!authState.isAuthenticated && !authState.isGuest ? (
            <div className="auth-required">
              <h2>Welcome to Kanban</h2>
              <p>Please sign in to access your boards and start organizing your tasks.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setIsSignInOpen(true)}
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Day Status - appears at top when authenticated */}
              <DayStatus />
              
              {/* View Toggle */}
              <div className="view-toggle">
                <button
                  className={`btn ${!showSchedule ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setShowSchedule(false)}
                >
                  Board View
                </button>
                <button
                  className={`btn ${showSchedule ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setShowSchedule(true)}
                >
                  Schedule View
                </button>
              </div>

              {showSchedule ? (
                <Schedule
                  events={scheduleEvents}
                  viewMode={scheduleViewMode}
                  selectedDate={selectedDate}
                  onViewModeChange={setScheduleViewMode}
                  onDateChange={setSelectedDate}
                  onEventCreate={handleEventCreate}
                  onEventUpdate={handleEventUpdate}
                  onEventDelete={handleEventDelete}
                />
              ) : activeBoard ? (
                <KanbanBoard 
                  board={activeBoard} 
                  onUpdateBoard={handleUpdateBoard}
                  settings={appState.settings || defaultSettings}
                />
              ) : (
                <div className="empty-state">
                  <h2>No Board Selected</h2>
                  <p>Create a new board or select an existing one from the sidebar.</p>
                </div>
              )}
            </>
          )}
        </main>
      </DndContext>
      
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={appState.settings || defaultSettings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleUpdateSettings}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Achievement Notifications */}
      <AchievementNotificationsContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <KanbanApp />
    </AuthProvider>
  )
}

export default App
