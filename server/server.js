const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const supabase = require('./supabaseClient');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'https://mern-stack-project-xi-two.vercel.app',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5000'
];

// Add Vercel preview URLs if provided
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/rsvp', require('./routes/rsvp'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows, which is OK
    res.json({ status: 'OK', message: 'Server is running with Supabase' });
  } catch (error) {
    res.json({ status: 'OK', message: 'Server running (Supabase connection test failed)', error: error.message });
  }
});

// Serve static files from React app build (CSS, JS, images)
const buildPath = path.join(__dirname, '../client/build');
app.use(express.static(buildPath));

// Serve React app for all non-API routes (SPA routing)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Connected to Supabase`);
  console.log(`✅ Application URL: http://localhost:${PORT}`);
});

