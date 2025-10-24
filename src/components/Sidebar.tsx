import { useState } from 'react'
import { 
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  type DragEndEvent
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Trash2, Edit2, ChevronUp, ChevronDown, GripVertical, Settings, User } from 'lucide-react'
import type { Board, User as UserType } from '../types'

interface SortableBoardItemProps {
  board: Board
  isActive: boolean
  isEditing: boolean
  expandedBoard: string | null
  editTitle: string
  editDescription: string
  onSelect: () => void
  onToggleMenu: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onSaveEdit: (e: React.FormEvent) => void
  onCancelEdit: () => void
  setEditTitle: (value: string) => void
  setEditDescription: (value: string) => void
}

function SortableBoardItem({
  board,
  isActive,
  isEditing,
  expandedBoard,
  editTitle,
  editDescription,
  onSelect,
  onToggleMenu,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  setEditTitle,
  setEditDescription
}: SortableBoardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="board-item editing">
        <form onSubmit={onSaveEdit} className="edit-board-form">
          <div className="form-group">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="form-input"
              placeholder="Board title"
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="form-textarea"
              placeholder="Board description (optional)"
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`board-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
    >
      <div className="board-drag-handle" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      <div className="board-info">
        <h3 className="board-title">{board.title}</h3>
        {board.description && (
          <p className="board-description">{board.description}</p>
        )}
        <div className="board-meta">
          <span className="board-columns">
            {board.columns.length} columns
          </span>
          <span className="board-cards">
            {board.columns.reduce((total, col) => total + col.cards.length, 0)} cards
          </span>
        </div>
      </div>
      <div className="board-actions">
        <button
          className="board-menu-btn"
          onClick={onToggleMenu}
          title="Board options"
        >
          <MoreHorizontal size={16} />
        </button>
        {expandedBoard === board.id && (
          <div className="board-menu">
            <button
              className="board-menu-item"
              onClick={onEdit}
            >
              <Edit2 size={14} />
              Rename Board
            </button>
            <button
              className="board-menu-item delete"
              onClick={onDelete}
            >
              <Trash2 size={14} />
              Delete Board
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface SidebarProps {
  boards: Board[]
  activeBoard: string | null
  onCreateBoard: (title: string, description?: string) => void
  onSelectBoard: (boardId: string) => void
  onRenameBoard: (boardId: string, newTitle: string, newDescription?: string) => void
  onDeleteBoard: (boardId: string) => void
  onReorderBoards: (boards: Board[]) => void
  onOpenSettings: () => void
  onOpenProfile: () => void
  onOpenSignIn: () => void
  user: UserType | null
  isGuest: boolean
}

export default function Sidebar({ 
  boards, 
  activeBoard, 
  onCreateBoard, 
  onSelectBoard, 
  onRenameBoard, 
  onDeleteBoard, 
  onReorderBoards,
  onOpenSettings,
  onOpenProfile,
  onOpenSignIn,
  user,
  isGuest
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [expandedBoard, setExpandedBoard] = useState<string | null>(null)
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex((board) => board.id === active.id)
      const newIndex = boards.findIndex((board) => board.id === over.id)
      
      const reorderedBoards = arrayMove(boards, oldIndex, newIndex)
      onReorderBoards(reorderedBoards)
    }
  }

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault()
    if (newBoardTitle.trim()) {
      onCreateBoard(newBoardTitle.trim(), newBoardDescription.trim() || undefined)
      setNewBoardTitle('')
      setNewBoardDescription('')
      setIsCreating(false)
    }
  }

  const handleEditBoard = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingBoard(board.id)
    setEditTitle(board.title)
    setEditDescription(board.description || '')
    setExpandedBoard(null)
  }

  const handleSaveEdit = (boardId: string, e: React.FormEvent) => {
    e.preventDefault()
    if (editTitle.trim()) {
      onRenameBoard(boardId, editTitle.trim(), editDescription.trim() || undefined)
      setEditingBoard(null)
      setEditTitle('')
      setEditDescription('')
    }
  }

  const handleCancelEdit = () => {
    setEditingBoard(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleDeleteBoard = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this board?')) {
      onDeleteBoard(boardId)
    }
  }

  const toggleBoardMenu = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedBoard(expandedBoard === boardId ? null : boardId)
  }

  const handleToggleCollapse = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsCollapsed(!isCollapsed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'hidden' : ''}`}>
      <div 
        className="sidebar-toggle" 
        onClick={handleToggleCollapse}
        onTouchEnd={handleToggleCollapse}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={isCollapsed ? 'Show boards' : 'Hide boards'}
      >
        <span className="sidebar-toggle-text">
          {isCollapsed ? 'Show Boards' : 'Kanban Boards'}
        </span>
        <div className="sidebar-toggle-icon">
          {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="sidebar-header">
            <h1 className="sidebar-title">
              {isGuest ? 'Kanban (Guest)' : 'Kanban Boards'}
            </h1>
            <div className="sidebar-header-actions">
              {user && (
                <button
                  className="profile-btn"
                  onClick={onOpenProfile}
                  title={`Profile - ${user.displayName || user.email}`}
                >
                  <User size={18} />
                </button>
              )}
              {isGuest && (
                <button
                  className="sign-in-btn"
                  onClick={onOpenSignIn}
                  title="Sign up to save your boards"
                >
                  <User size={18} />
                </button>
              )}
              <button
                className="settings-btn"
                onClick={onOpenSettings}
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button
                className="create-board-btn"
                onClick={() => setIsCreating(true)}
                title="Create new board"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Guest Notice */}
          {isGuest && (
            <div className="guest-notice">
              <h3>You're browsing as a guest</h3>
              <p>Your boards are only saved locally and will be lost when you clear your browser data.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={onOpenSignIn}
              >
                Sign Up to Save Permanently
              </button>
            </div>
          )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="boards-list">
          <SortableContext 
            items={boards.map(board => board.id)} 
            strategy={verticalListSortingStrategy}
          >
            {boards.map((board) => (
              <SortableBoardItem
                key={board.id}
                board={board}
                isActive={activeBoard === board.id}
                isEditing={editingBoard === board.id}
                expandedBoard={expandedBoard}
                editTitle={editTitle}
                editDescription={editDescription}
                onSelect={() => onSelectBoard(board.id)}
                onToggleMenu={(e) => toggleBoardMenu(board.id, e)}
                onEdit={(e) => handleEditBoard(board, e)}
                onDelete={(e) => handleDeleteBoard(board.id, e)}
                onSaveEdit={(e) => handleSaveEdit(board.id, e)}
                onCancelEdit={handleCancelEdit}
                setEditTitle={setEditTitle}
                setEditDescription={setEditDescription}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {isCreating && (
        <div className="create-board-form">
          <form onSubmit={handleCreateBoard}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Board title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="form-input"
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Board description (optional)"
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Board
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsCreating(false)
                  setNewBoardTitle('')
                  setNewBoardDescription('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

          {boards.length === 0 && !isCreating && (
            <div className="empty-boards">
              <p>No boards yet</p>
              <button
                className="btn btn-primary"
                onClick={() => setIsCreating(true)}
              >
                <Plus size={16} />
                Create your first board
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  )
}