# 🎨 DesAIgner - Complete MERN Stack Collaborative Design Platform

## 🎯 Project Summary

DesAIgner is a **real-time collaborative design platform** built for the MERNIFY Hackathon. It enables teams to create, edit, and share visual designs on an infinite canvas with multi-user live collaboration and AI-powered design suggestions.

### Key Highlights

- ⚡ **Real-time Collaboration**: Multiple users editing simultaneously with live cursors
- 🎨 **High-Performance Canvas**: PixiJS-powered infinite canvas at 60fps
- 🤖 **AI-Powered**: Intelligent color suggestions and layout recommendations
- 🔒 **Secure**: JWT authentication with bcrypt password hashing
- 💾 **Auto-save**: Changes saved automatically every 2 seconds
- 📱 **Modern UI**: Beautiful dark theme with smooth animations

---

## 📦 What's Included

### Backend (`/server`)

```
server/
├── index.js              # Express server setup
├── models/               # MongoDB schemas
│   ├── User.js          # User authentication
│   ├── Project.js       # Design projects
│   └── Asset.js         # Uploaded assets
├── routes/              # API endpoints
│   ├── auth.js          # Registration/login
│   ├── projects.js      # CRUD operations
│   ├── assets.js        # File uploads
│   └── ai.js            # AI suggestions
├── socket/              # WebSocket handlers
│   └── handlers.js      # Real-time collaboration
└── middleware/          # Express middleware
    └── auth.js          # JWT verification
```

### Frontend (`/client`)

```
client/
├── src/
│   ├── pages/           # Main pages
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   └── Editor.jsx
│   ├── components/      # Reusable components
│   │   └── editor/
│   │       ├── Toolbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── PropertiesPanel.jsx
│   │       ├── PixiCanvas.jsx
│   │       └── CollaboratorCursors.jsx
│   ├── store/           # State management
│   │   ├── authStore.js
│   │   └── editorStore.js
│   └── utils/           # Utilities
│       ├── api.js       # HTTP client
│       └── socket.js    # WebSocket client
└── package.json
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Everything

```powershell
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### Step 2: Start MongoDB

```powershell
# Windows service
net start MongoDB

# Or manually
mongod --dbpath C:\data\db
```

### Step 3: Run the App

```powershell
npm run dev
```

**That's it!** Open http://localhost:5173 in your browser.

---

## 🎮 How to Use

### 1. Create Account

- Click "Sign up" on the login page
- Enter username, email, and password
- Automatic login after registration

### 2. Create Project

- Click "New Project" on dashboard
- Give it a name
- Opens in editor automatically

### 3. Design Tools

- **V** - Select and move elements
- **R** - Draw rectangles
- **C** - Draw circles
- **T** - Add text
- **Mouse wheel** - Pan canvas
- **Ctrl + wheel** - Zoom in/out

### 4. Edit Properties

- Select any element
- Adjust position, size, rotation, opacity
- Change colors with color picker
- Lock or hide elements

### 5. Collaborate

- Open same project in another browser tab/window
- See live cursors of other users
- Edit simultaneously in real-time

### 6. Upload Assets

- Click "Assets" tab in sidebar
- Drag & drop images
- Images processed and thumbnails generated

---

## 🏗️ Architecture

```
┌─────────────┐
│   React     │ ← User Interface (Vite + Tailwind)
│   + PixiJS  │ ← Canvas Rendering
└──────┬──────┘
       │
       │ HTTP/WebSocket
       │
┌──────▼──────┐
│   Express   │ ← REST API + Socket.io
│   + Node    │ ← Business Logic
└──────┬──────┘
       │
       │ Mongoose ODM
       │
┌──────▼──────┐
│   MongoDB   │ ← Data Persistence
└─────────────┘
```

---

## 🎨 Features Overview

### ✅ Implemented (Core)

