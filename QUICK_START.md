# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Setup Environment

Create `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-platform
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

### 3. Start MongoDB

**Local MongoDB:**
- Windows: `net start MongoDB`
- Mac/Linux: `mongod` or `brew services start mongodb-community`

**OR use MongoDB Atlas (Cloud - No installation needed):**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create cluster and get connection string
3. Update `MONGODB_URI` in `.env`

### 4. Run Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### 5. Open Browser

Navigate to: `http://localhost:3000`

## ✅ Test Checklist

- [ ] Register a new account
- [ ] Create an event with image
- [ ] View events on home page
- [ ] RSVP to an event
- [ ] Check dashboard for your events
- [ ] Edit/Delete your event
- [ ] Test search functionality

## 📚 Full Documentation

See [README.md](./README.md) for complete documentation including:
- Technical explanation of RSVP concurrency handling
- API endpoints
- Deployment guide
- Troubleshooting

## 🎯 Key Features

✅ User Authentication (JWT)  
✅ Event CRUD Operations  
✅ RSVP System with Concurrency Handling  
✅ Image Upload  
✅ Search & Filter  
✅ User Dashboard  
✅ Responsive Design  

