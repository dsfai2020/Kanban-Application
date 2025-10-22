import { useState } from 'react'
import { 
  DndContext, 
  DragOverlay, 
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { 
  SortableContext, 
  arrayMove, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import Column from './Column'
import Card from './Card'
import type { Board, Column as ColumnType, Card as CardType } from '../types'

interface KanbanBoardProps {
  board: Board
  onUpdateBoard: (board: Board) => void
}

export default function KanbanBoard({ board, onUpdateBoard }: KanbanBoardProps) {
  const [columns, setColumns] = useState(board.columns)

  // Sync columns with board changes and persist to parent
  const updateColumns = (newColumns: ColumnType[]) => {
    setColumns(newColumns)
    onUpdateBoard({
      ...board,
      columns: newColumns
    })
  }
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = findCard(active.id as string)
    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeCard = findCard(activeId)
    const overCard = findCard(overId)

    if (!activeCard) return

    const activeColumn = findColumnByCardId(activeId)
    const overColumn = overCard ? findColumnByCardId(overId) : findColumn(overId)

    if (!activeColumn || !overColumn) return

    if (activeColumn.id !== overColumn.id) {
      const activeCards = activeColumn.cards
      const overCards = overColumn.cards
      const overIndex = overCard ? overCards.findIndex(card => card.id === overId) : overCards.length

      updateColumns(columns.map(column => {
        if (column.id === activeColumn.id) {
          return {
            ...column,
            cards: activeCards.filter(card => card.id !== activeId)
          }
        } else if (column.id === overColumn.id) {
          return {
            ...column,
            cards: [
              ...overCards.slice(0, overIndex),
              { ...activeCard, columnId: overColumn.id },
              ...overCards.slice(overIndex)
            ]
          }
        }
        return column
      }))
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeCard = findCard(activeId)
    const overCard = findCard(overId)

    if (!activeCard) return

    const activeColumn = findColumnByCardId(activeId)
    const overColumn = overCard ? findColumnByCardId(overId) : findColumn(overId)

    if (!activeColumn || !overColumn) return

    if (activeColumn.id === overColumn.id) {
      const activeIndex = activeColumn.cards.findIndex(card => card.id === activeId)
      const overIndex = overCard ? activeColumn.cards.findIndex(card => card.id === overId) : activeColumn.cards.length

      updateColumns(columns.map(column => {
        if (column.id === activeColumn.id) {
          return {
            ...column,
            cards: arrayMove(column.cards, activeIndex, overIndex)
          }
        }
        return column
      }))
    }
  }

  const findCard = (cardId: string): CardType | undefined => {
    for (const column of columns) {
      const card = column.cards.find(card => card.id === cardId)
      if (card) return card
    }
  }

  const findColumn = (columnId: string): ColumnType | undefined => {
    return columns.find(column => column.id === columnId)
  }

  const findColumnByCardId = (cardId: string): ColumnType | undefined => {
    return columns.find(column => 
      column.cards.some(card => card.id === cardId)
    )
  }

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (newColumnTitle.trim()) {
      const newColumn: ColumnType = {
        id: `col-${Date.now()}`,
        title: newColumnTitle.trim(),
        boardId: board.id,
        position: columns.length,
        cards: []
      }
      updateColumns([...columns, newColumn])
      setNewColumnTitle('')
      setIsCreatingColumn(false)
    }
  }

  return (
    <div className="kanban-board">
      <div className="board-header">
        <h1 className="board-title">{board.title}</h1>
        {board.description && (
          <p className="board-description">{board.description}</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="columns-container">
          <SortableContext 
            items={columns.map(col => col.id)} 
            strategy={verticalListSortingStrategy}
          >
            {columns.map((column) => (
              <Column 
                key={column.id} 
                column={column}
                onUpdateColumn={(updatedColumn: ColumnType) => {
                  updateColumns(columns.map(col => 
                    col.id === updatedColumn.id ? updatedColumn : col
                  ))
                }}
                onDeleteColumn={(columnId: string) => {
                  updateColumns(columns.filter(col => col.id !== columnId))
                }}
              />
            ))}
          </SortableContext>

          <div className="add-column">
            {isCreatingColumn ? (
              <form onSubmit={handleCreateColumn} className="add-column-form">
                <input
                  type="text"
                  placeholder="Enter column title"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="form-input"
                  autoFocus
                  required
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-sm">
                    Add Column
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsCreatingColumn(false)
                      setNewColumnTitle('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="add-column-btn"
                onClick={() => setIsCreatingColumn(true)}
              >
                <Plus size={20} />
                Add Column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? <Card card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}