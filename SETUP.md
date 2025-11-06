# DesAIgner - Quick Setup Guide

## Step 1: Install Dependencies

```powershell
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

## Step 2: Start MongoDB

Make sure MongoDB is running:

```powershell
# If MongoDB is installed as a Windows service:
net start MongoDB

# If you need to start it manually:
mongod --dbpath C:\data\db
```

## Step 3: Start Development

```powershell
# Start both frontend and backend
npm run dev
```

This will:

- Start the backend server on http://localhost:5000
- Start the frontend dev server on http://localhost:5173

## Step 4: Test the Application

1. Open browser to http://localhost:5173
2. Click "Sign up" to create an account
3. Create a new project
4. Start designing!

## Troubleshooting

### MongoDB not starting?

- Make sure MongoDB is installed: https://www.mongodb.com/try/download/community
- Check if port 27017 is available
- Try running: `mongod --config C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`

### Port already in use?

- Change PORT in `.env` file
- Update CLIENT_URL accordingly

### Dependencies issues?

```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force client\node_modules
npm run install-all
```

## Features to Test

✅ User Registration & Login
✅ Create New Project
✅ Add Shapes (Rectangle, Circle)
✅ Add Text
✅ Select and Move Elements
✅ Edit Properties (size, color, opacity, rotation)
✅ Upload Images
✅ Layer Management
✅ Undo/Redo
✅ Zoom & Pan Canvas
✅ Real-time Collaboration (open project in 2+ browser windows)

## Default Test Credentials

You can create any account you want, or use these for testing:

- Email: test@desaigner.com
- Password: test123

(Note: You'll need to create this account first via the Register page)

## Next Steps

- Invite collaborators to test real-time features
- Upload design assets
- Explore AI color suggestions
- Test keyboard shortcuts (V, R, C, T)

Happy designing! 🎨
