# DesAIgner - Development Guide

## 🛠️ Development Workflow

### Starting Development

```powershell
# Terminal 1: Start MongoDB (if not running as service)
mongod --dbpath C:\data\db

# Terminal 2: Start dev servers (from project root)
npm run dev
```

This starts both servers with hot-reload enabled:

- Backend: http://localhost:5000 (with nodemon)
- Frontend: http://localhost:5173 (with Vite HMR)

### Stopping Development

```powershell
# Press Ctrl+C in the terminal running npm run dev
# MongoDB can be stopped with:
net stop MongoDB
```

---

## 📁 Code Organization Best Practices

### Frontend Component Structure

```javascript
// Good: Separate concerns
const MyComponent = () => {
  // 1. Hooks at the top
  const [state, setState] = useState();
  const navigate = useNavigate();

  // 2. Event handlers
  const handleClick = () => {};

  // 3. Effects
  useEffect(() => {}, []);

  // 4. Render helpers
  const renderItem = () => {};

  // 5. Return JSX
  return <div>...</div>;
};
```

### Backend Route Structure

```javascript
// Good: Consistent pattern
router.post("/", auth, async (req, res) => {
  try {
    // 1. Validate input
    // 2. Process logic
    // 3. Database operations
    // 4. Send response
    res.json({ data, message });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Message" });
  }
});
```

---

## 🎨 Adding New Features

### 1. Adding a New Shape Tool

**Frontend: `client/src/components/editor/PixiCanvas.jsx`**

```javascript
// Add tool to toolbar
const tools = [
  // ... existing tools
  { id: 'triangle', icon: Triangle, label: 'Triangle (T)' },
];

// Add creation handler
const handlePointerDown = (event) => {
  // ... existing code
  else if (activeTool === 'triangle') {
    createTriangle(pos.x, pos.y);
  }
};

// Add creation function
const createTriangle = (x, y) => {
  const element = {
    id: `triangle_${Date.now()}`,
    type: 'triangle',
    x: x / zoom - pan.x / zoom,
    y: y / zoom - pan.y / zoom,
    width: 100,
    height: 100,
    fill: '#10b981',
    // ... other properties
  };

  addElement(element);
  socketService.emitElementAdd(projectId, element);
};

// Add rendering logic
const renderElements = () => {
  // ... existing code
  if (element.type === 'triangle') {
    pixiObject = new Graphics();
    pixiObject.moveTo(element.width / 2, 0);
    pixiObject.lineTo(element.width, element.height);
    pixiObject.lineTo(0, element.height);
    pixiObject.closePath();
    pixiObject.fill(element.fill);
  }
};
```

**Backend: `server/models/Project.js`**

```javascript
// Add to element type enum
type: {
  type: String,
  required: true,
  enum: ['rectangle', 'circle', 'text', 'image', 'triangle'] // Add here
}
```

### 2. Adding a New API Endpoint

**Backend: `server/routes/projects.js`**

```javascript
// Add new route
router.post("/:id/duplicate", auth, async (req, res) => {
  try {
    const original = await Project.findById(req.params.id);

    if (!original) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check permission
    if (!original.owner.equals(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create duplicate
    const duplicate = new Project({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await duplicate.save();

    res.status(201).json({
      project: duplicate,
      message: "Project duplicated",
    });
  } catch (error) {
    console.error("Duplicate error:", error);
    res.status(500).json({ error: "Failed to duplicate project" });
  }
});
```

**Frontend: `client/src/utils/api.js`**

```javascript
export const projectsAPI = {
  // ... existing methods
  duplicate: (id) => api.post(`/projects/${id}/duplicate`),
};
```

**Frontend: Use in component**

```javascript
const handleDuplicate = async (projectId) => {
  try {
    const { data } = await projectsAPI.duplicate(projectId);
    toast.success("Project duplicated!");
    loadProjects(); // Refresh list
  } catch (error) {
    toast.error("Failed to duplicate project");
  }
};
```

### 3. Adding Real-time Feature

**Backend: `server/socket/handlers.js`**

```javascript
// Add new event handler
socket.on("element-lock", async ({ projectId, elementId, locked }) => {
  try {
    socket.to(projectId).emit("element-locked", {
      elementId,
      locked,
      userId: socket.id,
    });
  } catch (error) {
    console.error("Lock error:", error);
  }
});
```

**Frontend: `client/src/utils/socket.js`**

```javascript
emitElementLock(projectId, elementId, locked) {
  if (this.socket) {
    this.socket.emit('element-lock', { projectId, elementId, locked });
  }
}
```

**Frontend: Setup listener in Editor**

```javascript
const setupSocketListeners = () => {
  const socket = socketService.connect();

  socket.on("element-locked", ({ elementId, locked, userId }) => {
    useEditorStore.getState().updateElement(elementId, { locked });
    toast(`Element ${locked ? "locked" : "unlocked"}`);
  });
};
```

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**

- [ ] Register with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Access protected route when logged out (should redirect)
- [ ] Logout and verify redirect

**Projects:**

- [ ] Create new project
- [ ] List all projects
- [ ] Open existing project
- [ ] Delete project
- [ ] Auto-save verification (check MongoDB after 2s)

**Canvas:**

- [ ] Add rectangle
- [ ] Add circle
- [ ] Add text
- [ ] Select elements (single, multiple)
- [ ] Move elements
- [ ] Delete elements
- [ ] Undo/redo

**Properties:**

