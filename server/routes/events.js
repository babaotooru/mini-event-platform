const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const supabase = require('../supabaseClient');
const upload = require('../config/multer');
const fs = require('fs');
const path = require('path');

// @route   GET /api/events
// @desc    Get all upcoming events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, date } = req.query;
    let query = supabase
      .from('events')
      .select(`
        *,
        creator:users!events_creator_id_fkey(id, name, email)
      `)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    // Search by title, description, or location
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Get events error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Check if it's a table/column not found error
      if (error.code === 'PGRST204' || error.code === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        console.error('⚠️  TABLE NOT FOUND: The "events" table may not exist in Supabase!');
        console.error('⚠️  SOLUTION: Run the SQL from server/supabase_setup.sql in Supabase SQL Editor');
        return res.status(500).json({ 
          message: 'Database table not found. Please check Supabase setup.',
          error: error.message,
          code: error.code,
          hint: 'Run server/supabase_setup.sql in Supabase SQL Editor'
        });
      }
      
      throw error;
    }

    // Get attendee counts for each event
    const eventsWithAttendees = await Promise.all(
      events.map(async (event) => {
        const { count } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        const { data: rsvps } = await supabase
          .from('rsvps')
          .select('user_id')
          .eq('event_id', event.id);

        // Get user details for attendees
        const userIds = rsvps?.map(r => r.user_id) || [];
        let attendees = [];
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds);
          attendees = users || [];
        }

        return {
          ...event,
          attendees,
          attendeesCount: count || 0
        };
      })
    );

    res.json(eventsWithAttendees);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      console.error('Get event error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Check if it's a table/column not found error
      if (error.code === 'PGRST204' || error.code === 'NOT_FOUND' || error.message?.includes('NOT_FOUND')) {
        console.error('⚠️  TABLE NOT FOUND: The "events" table may not exist in Supabase!');
        console.error('⚠️  SOLUTION: Run the SQL from server/supabase_setup.sql in Supabase SQL Editor');
        return res.status(500).json({ 
          message: 'Database table not found. Please check Supabase setup.',
          error: error.message,
          code: error.code,
          hint: 'Run server/supabase_setup.sql in Supabase SQL Editor'
        });
      }
      
      return res.status(404).json({ message: 'Event not found', error: error.message });
    }

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch creator info
    if (event?.creator_id) {
      const { data: creator } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', event.creator_id)
        .single();
      event.creator = creator;
    }

    // Get attendees
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', event.id);

    // Get user details for attendees
    const userIds = rsvps?.map(r => r.user_id) || [];
    let attendees = [];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      attendees = users || [];
    }

    event.attendees = attendees;
    event.attendeesCount = attendees.length;

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', auth, upload.single('image'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, date, location, capacity } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    // Step 1: Insert the event (without SELECT to avoid PGRST204)
    // Build insert data - don't include rsvp_open_at if column doesn't exist
    const insertData = {
      title,
      description,
      date: new Date(date).toISOString(),
      location,
      capacity: parseInt(capacity),
      image,
      creator_id: req.user.id
    };

    console.log('Inserting event:', { title, creator_id: req.user.id });
    
    const { error: insertError } = await supabase
      .from('events')
      .insert(insertData);

    if (insertError) {
      console.error('Supabase INSERT error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ 
        message: 'Server error creating event',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint || 'Check if service role key is configured correctly'
      });
    }

    console.log('Event INSERT succeeded, fetching event...');

    // Step 2: Wait a moment for the insert to commit
    await new Promise(resolve => setTimeout(resolve, 300));

    // Step 3: Fetch the event we just created
    const { data: fetchedEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', req.user.id)
      .eq('title', title)
      .order('created_at', { ascending: false })
      .limit(1);

    let insertedEvent;

    if (fetchError) {
      console.error('Error fetching inserted event:', fetchError);
      // Build event object manually - INSERT succeeded, so we know the data
      insertedEvent = {
        ...insertData,
        id: null, // Database generated, but we don't have it
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('Built event object manually');
    } else if (!fetchedEvents || fetchedEvents.length === 0) {
      console.log('No events found, building manually');
      // Build event object manually
      insertedEvent = {
        ...insertData,
        id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      insertedEvent = fetchedEvents[0];
      console.log('Successfully fetched event:', insertedEvent.id);
    }

    // Build response with creator info from req.user (we already have it from auth middleware)
    const event = {
      ...insertedEvent,
      creator: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      attendees: [],
      attendeesCount: 0
    };

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    console.error('Error stack:', error.stack);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (only creator)
router.put('/:id', auth, upload.single('image'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if event exists and user is creator
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('creator_id, image')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingEvent) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Event not found' });
    }

    if (existingEvent.creator_id !== req.user.id) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Get current attendee count
    const { count: attendeeCount } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', req.params.id);

    const { capacity } = req.body;
    if (parseInt(capacity) < (attendeeCount || 0)) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: `Capacity cannot be less than current attendees (${attendeeCount || 0})` 
      });
    }

    const { title, description, date, location } = req.body;
    const updateData = {
      title,
      description,
      date: new Date(date).toISOString(),
      location,
      capacity: parseInt(capacity)
    };

    // Delete old image if new one is uploaded
    if (req.file && existingEvent.image) {
      const oldImagePath = path.join(__dirname, '..', existingEvent.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    // Fetch creator info
    if (event?.creator_id) {
      const { data: creator } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', event.creator_id)
        .single();
      event.creator = creator;
    }

    // Get attendees
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', event.id);

    // Get user details for attendees
    const userIds = rsvps?.map(r => r.user_id) || [];
    let attendees = [];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      attendees = users || [];
    }

    event.attendees = attendees;
    event.attendeesCount = attendees.length;

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (only creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if event exists and user is creator
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('creator_id, image')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.creator_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Delete image file if exists
    if (event.image) {
      const imagePath = path.join(__dirname, '..', event.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete event (RSVPs will be cascade deleted)
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
