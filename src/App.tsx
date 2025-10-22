import { useEffect } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import KanbanBoard from './components/KanbanBoard'
import type { Board, AppState } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import './App.css'

function App() {
  const defaultAppState: AppState = {
    boards: [],
    activeBoard: null
  }

  const [appState, setAppState] = useLocalStorage<AppState>('kanban-app-state', defaultAppState)

  // Initialize with a welcome board only if no boards exist
  useEffect(() => {
    if (appState.boards.length === 0) {
      const welcomeBoard: Board = {
        id: uuidv4(),
        title: 'Welcome to Kanban',
        description: 'Your first board - feel free to rename or delete it!',
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
        activeBoard: welcomeBoard.id
      })
    }
  }, []) // Only run once on initial load

  // Set the first board as active if none is selected
  useEffect(() => {
    if (appState.boards.length > 0 && !appState.activeBoard) {
      setAppState((prev: AppState) => ({
        ...prev,
        activeBoard: prev.boards[0].id
      }))
    }
  }, [appState.boards, appState.activeBoard, setAppState])

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

  const handleUpdateBoard = (updatedBoard: Board) => {
    setAppState((prev: AppState) => ({
      ...prev,
      boards: prev.boards.map((board: Board) => 
        board.id === updatedBoard.id ? updatedBoard : board
      )
    }))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    // Handle drag and drop logic here
    console.log('Drag ended:', event)
  }

  return (
    <div className="app">
      <DndContext onDragEnd={handleDragEnd}>
        <Sidebar
          boards={appState.boards}
          activeBoard={appState.activeBoard}
          onCreateBoard={handleCreateBoard}
          onSelectBoard={handleSelectBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
          onReorderBoards={handleReorderBoards}
        />
        <main className="main-content">
          {activeBoard ? (
            <KanbanBoard 
              board={activeBoard} 
              onUpdateBoard={handleUpdateBoard}
            />
          ) : (
            <div className="empty-state">
              <h2>No Board Selected</h2>
              <p>Create a new board or select an existing one from the sidebar.</p>
            </div>
          )}
        </main>
      </DndContext>
    </div>
  )
}

export default App
