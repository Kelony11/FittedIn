# How to Restart the Backend Server

## Method 1: If using `npm start` or `node server.js` directly

### Steps:
1. **Find the terminal window running the backend**
   - Locate the terminal/command line window where the backend server is running

2. **Stop the server**
   - Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)
   - Wait for the server to stop completely

3. **Restart**
   ```bash
   cd backend
   npm start
   ```
   or
   ```bash
   cd backend
   node server.js
   ```

---

## Method 2: If using `npm run dev` (nodemon)

### Steps:
1. **Find the terminal window running the backend**
   - Locate the terminal where the backend server is running

2. **Stop the server**
   - Press `Ctrl + C` (Windows/Linux) or `Cmd + C` (Mac)

3. **Restart**
   ```bash
   cd backend
   npm run dev
   ```
   
   > **Note**: nodemon automatically watches for file changes and restarts, but a manual restart ensures all changes take effect

---

## Method 3: If using PM2 for process management

### Check if PM2 is being used:
```bash
pm2 list
```

### If you see `fittedin-backend`, use the following commands:

**Restart (recommended):**
```bash
cd backend
npm run pm2:restart
```

or directly with PM2:
```bash
pm2 restart fittedin-backend
```

**Check status:**
```bash
pm2 status
```

**View logs:**
```bash
npm run pm2:logs
```

---

## Method 4: If you don't know how it's running

### Check currently running processes:

**On Mac/Linux:**
```bash
ps aux | grep node
# or
lsof -i :3000
```

**On Windows:**
```bash
netstat -ano | findstr :3000
tasklist | findstr node
```

### Stop all Node.js processes (use with caution):

**Mac/Linux:**
```bash
pkill -f "node server.js"
# or
killall node
```

**Windows:**
```bash
taskkill /F /IM node.exe
```

### Then restart:
```bash
cd backend
npm start
```

---

## Quick Restart Steps (Most Common)

1. **Open terminal/command line**
2. **Navigate to backend directory**
   ```bash
   cd /Users/andrew/projects/FittedIn/backend
   ```
3. **Stop current server** (if running)
   - Press `Ctrl + C` or `Cmd + C` in the terminal running the server
4. **Restart**
   ```bash
   npm start
   ```
   or development mode (auto-restart):
   ```bash
   npm run dev
   ```

---

## Verify Restart Success

After restarting, you should see output similar to:
```
🚀 Server running on port 3000
📱 Frontend: http://localhost:3000
🔗 API: http://localhost:3000/api
🌍 Environment: development
```

---

## If You Encounter Port Already in Use Error

If you see `EADDRINUSE: address already in use :::3000`, the port is still occupied:

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Windows:**
```bash
netstat -ano | findstr :3000
# Note the PID, then:
taskkill /PID <PID> /F
```

Then start the server again.

---

## Troubleshooting

### Server won't start
- Check if another process is using port 3000
- Verify database connection is working
- Check for syntax errors in server.js

### Changes not taking effect
- Make sure you restarted the server after code changes
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- Check if using nodemon (auto-restart) or need manual restart

### Connection refused errors
- Verify server is actually running
- Check firewall settings
- Ensure correct port (default: 3000)
