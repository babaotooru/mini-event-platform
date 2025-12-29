const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../supabaseClient');

// @route   POST /api/rsvp/:eventId
// @desc    RSVP to an event
// @access  Private
router.post('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    
    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    console.log('RSVP request:', { eventId, userId });

    // Find event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is in the past
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot RSVP to past events' });
    }

    // Check if RSVP is open (respect time - 1 minute after creation)
    const rsvpOpenAt = event.rsvp_open_at ? new Date(event.rsvp_open_at) : new Date(new Date(event.created_at).getTime() + 60 * 1000);
    if (new Date() < rsvpOpenAt) {
      const waitTime = Math.ceil((rsvpOpenAt - new Date()) / 1000);
      return res.status(400).json({ 
        message: `RSVP will open in ${waitTime} seconds. Please wait at least 1 minute after event creation.` 
      });
    }

    // Check if user already RSVP'd
    const { data: existingRSVP } = await supabase
      .from('rsvps')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (existingRSVP) {
      return res.status(400).json({ message: 'You have already RSVP\'d to this event' });
    }

    // Get current attendee count
    const { count: attendeeCount } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    // Check capacity
    if ((attendeeCount || 0) >= event.capacity) {
      return res.status(400).json({ message: 'Event is at full capacity' });
    }

    // Add RSVP (atomic operation - unique constraint prevents duplicates)
    console.log('Attempting to insert RSVP:', { user_id: userId, event_id: eventId });
    
    // First try insert without select to see if it works
    const { error: insertError } = await supabase
      .from('rsvps')
      .insert({
        user_id: userId,
        event_id: eventId
      });

    if (insertError) {
      console.error('RSVP insert error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      // Check if it's a duplicate error
      if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
        return res.status(400).json({ message: 'You have already RSVP\'d to this event' });
      }
      return res.status(500).json({ 
        message: 'Server error creating RSVP',
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      });
    }
    
    console.log('RSVP inserted successfully, fetching data...');
    
    // Now fetch the inserted RSVP
    const { data: rsvp, error: fetchError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching RSVP after insert:', fetchError);
      // Don't fail the request if insert succeeded but fetch failed
    } else {
      console.log('RSVP created successfully:', rsvp);
    }

    // Fetch updated event
    const { data: updatedEvent } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    // Fetch creator info
    if (updatedEvent?.creator_id) {
      const { data: creator } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', updatedEvent.creator_id)
        .single();
      updatedEvent.creator = creator;
    }

    // Fetch attendees
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', eventId);

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

    updatedEvent.attendees = attendees;
    updatedEvent.attendeesCount = attendees.length;

    res.json({ 
      message: 'Successfully RSVP\'d to event',
      event: updatedEvent
    });
  } catch (error) {
    console.error('RSVP error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   DELETE /api/rsvp/:eventId
// @desc    Cancel RSVP to an event
// @access  Private
router.delete('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // Check if RSVP exists
    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvps')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (rsvpError || !rsvp) {
      return res.status(400).json({ message: 'You have not RSVP\'d to this event' });
    }

    // Delete RSVP
    const { error: deleteError } = await supabase
      .from('rsvps')
      .delete()
      .eq('id', rsvp.id);

    if (deleteError) throw deleteError;

    // Fetch updated event
    const { data: updatedEvent } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    // Fetch creator info
    if (updatedEvent?.creator_id) {
      const { data: creator } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', updatedEvent.creator_id)
        .single();
      updatedEvent.creator = creator;
    }

    // Fetch attendees
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', eventId);

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

    updatedEvent.attendees = attendees;
    updatedEvent.attendeesCount = attendees.length;

    res.json({ 
      message: 'Successfully cancelled RSVP',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rsvp/user
// @desc    Get all events user has RSVP'd to
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('event_id')
      .eq('user_id', req.user.id);

    const eventIds = rsvps?.map(r => r.event_id) || [];
    
    if (eventIds.length === 0) {
      return res.json([]);
    }

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .in('id', eventIds)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    // Get attendees for each event
    const eventsWithAttendees = await Promise.all(
      (events || []).map(async (event) => {
        // Fetch creator info
        let creator = null;
        if (event.creator_id) {
          const { data: creatorData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', event.creator_id)
            .single();
          creator = creatorData;
        }

        // Fetch attendees
        const { data: eventRsvps } = await supabase
          .from('rsvps')
          .select('user_id')
          .eq('event_id', event.id);

        const attendeeIds = eventRsvps?.map(r => r.user_id) || [];
        let attendees = [];
        if (attendeeIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', attendeeIds);
          attendees = users || [];
        }

        return {
          ...event,
          creator,
          attendees,
          attendeesCount: attendees.length
        };
      })
    );

    res.json(eventsWithAttendees);
  } catch (error) {
    console.error('Get user RSVPs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rsvp/user/created
// @desc    Get all events created by user
// @access  Private
router.get('/user/created', auth, async (req, res) => {
  try {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('creator_id', req.user.id)
      .order('date', { ascending: true });

    // Get attendees for each event
    const eventsWithAttendees = await Promise.all(
      (events || []).map(async (event) => {
        // Fetch creator info
        let creator = null;
        if (event.creator_id) {
          const { data: creatorData } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', event.creator_id)
            .single();
          creator = creatorData;
        }

        // Fetch attendees
        const { data: eventRsvps } = await supabase
          .from('rsvps')
          .select('user_id')
          .eq('event_id', event.id);

        const attendeeIds = eventRsvps?.map(r => r.user_id) || [];
        let attendees = [];
        if (attendeeIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', attendeeIds);
          attendees = users || [];
        }

        return {
          ...event,
          creator,
          attendees,
          attendeesCount: attendees.length
        };
      })
    );

    res.json(eventsWithAttendees);
  } catch (error) {
    console.error('Get user created events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
