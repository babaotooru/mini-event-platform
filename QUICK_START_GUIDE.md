# 🚀 Quick Start Guide - Working URLs

## ✅ BACKEND SERVER (RUNNING NOW)

**Main URL:** `http://localhost:5000`

### Test Endpoints:
- **Health Check:** `http://localhost:5000/api/health`
- **Events API:** `http://localhost:5000/api/events`
- **All APIs:** `http://localhost:5000/api/*`

### Status: ✅ **WORKING**

---

## ⏳ FRONTEND SERVER (STARTING)

**Main URL:** `http://localhost:3001`

### How to Start:

**Option 1: Double-click the batch file**
- Double-click `START_FRONTEND.bat` in the project root
- Wait 1-2 minutes for compilation
- Browser will open automatically OR visit `http://localhost:3001`

**Option 2: Manual Start (PowerShell)**
```powershell
cd C:\Users\pogak\mern-stack\client
$env:PORT='3001'
npm start
```

**Option 3: Manual Start (CMD)**
```cmd
cd C:\Users\pogak\mern-stack\client
set PORT=3001
npm start
```

### Status: ⏳ **COMPILING** (1-2 minutes)

---

## 📋 Current Status

| Service | URL | Status |
|---------|-----|--------|
| **Backend** | `http://localhost:5000` | ✅ Running |
| **Frontend** | `http://localhost:3001` | ⏳ Starting |

---

## 🧪 Quick Test

1. **Test Backend** (Works Now):
   - Open: `http://localhost:5000/api/health`
   - Should see: `{"status":"OK","message":"Server is running with Mock Data"}`

2. **Test Events** (Works Now):
   - Open: `http://localhost:5000/api/events`
   - Should see: JSON with 2 sample events

3. **Test Frontend** (Wait 1-2 min):
   - Open: `http://localhost:3001`
   - Should see: Event Platform homepage

---

## 🔧 Troubleshooting

### Frontend Not Loading?

1. **Check PowerShell/CMD window** - Look for compilation errors
2. **Wait longer** - First compilation takes 1-2 minutes
3. **Check port:** Run `netstat -ano | findstr ":3001"`
4. **Kill and restart:**
   ```powershell
   Get-Process node | Where-Object {$_.Id -ne 8004} | Stop-Process -Force
   cd C:\Users\pogak\mern-stack\client
   $env:PORT='3001'
   npm start
   ```

### Backend Not Working?

1. **Check if running:** `netstat -ano | findstr ":5000"`
2. **Restart backend:**
   ```powershell
   cd C:\Users\pogak\mern-stack\server
   npm run dev
   ```

---

## ✅ What's Working

- ✅ Backend API (all endpoints)
- ✅ Mock Data System (no MongoDB)
- ✅ Authentication
- ✅ Event CRUD
- ✅ RSVP System
- ⏳ Frontend (compiling)

---

**Backend Ready:** `http://localhost:5000` ✅  
**Frontend:** `http://localhost:3001` ⏳ (starting...)

