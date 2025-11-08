# DesAIgner 🎨

**A Real-Time Collaborative Design Platform with AI-Powered Suggestions**

Built for the MERNIFY Hackathon - A modern, performant design tool enabling teams to create, edit, and share visual designs on an infinite PixiJS canvas with multi-user live collaboration.

---

## 🌟 Project Overview

DesAIgner is a full-stack, real-time collaborative design application that empowers teams to work together on an infinite canvas. It combines high-performance graphics, live multi-user editing, and AI-powered tools for an intuitive design experience. Designed for creative professionals and students, it supports powerful shape, text, and asset tools, seamless project management, and foundation-level AI content suggestion. Built on MERN with PixiJS and strong security, DesAIgner is ideal for rapid visual prototyping and team brainstorming.

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB installed and running
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/melohub-xbit/DesAIgner.git
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
   - Copy the example env file:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your values:
     - MongoDB connection string
     - JWT secret
     - (Optional) Gemini AI API key

   - For client, configure `client/.env.example` if needed.

5. **Start MongoDB** (if not running)
   ```bash
   # Windows
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:5173`

7. **Open your browser**
   - Go to `http://localhost:5173`

---

## ✨ Feature List

### Core Features

- **Real-time Collaboration:** Multi-user, live design on the same canvas, with presence and cursor tracking.
- **Infinite PixiJS Canvas:** Pan/zoomable, high-performance design workspace.
- **Rich Tools:** Shape (rectangle, circle, triangle, arrow, line), freehand drawing, text, images, and transformation tools.
- **Layer Management:** Powerful layer panel for organization.
- **Properties Panel:** Edit position, size, rotation, colors, opacity, etc.
- **Undo/Redo:** Complete change history.
- **Asset Library:** Upload images, thumbnails auto-generated.
- **Export/Import:** Save as PNG, export/share entire projects as JSON.

### Collaboration & AI

- **Live Cursors & User Presence**
- **Real-Time Sync** for all changes
- **Collaborative Editing:** Multiple users editing different elements
- **AI Features (Foundation):**
  - Color palette suggestions
  - Layout recommendations
  - Auto-alignment

### UX & Productivity

- **Smooth Animations:** Framer Motion-powered
- **Responsive Design:** Works on desktop and tablets
- **Auto-save:** Every 2 seconds
- **Optimized Rendering:** PixiJS, 60fps, large projects supported
- **Toast Notifications:** All major actions

### Security

- JWT-based authentication
- Bcrypt password hashing
- CORS

### Hackathon Scope & Roadmap

- ✔️ All above features fully implemented for demo/hackathon
- 🚧 Planned: advanced shape tools, SVG/PDF export, group/ungroup, enhanced AI, Figma import, detailed comments, version history

---

## 🏗️ Tech Stack Used

### Frontend

- **React 18** – Component-based UI
- **PixiJS 7** – 2D rendering
- **Vite** – Fast dev/build
- **Tailwind CSS** – Utility-first styling
- **Zustand** – Global state management
- **Socket.io Client** – Real-time comms
- **Framer Motion** – Animations
- **React Router** – Routing
- **Axios** – HTTP

### Backend

- **Node.js** – Server runtime
- **Express** – REST API server
- **MongoDB** – NoSQL DB
- **Mongoose** – Object modeling
- **Socket.io** – WebSocket real-time server
- **JWT** – Auth
- **Multer/Sharp** – Image uploads
- **Helmet, Compression** – Security & performance

---

## 🗂️ Project Structure

```
DesAIgner/
├── client/                # React frontend
│   ├── src/
│   │    ├── components/
│   │    │    └── editor/       # Editor widgets
│   │    ├── pages/             # App pages
│   │    ├── store/             # Zustand logic
│   │    ├── utils/             # Helpers & services
│   │    ├── App.jsx
│   │    └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/               # Node backend
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── middleware/
│   └── index.js
├── uploads/              # User assets (gitignored)
├── .env.example          # Environment template
├── package.json          # Project scripts, dependencies
└── README.md
```

---

## 📋 Usage Highlights

- **Create Projects:** Sign up, use dashboard, "New Project"
- **Design Tools:** Select (ctrl+alt+V), Rectangle (ctrl+alt+R), Circle (ctrl+alt+C), Text (ctrl+alt+T), freehand drawing, asset uploads
- **Shortcuts:** For tools, Cmd/Ctrl+Z for undo, Shift+Z for redo, cmd/ctrl + mouse wheel to zoom
- **Collaboration:** Share project, see others live, instant updates

---

## 📦 Available NPM Scripts

- `npm run dev` — Run both backend and frontend
- `npm run server` — Server only
- `npm run client` — Client only
- `npm start` — Start server for production
- `npm run install-all` — Install all deps

#### Client

- `cd client && npm run dev` — Dev server (frontend only)
- `npm run build` — Build for production
- `npm run preview` — Preview prod build

---

## 🌐 API Endpoints

- **Auth:** `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- **Projects:** `GET/POST/PUT/DELETE /api/projects`
- **Assets:** `GET/POST/DELETE /api/assets`
- **AI:** `POST /api/ai/create-design`

## 🔌 Socket Events

- **Client → Server:** join-project, leave-project, element-add, element-update, cursor-move, etc.
- **Server → Client:** active-users, user-joined, element-added, element-updated, etc.

---

## 👨‍💻 Contributing

This project was built for the MERNIFY Hackathon. Contributions, issues, and feature requests are welcome!

---

## 📄 License

MIT License - feel free to use this project for learning or building upon it!

---

## ❤️ Acknowledgments

- MERNIFY Hackathon organizers
- PixiJS community
- React & Node.js communities

---

**Built with ❤️ for the MERNIFY Hackathon**