- [x] User authentication (register, login, JWT)
- [x] Project management (create, read, update, delete)
- [x] Real-time collaboration (Socket.io rooms)
- [x] Design tools (rectangle, circle, text, select)
- [x] Property editing (position, size, color, rotation, opacity)
- [x] Layer management (list, select, visibility)
- [x] Undo/Redo (50-state history)
- [x] Asset upload (drag & drop, thumbnails)
- [x] Auto-save (2-second debounce)
- [x] Canvas operations (pan, zoom)
- [x] AI color suggestions
- [x] Live cursors & presence

### 🚧 Foundation Laid

- AI layout suggestions (API ready)
- Auto-alignment (API ready)
- Export functionality (UI ready)
- Stroke customization (partial)
- Grid system (partial)

---

## 🔧 Tech Stack Details

| Layer                  | Technology     | Why?                                  |
| ---------------------- | -------------- | ------------------------------------- |
| **Frontend Framework** | React 18       | Component-based, hooks, modern        |
| **Canvas**             | PixiJS 7       | Hardware acceleration, 60fps          |
| **Build Tool**         | Vite           | Lightning-fast HMR, ESM-native        |
| **Styling**            | Tailwind CSS   | Utility-first, rapid development      |
| **State**              | Zustand        | Simple, performant, less boilerplate  |
| **Animations**         | Framer Motion  | Smooth, declarative animations        |
| **Backend**            | Express.js     | Minimal, flexible, industry standard  |
| **Database**           | MongoDB        | Document model, flexible schema       |
| **ODM**                | Mongoose       | Validation, middleware, relationships |
| **Auth**               | JWT + bcrypt   | Stateless, secure, standard           |
| **Real-time**          | Socket.io      | Auto-reconnect, rooms, fallbacks      |
| **File Upload**        | Multer + Sharp | Multipart parsing, image processing   |
| **HTTP Client**        | Axios          | Interceptors, easy config             |

---

## 📊 Project Stats

- **Total Files**: ~30 core files
- **Lines of Code**: ~3,500+ lines
- **Dependencies**: 25+ npm packages
- **Development Time**: 30 hours (hackathon)
- **Performance**: 60fps rendering, <100ms collaboration latency

---

## 🎯 Perfect For

- **Hackathons**: Complete, working prototype
- **Learning**: Clean architecture, best practices
- **Portfolio**: Impressive full-stack project
- **Startups**: MVP foundation for design tool
- **Collaboration**: Remote team design work

---

## 🚀 Next Steps

1. **Try the Demo**

   ```powershell
   npm run dev
   ```

2. **Read the Docs**

   - `README.md` - Full documentation
   - `SETUP.md` - Installation guide
   - `ARCHITECTURE.md` - Technical deep-dive
   - `FEATURES.md` - Feature checklist

3. **Customize**

   - Change colors in `tailwind.config.js`
   - Add new tools in `PixiCanvas.jsx`
   - Extend API in `server/routes/`

4. **Deploy**
   - Follow deployment guide in `FEATURES.md`
   - Use MongoDB Atlas for database
   - Deploy to Render, Railway, or Vercel

---

## 🤝 Contributing

Built for MERNIFY Hackathon. Feel free to:

- Report bugs via GitHub issues
- Suggest features
- Submit pull requests
- Use as learning material
- Fork for your own projects

---

## 📝 License

MIT License - Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- **MERNIFY Hackathon** - For the inspiration and deadline
- **PixiJS Community** - For amazing documentation
- **React Team** - For the awesome framework
- **MongoDB** - For the flexible database

---

## 📞 Support

Questions? Issues? Ideas?

- Open a GitHub issue
- Check existing documentation
- Review code comments

---

## 🏆 Built With ❤️

**DesAIgner** - Where Design Meets AI and Collaboration

_Created for the MERNIFY Hackathon_
_Demonstrating full-stack MERN expertise with real-time features_

---

**Ready to build the next big design platform?** 🚀

Start with:

```powershell
npm run dev
```

Happy coding! 🎨✨
