import { useState } from 'react'
import { Plus, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import type { Board } from '../types'

interface SidebarProps {
  boards: Board[]
  activeBoard: string | null
  onCreateBoard: (title: string, description?: string) => void
  onSelectBoard: (boardId: string) => void
  onRenameBoard: (boardId: string, newTitle: string, newDescription?: string) => void
  onDeleteBoard: (boardId: string) => void
}

export default function Sidebar({ 
  boards, 
  activeBoard, 
  onCreateBoard, 
  onSelectBoard, 
  onRenameBoard,
  onDeleteBoard 
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [newBoardDescription, setNewBoardDescription] = useState('')
  const [expandedBoard, setExpandedBoard] = useState<string | null>(null)
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')

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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">Kanban Boards</h1>
        <button
          className="create-board-btn"
          onClick={() => setIsCreating(true)}
          title="Create new board"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="boards-list">
        {boards.map((board) => (
          <div key={board.id}>
            {editingBoard === board.id ? (
              <div className="board-item editing">
                <form onSubmit={(e) => handleSaveEdit(board.id, e)} className="edit-board-form">
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
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                className={`board-item ${activeBoard === board.id ? 'active' : ''}`}
                onClick={() => onSelectBoard(board.id)}
              >
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
                    onClick={(e) => toggleBoardMenu(board.id, e)}
                    title="Board options"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {expandedBoard === board.id && (
                    <div className="board-menu">
                      <button
                        className="board-menu-item"
                        onClick={(e) => handleEditBoard(board, e)}
                      >
                        <Edit2 size={14} />
                        Rename Board
                      </button>
                      <button
                        className="board-menu-item delete"
                        onClick={(e) => handleDeleteBoard(board.id, e)}
                      >
                        <Trash2 size={14} />
                        Delete Board
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
    </aside>
  )
}