# Quick Setup Guide

Follow these steps to get the application running on your local system:

## Step 1: Install Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd client
npm install
```

## Step 2: Configure Environment Variables

### Backend (.env file)
Create a file named `.env` in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-platform
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-platform?retryWrites=true&w=majority
```

## Step 3: Start MongoDB

### Option A: Local MongoDB
Make sure MongoDB is installed and running:
- **Windows**: `net start MongoDB`
- **macOS**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

### Option B: MongoDB Atlas (Recommended for beginners)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `MONGODB_URI` in `.env` file

## Step 4: Run the Application

### Terminal 1 - Start Backend Server
```bash
cd server
npm run dev
```
Server will run on: `http://localhost:5000`

### Terminal 2 - Start Frontend Client
```bash
cd client
npm start
```
Frontend will automatically open at: `http://localhost:3000`

## Step 5: Test the Application

1. Open `http://localhost:3000` in your browser
2. Click "Sign Up" to create a new account
3. After registration, you'll be redirected to the dashboard
4. Create your first event
5. View events on the home page
6. RSVP to events

## Troubleshooting

### Port 5000 already in use
Change the PORT in `server/.env` to a different port (e.g., 5001), then update the frontend API URL in `client/src/utils/api.js`

### MongoDB connection error
- Check if MongoDB is running (if using local)
- Verify the connection string in `.env`
- For Atlas, ensure your IP is whitelisted in Network Access

### Module not found errors
Run `npm install` again in both `server` and `client` directories

### Image upload not working
Ensure the `server/uploads` directory exists. It should be created automatically, but if not:
```bash
mkdir server/uploads
```

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check the technical explanation for RSVP concurrency handling
- Deploy to production using the deployment guide in README

