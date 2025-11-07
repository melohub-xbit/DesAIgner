# DesAIgner 🎨

**A Real-Time Collaborative Design Platform with AI-Powered Suggestions**

Built for the MERNIFY Hackathon - A modern, performant design tool enabling teams to create, edit, and share visual designs on an infinite PixiJS canvas with multi-user live collaboration.

## 🌟 Features

### Core Features

- **Real-time Collaboration**: Multiple users can work on the same project simultaneously with live cursor tracking
- **Infinite PixiJS Canvas**: High-performance canvas rendering with pan and zoom capabilities
- **Rich Design Tools**:
  - Shape tools (Rectangle, Circle)
  - Text tool with customizable fonts and sizes
  - Image upload and asset management
  - Selection and transformation tools
- **Layer Management**: Organize and manage design elements with a comprehensive layer panel
- **Properties Panel**: Fine-tune element properties (position, size, rotation, opacity, colors)
- **Undo/Redo**: Full history management for all design actions
- **Asset Library**: Upload and manage images with automatic thumbnail generation

### Collaboration Features

- **Live Cursors**: See collaborators' cursors in real-time
- **User Presence**: Track who's currently working on the project
- **Real-time Sync**: All changes sync instantly across all connected users
- **Collaborative Editing**: Multiple users can edit different elements simultaneously

### AI-Powered Features

- **Gemini Layout Assistant**: Generate ready-to-use layouts with Google Gemini
- **Color Suggestions**: AI-powered color palette generation
- **Layout Suggestions**: Smart layout recommendations
- **Auto-alignment**: Intelligent element alignment

### UX & Performance

- **Smooth Animations**: Powered by Framer Motion
- **Responsive Design**: Works on desktop and tablet devices
- **Auto-save**: Changes automatically saved every 2 seconds
- **Optimized Rendering**: PixiJS ensures 60fps performance
- **Toast Notifications**: User-friendly feedback for all actions

## 🏗️ Tech Stack

### Frontend

- **React 18** - UI framework
- **PixiJS 7** - High-performance 2D rendering
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Multer & Sharp** - Image upload and processing
- **Helmet** - Security middleware
- **Compression** - Response compression

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB installed and running
- npm or yarn package manager

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd DesAIgner
```

2. **Install server dependencies**

```bash
npm install
```

3. **Install client dependencies**

```bash
cd client
npm install
cd ..
```

4. **Set up environment variables**

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your values:
# - MongoDB connection string
# - JWT secret
# - Google Gemini API key (from AI Studio)
# - Optional: override GEMINI_MODEL if you prefer a different Gemini release
```

5. **Start MongoDB** (if not already running)

```bash
# On Windows (if installed as service)
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

6. **Start the development servers**

```bash
# Run both frontend and backend concurrently
npm run dev
```

This will start:

- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:5173`

7. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
DesAIgner/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   └── editor/   # Editor-specific components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand state management
│   │   ├── utils/        # Utilities (API, Socket)
│   │   ├── App.jsx       # Root component
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Node.js backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── socket/           # Socket.io handlers
│   ├── middleware/       # Express middleware
│   └── index.js          # Server entry point
│
├── uploads/              # User-uploaded assets (gitignored)
├── .env.example          # Environment variables template
├── package.json          # Server dependencies
└── README.md
```

## 🎮 Usage Guide

### Creating a Project

1. Sign up or log in
2. Click "New Project" on the dashboard
3. Enter a project name and start designing

### Using Design Tools

- **Select Tool (V)**: Click to select elements, drag to move
- **Rectangle Tool (R)**: Click to create rectangles
- **Circle Tool (C)**: Click to create circles
- **Text Tool (T)**: Click to add text elements

### Keyboard Shortcuts

- `V` - Select tool
- `R` - Rectangle tool
- `C` - Circle tool
- `T` - Text tool
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Delete` - Delete selected element
- `Mouse Wheel` - Pan canvas
- `Ctrl/Cmd + Mouse Wheel` - Zoom