- [ ] Change position
- [ ] Change size
- [ ] Change rotation
- [ ] Change opacity
- [ ] Change colors
- [ ] Lock/unlock
- [ ] Show/hide

**Collaboration:**

- [ ] Open in 2 windows
- [ ] See other user's cursor
- [ ] Add element in one window, see in other
- [ ] Edit element in one window, see in other
- [ ] User join/leave notifications

**Assets:**

- [ ] Upload image (drag & drop)
- [ ] Upload image (click)
- [ ] View thumbnails
- [ ] Delete asset

---

## 🐛 Debugging Tips

### Frontend Debugging

```javascript
// Add to component
useEffect(() => {
  console.log("Elements changed:", elements);
}, [elements]);

// Check Zustand state
console.log("Store state:", useEditorStore.getState());

// Socket events
socketService.on("element-added", (data) => {
  console.log("Element added:", data);
});
```

### Backend Debugging

```javascript
// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Log socket events
io.on("connection", (socket) => {
  console.log("Connection:", socket.id);

  socket.onAny((event, ...args) => {
    console.log("Event:", event, args);
  });
});
```

### MongoDB Debugging

```bash
# Connect to MongoDB shell
mongosh

# Use database
use desaigner

# Check collections
show collections

# Query data
db.projects.find().pretty()
db.users.find().pretty()

# Check specific project
db.projects.findOne({ _id: ObjectId("...") })

# Delete all data (careful!)
db.projects.deleteMany({})
```

---

## 🚀 Performance Optimization

### Frontend

**1. Prevent Unnecessary Re-renders**

```javascript
// Use React.memo for expensive components
export default React.memo(PixiCanvas, (prev, next) => {
  return prev.projectId === next.projectId;
});

// Use Zustand selectors
const selectedIds = useEditorStore((state) => state.selectedIds);
// Instead of
const { selectedIds } = useEditorStore(); // This causes re-render on any state change
```

**2. Optimize PixiJS Rendering**

```javascript
// Cull off-screen objects
const isVisible = (element) => {
  const bounds = viewport.getBounds();
  return (
    element.x < bounds.right &&
    element.x + element.width > bounds.left &&
    element.y < bounds.bottom &&
    element.y + element.height > bounds.top
  );
};

// Only render visible elements
elements.filter(isVisible).forEach(renderElement);
```

**3. Throttle Socket Events**

```javascript
import { throttle } from "lodash";

const throttledCursorUpdate = throttle((position) => {
  socketService.emitCursorMove(projectId, position);
}, 50); // Max 20 updates/second
```

### Backend

**1. Add Database Indexes**

```javascript
// In model files
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ "collaborators.user": 1 });
```

**2. Use Lean Queries**

```javascript
// Faster read-only queries
const projects = await Project.find({ owner: userId })
  .lean() // Returns plain JS objects
  .select("name thumbnail updatedAt"); // Only needed fields
```

**3. Implement Caching**

```javascript
// Simple in-memory cache
const cache = new Map();

router.get("/:id", auth, async (req, res) => {
  const cached = cache.get(req.params.id);
  if (cached) return res.json({ project: cached });

  const project = await Project.findById(req.params.id);
  cache.set(req.params.id, project);

  res.json({ project });
});
```

---

## 🔐 Security Best Practices

### Input Validation

```javascript
// Always validate on backend
const { body, validationResult } = require("express-validator");

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 1, max: 100 }),
    body("email").isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... process request
  }
);
```

### File Upload Security

```javascript
// Validate file type and size
const upload = multer({
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
```

### Environment Variables

```javascript
// Never commit sensitive data
// Use .env for local, environment variables in production

// Good
const secret = process.env.JWT_SECRET;

// Bad
const secret = "my-secret-key"; // Don't hardcode!
```

---

## 📦 Deployment Preparation

### 1. Environment Setup

Create `.env.production`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/desaigner
JWT_SECRET=your-super-secret-production-key
CLIENT_URL=https://your-domain.com
NODE_ENV=production
```

### 2. Build Frontend

```powershell
cd client
npm run build
```

This creates `client/dist/` with optimized production build.

### 3. Update Server for Production

```javascript
// server/index.js
if (process.env.NODE_ENV === "production") {
  // Serve static files
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Handle client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}
```

### 4. Test Production Build Locally

```powershell
# Set environment
$env:NODE_ENV="production"

# Start server
npm start
```

---

## 🎯 Common Issues & Solutions

### Issue: MongoDB Connection Failed

```
Solution:
1. Check if MongoDB is running: net start MongoDB
2. Verify MONGODB_URI in .env
3. Check firewall settings
```

### Issue: Port Already in Use

```
Solution:
1. Find process: netstat -ano | findstr :5000
2. Kill process: taskkill /PID <pid> /F
3. Or change port in .env
```

### Issue: Socket.io Not Connecting

```
Solution:
1. Check CORS configuration
2. Verify CLIENT_URL matches
3. Check browser console for errors
4. Ensure both HTTP and WebSocket ports are open
```

### Issue: Images Not Uploading

```
Solution:
1. Check uploads/ directory exists and has write permissions
2. Verify multer configuration
3. Check file size limits
4. Ensure correct multipart/form-data header
```

---

## 📚 Additional Resources

### Documentation

- [React Docs](https://react.dev)
- [PixiJS Docs](https://pixijs.com/guides)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Socket.io Docs](https://socket.io/docs/v4/)

### Tutorials

- [Zustand Tutorial](https://github.com/pmndrs/zustand)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tools

- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI for MongoDB
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - Works with Zustand

---

Happy coding! 🚀
