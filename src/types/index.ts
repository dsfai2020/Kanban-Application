export interface Card {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  position: number;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignee?: string;
  checklist?: ChecklistItem[];
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Column {
  id: string;
  title: string;
  boardId: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  createdAt: Date;
  isActive: boolean;
}

export interface AppSettings {
  columnCardLimit: number;
  theme: 'dark' | 'light';
  autoSave: boolean;
}

export interface AppState {
  boards: Board[];
  activeBoard: string | null;
  settings: AppSettings;
}