### Canvas Navigation

- **Pan**: Scroll with mouse wheel
- **Zoom**: Hold Ctrl/Cmd and scroll
- **Zoom Controls**: Use +/- buttons in toolbar

### Collaboration

1. Share project with collaborators via email
2. Collaborators can join and edit in real-time
3. See live cursors and presence indicators

## 🔧 Available Scripts

### Root (Server)

```bash
npm run dev          # Run both client and server
npm run server       # Run server only
npm run client       # Run client only
npm start            # Production server
npm run install-all  # Install all dependencies
```

### Client

```bash
cd client
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects

- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/collaborators` - Add collaborator

### Assets

- `GET /api/assets` - Get user assets
- `POST /api/assets/upload` - Upload asset
- `DELETE /api/assets/:id` - Delete asset

### AI

- `POST /api/ai/design` - Generate a Gemini-powered layout
- `POST /api/ai/suggest-colors` - Get color suggestions
- `POST /api/ai/suggest-layout` - Get layout suggestions
- `POST /api/ai/auto-align` - Auto-align elements

## 🔌 Socket Events

### Client → Server

- `join-project` - Join project room
- `leave-project` - Leave project room
- `element-add` - Add new element
- `element-update` - Update element
- `element-delete` - Delete element
- `cursor-move` - Update cursor position
- `selection-change` - Change selection

### Server → Client

- `active-users` - Current users in project
- `user-joined` - User joined project
- `user-left` - User left project
- `element-added` - Element was added
- `element-updated` - Element was updated
- `element-deleted` - Element was deleted
- `cursor-moved` - User cursor moved

## 🎯 Hackathon Focus Areas

### ✅ Implemented (30-hour scope)

- [x] Real-time collaboration with Socket.io
- [x] High-performance PixiJS canvas
- [x] User authentication and authorization
- [x] Project management (CRUD)
- [x] Basic design tools (shapes, text)
- [x] Asset upload and management
- [x] Properties panel
- [x] Layer management
- [x] Undo/Redo functionality
- [x] Auto-save
- [x] Responsive UI with Tailwind
- [x] Live cursors and presence
- [x] AI foundations (color suggestions)

### 🚀 Future Enhancements

- [ ] More shape tools (polygon, line, star)
- [ ] Vector path editing
- [ ] Advanced text formatting (bold, italic, alignment)
- [ ] Grouping and ungrouping
- [ ] Layer effects (shadows, blur)
- [ ] Export to PNG/SVG/PDF
- [ ] Templates library
- [ ] Version history
- [ ] Comments and annotations
- [ ] Advanced AI features (design suggestions, auto-complete)
- [ ] Integrations (Figma import, etc.)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Helmet.js security headers
- CORS configuration
- File upload validation
- Input sanitization
- Protected API routes

## 🎨 Design Decisions

### Why PixiJS?

- **Performance**: Hardware-accelerated rendering, 60fps even with hundreds of objects
- **Flexibility**: Complete control over rendering pipeline
- **Ecosystem**: Rich plugin ecosystem and community

### Why Zustand?

- **Simplicity**: Less boilerplate than Redux
- **Performance**: Optimized re-renders
- **Developer Experience**: Great TypeScript support and devtools

### Why Socket.io?

- **Reliability**: Automatic reconnection and fallbacks
- **Room Support**: Easy multi-user room management
- **Events**: Intuitive event-based communication

## 🐛 Known Issues & Limitations

- Text editing is basic (single-line, limited formatting)
- No mobile support (desktop/tablet only)
- Export functionality is placeholder
- AI features are simplified for hackathon scope

## 👥 Contributing

This project was built for the MERNIFY Hackathon. Contributions, issues, and feature requests are welcome!

## 📝 License

MIT License - feel free to use this project for learning or building upon it!

## 🙏 Acknowledgments

- MERNIFY Hackathon organizers
- PixiJS community
- React and Node.js communities

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for the MERNIFY Hackathon**
