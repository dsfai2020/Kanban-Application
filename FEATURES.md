# 🎯 Kanban Board Management System

A modern, feature-rich Kanban board application built with React, TypeScript, and Vite. This application allows you to manage multiple Kanban boards with advanced card features, all with a sleek dark theme and persistent data storage.

## ✨ Features

### 🏢 **Multi-Board Management**
- Create, rename, and delete multiple Kanban boards
- Trello-like sidebar for easy board navigation
- Board metadata display (columns count, cards count)
- Persistent board selection across sessions

### 📋 **Advanced Kanban Boards**
- Drag-and-drop functionality for cards between columns
- Add, edit, and delete columns dynamically
- Real-time updates and smooth animations

### 🃏 **Enhanced Cards**
- **Rich Card Details**: Title, description, priority, due dates, assignees
- **Tagging System**: Add and manage custom tags for organization
- **Interactive Checklists**: Create and manage task checklists with progress tracking
- **Priority Levels**: Low, Medium, High, and Urgent priorities with color coding
- **Due Date Management**: Set and track card deadlines
- **Assignee Tracking**: Assign cards to team members

### 🎨 **Modern Dark Theme**
- Sleek night-mode interface with professional aesthetics
- Smooth animations and hover effects
- Responsive design for desktop and mobile
- Custom scrollbars and modern UI components

### 💾 **Data Persistence**
- Automatic localStorage integration
- All changes persist across browser sessions
- No data loss on page refresh

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd Kanban
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎮 How to Use

### Managing Boards
1. **Create a Board**: Click the "+" button in the sidebar
2. **Rename a Board**: Click the "⋯" menu on any board → "Rename Board"
3. **Switch Boards**: Click on any board in the sidebar to view it
4. **Delete a Board**: Click the "⋯" menu → "Delete Board"

### Working with Columns
1. **Add Column**: Click "Add Column" on the right side of the board
2. **Edit Column**: Click the column title to rename it
3. **Delete Column**: Click "⋯" in column header → "Delete Column"

### Managing Cards
1. **Create Card**: Click "Add a card" in any column
2. **Edit Card**: Click "⋯" on card → "Edit" to access advanced features:
   - Set priority (Low/Medium/High/Urgent)
   - Add due dates
   - Assign to team members
   - Add custom tags
   - Create interactive checklists
3. **Move Cards**: Drag and drop cards between columns
4. **Delete Card**: Click "⋯" on card → "Delete"

### Advanced Card Features
- **Tags**: Organize cards with custom colored tags
- **Checklists**: Break down tasks with interactive checkboxes
- **Priority**: Visual priority indicators with color coding
- **Due Dates**: Calendar integration for deadline tracking
- **Assignees**: Track who's responsible for each task

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Styling**: Custom CSS with CSS Variables
- **State Management**: React Hooks + localStorage
- **Type Safety**: Full TypeScript integration

## 📁 Project Structure

```
src/
├── components/
│   ├── Card.tsx          # Enhanced card component
│   ├── CardModal.tsx     # Rich card editing modal
│   ├── Column.tsx        # Draggable column component
│   ├── KanbanBoard.tsx   # Main board with drag-and-drop
│   └── Sidebar.tsx       # Board management sidebar
├── hooks/
│   └── useLocalStorage.ts # localStorage persistence hook
├── types/
│   └── index.ts          # TypeScript type definitions
├── App.tsx               # Main application component
├── App.css              # Styling and dark theme
└── main.tsx             # Application entry point
```

## 🎨 Design Features

- **Dark Theme**: Professional night-mode interface
- **Smooth Animations**: Hover effects and transitions
- **Responsive Layout**: Works on desktop and mobile
- **Modern UI**: Rounded corners, subtle shadows, and clean typography
- **Color Coding**: Priority levels and status indicators
- **Interactive Elements**: Buttons, modals, and form components

## 💡 Key Features Implemented

✅ **Persistent Data Storage** - All changes saved automatically  
✅ **Board Renaming** - Edit board titles and descriptions  
✅ **Rich Card Features** - Priority, tags, checklists, due dates, assignees  
✅ **Modern Dark Theme** - Sleek professional interface  
✅ **Drag & Drop** - Intuitive card movement between columns  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Type Safety** - Full TypeScript implementation  

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌟 Future Enhancements

- Backend integration with REST API
- Real-time collaboration features
- File attachments for cards
- Advanced filtering and search
- Time tracking and analytics
- Email notifications
- Team management features

---

**Built with ❤️ using React, TypeScript, and Vite**