# Fix: RSVPs Not Storing Values

## 🔍 Most Common Cause: Row Level Security (RLS)

If RSVPs are not being stored, the issue is **99% likely** caused by **RLS blocking inserts** on the `rsvps` table in Supabase.

---

## ✅ SOLUTION: Disable RLS on RSVPs Table

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Navigate to your project

2. **Click "Table Editor"** (left sidebar)
   - Look for the database icon 📊

3. **Select "rsvps" table**

4. **Disable RLS:**
   - Look at the top of the table view
   - Find "RLS: Enabled" (usually in a badge/button)
   - Click it
   - Select "Disable RLS"

5. **Also verify RLS is disabled on:**
   - `users` table
   - `events` table
   - `rsvps` table ✅

---

## 🧪 After Disabling RLS

1. **Restart your backend server** (if it's running)
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

2. **Try RSVPing to an event again**
   - It should work immediately!

3. **Check the `rsvps` table in Supabase Table Editor**
   - You should see your RSVP record

---

## 📊 Check Server Logs

The server now logs detailed error information. Check your terminal/console where `npm run dev` is running:

### If you see:
```
⚠️  RLS ERROR: Row Level Security is blocking RSVP inserts!
⚠️  SOLUTION: Disable RLS on the "rsvps" table in Supabase Dashboard
```

**This confirms RLS is the issue!**

### Other error messages to look for:
- `RSVP insert error:`
- `Error code: 42501` (RLS permission denied)
- `permission denied`
- `Error details:`

---

## 🔧 Other Possible Issues

### 1. Missing `rsvps` Table
If the table doesn't exist:
- Go to Supabase → SQL Editor
- Run the SQL from `server/supabase_setup.sql`
- Specifically, make sure this table exists:

```sql
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
```

### 2. Invalid User ID or Event ID
- Make sure you're logged in
- Check that your user exists in `users` table
- Check that the event exists in `events` table
- Both IDs must be valid UUIDs

### 3. RSVP Time Restriction
- RSVPs can only be made **1 minute after event creation**
- If you just created an event, wait 1 minute before RSVPing
- Check the error message - it will tell you how many seconds to wait

### 4. Event Capacity
- If the event is at full capacity, RSVPs will be rejected
- Check the event's `capacity` and current `attendeesCount`

### 5. Past Events
- You cannot RSVP to events that have already passed
- Check the event's `date` field

---

## ✅ Quick Test

After disabling RLS:

1. **Create a new event** (if you don't have one)
2. **Wait 1 minute** (RSVP opens 1 minute after creation)
3. **RSVP to the event**
4. **Check the `rsvps` table** in Supabase to verify the record was created

If it works, RLS was the issue!

---

## 🚀 Verification

To verify RSVPs are working:

1. **Check Supabase Table Editor:**
   - Go to `rsvps` table
   - You should see records with `user_id` and `event_id`

2. **Check the frontend:**
   - RSVP to an event
   - The attendee count should increase
   - Your name should appear in the attendees list

3. **Check server logs:**
   - Look for: `✅ RSVP created successfully:`
   - No error messages

---

## 📝 Summary

**Most likely fix:** Disable RLS on the `rsvps` table in Supabase Dashboard.

**If that doesn't work:** Check server logs for the specific error message and follow the troubleshooting steps above.

