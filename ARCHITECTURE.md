# DesAIgner - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Store      │      │
│  │ - Login      │  │ - Toolbar    │  │ - Auth       │      │
│  │ - Dashboard  │  │ - Sidebar    │  │ - Editor     │      │
│  │ - Editor     │  │ - Canvas     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                 │                 │              │
│           └─────────────────┴─────────────────┘              │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  API Layer  │                          │
│                    │  (Axios)    │                          │
│                    └──────┬──────┘                          │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Socket.io     │
                    │  (WebSocket)    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                    Server (Node.js/Express)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Routes     │  │  Middleware  │  │   Models     │    │
│  │ - Auth       │  │ - Auth       │  │ - User       │    │
│  │ - Projects   │  │ - Validation │  │ - Project    │    │
│  │ - Assets     │  │              │  │ - Asset      │    │
│  │ - AI         │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│           │                                   │            │
│           └───────────────────────────────────┘            │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │    MongoDB     │
                    │   (Database)   │
                    └────────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User → Login Form → API (POST /auth/login) → JWT Token → Zustand Store → Protected Routes
```

### 2. Project Creation Flow

```
User → Dashboard → Create Project → API (POST /projects) → MongoDB → Project List → Editor
```

### 3. Real-time Collaboration Flow

```
User A: Add Element → Editor Store → Socket.io Emit → Server
                                                         ↓
User B: ← Socket.io Receive ← Server Broadcast ← Validate & Store
        ↓
   Update Editor Store → Re-render Canvas
```

### 4. Canvas Rendering Flow

```
Elements (Zustand) → PixiJS Canvas → Graphics Objects → GPU Rendering → Screen
```

## Key Design Patterns

### 1. **State Management (Zustand)**

- Centralized state for editor and auth
- Actions co-located with state
- Easy debugging and time-travel

### 2. **Real-time Sync (Socket.io)**

- Room-based collaboration
- Event-driven architecture
- Optimistic updates on client

### 3. **Component Architecture**

```
Editor (Page)
├── Toolbar (Tools & Actions)
├── Sidebar (Layers & Assets)
├── PixiCanvas (Main Canvas)
│   └── Graphics Objects (PixiJS)
└── PropertiesPanel (Element Properties)
```

### 4. **API Layer Abstraction**

```javascript
// Centralized API calls
authAPI.login(data);
projectsAPI.create(data);
assetsAPI.upload(formData);
```

## Database Schema

### User

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  avatar: String,
  projects: [ObjectId],
  timestamps
}
```

### Project

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  owner: ObjectId (User),
  collaborators: [{
    user: ObjectId,
    role: enum('viewer', 'editor', 'admin')
  }],
  elements: [{
    id: String,
    type: enum('rectangle', 'circle', 'text', 'image'),
    x, y, width, height,
    rotation, scaleX, scaleY,
    fill, stroke, strokeWidth,
    opacity, zIndex,
    locked, visible,
    // Type-specific properties
    text, fontSize, fontFamily,
    src, points
  }],
  canvasSettings: {
    width, height,
    backgroundColor,
    gridEnabled,
    snapToGrid
  },
  thumbnail: String,
  isPublic: Boolean,
  version: Number,
  timestamps
}
```

### Asset

```javascript
{
  _id: ObjectId,
  name: String,
  type: enum('image', 'vector', 'icon'),
  url: String,
  thumbnail: String,
  size: Number,
  dimensions: { width, height },
  mimeType: String,
  owner: ObjectId (User),
  project: ObjectId (Project),
  tags: [String],
  timestamps
}
```

## Performance Optimizations

### 1. **PixiJS Rendering**

- Hardware acceleration
- Object pooling for frequently created/destroyed objects
- Culling off-screen objects
- Batch rendering

### 2. **Socket.io**

- Room-based events (not broadcasting to all)
- Throttled cursor updates
- Optimistic UI updates

### 3. **Frontend**

- React.memo for expensive components
- Zustand selectors to prevent unnecessary re-renders
- Lazy loading for routes
- Image optimization with Sharp

### 4. **Backend**

- MongoDB indexing on frequently queried fields
- Compression middleware
- Response caching where appropriate
- File upload size limits

## Security Measures

1. **Authentication**: JWT tokens, httpOnly cookies
2. **Authorization**: Role-based access control
3. **Input Validation**: Express-validator
4. **File Uploads**: Type and size validation
5. **Rate Limiting**: Can be added with express-rate-limit
6. **CORS**: Configured for specific origin
7. **Helmet**: Security headers
8. **Password**: Bcrypt hashing

## Scalability Considerations

### Current Architecture (Hackathon)

- Single server instance
- Direct MongoDB connection
- In-memory socket state

### Production Recommendations

1. **Horizontal Scaling**: Multiple server instances with load balancer
2. **Redis**: For socket state and session management
3. **CDN**: For static assets and uploads
4. **Database**: MongoDB Atlas with replica sets
5. **Caching**: Redis for frequently accessed data
6. **Queue**: Bull/BullMQ for async tasks
7. **Monitoring**: PM2, Winston, New Relic

## Technology Choices Rationale

### PixiJS

- ✅ Best performance for 2D canvas
- ✅ WebGL acceleration
- ✅ Rich feature set
- ❌ Learning curve

### Zustand vs Redux

- ✅ Less boilerplate
- ✅ Better DX
- ✅ Smaller bundle
- ✅ Similar performance

### Socket.io vs WebSocket

- ✅ Automatic reconnection
- ✅ Room management
- ✅ Fallback support
- ❌ Slightly larger bundle

### MongoDB vs PostgreSQL

- ✅ Flexible schema for dynamic elements
- ✅ Easy document embedding
- ✅ JSON-like structure
- ❌ Less structured for some relations

## Development Workflow

```
1. Feature Branch → Development
2. Local Testing → Unit Tests (future)
3. Code Review → GitHub PR
4. Merge → Main
5. Deploy → Production
```

## Future Architecture Improvements

1. **Microservices**: Split into auth, projects, collaboration services
2. **GraphQL**: Replace REST for more efficient queries
3. **WebRTC**: Peer-to-peer for very low latency
4. **Offline Support**: Service workers and IndexedDB
5. **Real-time Conflict Resolution**: CRDT or OT algorithms
