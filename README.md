# Mini Event Platform - MERN Stack Application

A full-stack web application for creating, viewing, and RSVPing to events built with MongoDB, Express.js, React.js, and Node.js.

## Features

### Core Features
- ✅ **User Authentication**: Secure sign up and login with JWT tokenization
- ✅ **Event Management**: Full CRUD operations (Create, Read, Update, Delete)
  - Create events with title, description, date & time, location, capacity, and image upload
  - View all upcoming events on the main dashboard
  - Edit and delete events (only by the creator)
- ✅ **RSVP System**: Join and leave events with robust capacity enforcement
  - Capacity checking and enforcement
  - Concurrency handling to prevent race conditions
  - Duplicate RSVP prevention
- ✅ **Responsive UI**: Fully responsive design for Desktop, Tablet, and Mobile

### Bonus Features
- ✅ **Search Functionality**: Search events by title, description, or location
- ✅ **User Dashboard**: Private dashboard showing:
  - Events the user is attending
  - Events the user has created
- ✅ **Image Upload**: Upload and display event images
- ✅ **Polished UI/UX**: Modern, clean interface with form validation

## Technical Stack

- **Frontend**: React.js, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express Validator

## Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mern-stack
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create a .env file in the server directory
# Copy the example and update with your values
cp .env.example .env
```

Edit the `server/.env` file with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/event-platform
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-platform
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

### 3. Frontend Setup

```bash
# Navigate to client directory (from project root)
cd client

# Install dependencies
npm install
```

### 4. Start MongoDB

If using local MongoDB, make sure MongoDB is running:

```bash
# On Windows
net start MongoDB

# On macOS/Linux
mongod
```

Or use MongoDB Atlas (cloud) - no local installation needed.

### 5. Run the Application

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

**Terminal 2 - Frontend Client:**
```bash
cd client
npm start
# Frontend will run on http://localhost:3000
```

The application will automatically open in your browser at `http://localhost:3000`.

## Project Structure

```
mern-stack/
├── server/
│   ├── config/
│   │   └── multer.js          # File upload configuration
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── User.js            # User model
│   │   └── Event.js           # Event model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── events.js          # Event CRUD routes
│   │   └── rsvp.js            # RSVP routes
│   ├── uploads/               # Uploaded images directory
│   ├── server.js              # Express server entry point
│   └── package.json
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── context/           # React Context (Auth)
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utility functions
│   │   ├── App.js             # Main App component
│   │   └── index.js           # React entry point
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all upcoming events (with optional search query)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event (Protected)
- `PUT /api/events/:id` - Update event (Protected, Creator only)
- `DELETE /api/events/:id` - Delete event (Protected, Creator only)

### RSVP
- `POST /api/rsvp/:eventId` - RSVP to an event (Protected)
- `DELETE /api/rsvp/:eventId` - Cancel RSVP (Protected)
- `GET /api/rsvp/user` - Get events user is attending (Protected)
- `GET /api/rsvp/user/created` - Get events created by user (Protected)

## Technical Explanation: RSVP Capacity & Concurrency Handling

### Problem Statement
When multiple users attempt to RSVP simultaneously for the last available spot in an event, race conditions can occur, leading to overbooking (exceeding the event's capacity).

### Solution Strategy

The solution implements **MongoDB Transactions** combined with **Atomic Update Operations** to ensure data consistency and prevent race conditions.

#### 1. **MongoDB Transactions**
The RSVP endpoint uses MongoDB sessions and transactions to ensure atomicity:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
```

This ensures that all database operations within the transaction either complete successfully or are rolled back entirely.

#### 2. **Atomic Update with Conditions**
The critical RSVP operation uses MongoDB's `updateOne` with multiple conditions in a single atomic operation:

```javascript
const updateResult = await Event.updateOne(
  { 
    _id: eventId,
    attendees: { $ne: userId },                    // Condition 1: User not already in attendees
    $expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }  // Condition 2: Capacity check
  },
  { 
    $addToSet: { attendees: userId }              // Atomic add operation
  }
).session(session);
```

**Key Components:**
- `$ne: userId` - Prevents duplicate RSVPs by checking user is not already in the attendees array
- `$expr: { $lt: [{ $size: '$attendees' }, '$capacity'] }` - Ensures current attendee count is less than capacity
- `$addToSet` - Atomically adds user to attendees array only if not already present
- `.session(session)` - Executes within the transaction context

#### 3. **Why This Works**

1. **Atomicity**: The entire update operation (checking conditions + adding user) happens atomically at the database level, preventing race conditions.

2. **Conditional Update**: MongoDB only performs the update if ALL conditions are met. If capacity is reached between the read and write operations, the update fails (matchedCount = 0).

3. **Transaction Rollback**: If the update fails or any error occurs, the transaction is aborted and all changes are rolled back.

4. **No Locking Needed**: MongoDB's document-level atomic operations eliminate the need for application-level locking mechanisms.

#### 4. **Error Handling**

```javascript
if (updateResult.matchedCount === 0) {
  await session.abortTransaction();
  session.endSession();
  return res.status(400).json({ 
    message: 'Could not RSVP. Event may be at capacity or you may have already RSVP\'d.' 
  });
}
```

If the atomic update doesn't match any document (meaning conditions weren't met), the transaction is aborted and an appropriate error is returned.

### Alternative Approaches Considered

1. **Optimistic Locking**: Using version numbers - More complex, requires additional fields
2. **Pessimistic Locking**: Application-level locks - Can cause performance issues and deadlocks
3. **Separate Read-Check-Write**: Traditional approach - Vulnerable to race conditions

### Conclusion

This implementation leverages MongoDB's native atomic operations and transactions to provide a robust, scalable solution that prevents overbooking even under high concurrency, without requiring complex locking mechanisms or additional database fields.

## Deployment

### Backend Deployment (Render/Railway)
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables in the platform
4. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Build the React app: `cd client && npm run build`
2. Deploy the `build` folder to Vercel/Netlify
3. Set environment variable: `REACT_APP_API_URL` to your backend URL

### Database
Use MongoDB Atlas (cloud-hosted MongoDB) for production.

## Testing the Application

1. **Register a new account** at `/register`
2. **Create an event** from the dashboard
3. **View events** on the home page
4. **RSVP to events** from event details page
5. **Test capacity limits** by RSVPing multiple users
6. **Test concurrency** by having multiple users RSVP simultaneously

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running (if using local)
- Check MongoDB URI in `.env` file
- Verify network access (if using Atlas)

### Port Already in Use
- Change `PORT` in `server/.env`
- Update frontend API URL if backend port changes

### Image Upload Issues
- Ensure `server/uploads` directory exists
- Check file permissions
- Verify file size limits (5MB max)

## License

This project is created for educational purposes as part of a technical screening assignment.

## Author

Created as part of MERN Stack Intern - Technical Screening Assignment

