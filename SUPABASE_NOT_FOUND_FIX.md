# Fix: 404 NOT_FOUND Error from Supabase

## 🔍 Error Message

If you're seeing this error:
```
404: NOT_FOUND
Code: NOT_FOUND
ID: bom1::drtx6-1767003435488-d0c99c30c277
```

This means **Supabase cannot find the table or column** you're trying to access.

---

## ✅ SOLUTION: Create Missing Tables

The most common cause is that the **database tables don't exist** in your Supabase project.

### Step-by-Step Fix:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Navigate to your project

2. **Click "SQL Editor"** (left sidebar)
   - Look for the SQL icon 📝

3. **Open the Setup SQL File**
   - In your project, open: `server/supabase_setup.sql`
   - Copy all the SQL code

4. **Paste and Run in Supabase SQL Editor**
   - Paste the SQL into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`
   - Wait for it to complete

5. **Verify Tables Were Created**
   - Go to "Table Editor" (left sidebar)
   - You should see these tables:
     - ✅ `users`
     - ✅ `events`
     - ✅ `rsvps`

---

## 📋 Required Tables

Your Supabase database needs these 3 tables:

### 1. `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `events` Table
```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  image TEXT DEFAULT '',
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rsvp_open_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 minute'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. `rsvps` Table
```sql
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
```

---

## 🧪 After Creating Tables

1. **Restart your backend server**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

2. **Test the application**
   - Try creating an event
   - Try RSVPing to an event
   - Check that data appears in Supabase Table Editor

3. **Check server logs**
   - The server will now show clear error messages if tables are missing
   - Look for: `⚠️  TABLE NOT FOUND:`

---

## 🔧 Other Possible Causes

### 1. Wrong Supabase Project
- Make sure you're using the correct Supabase project URL
- Check `server/supabaseClient.js` for the correct URL
- Verify the project URL matches your Supabase dashboard

### 2. Wrong Table Names
- Tables must be named exactly: `users`, `events`, `rsvps` (lowercase)
- Check for typos in table names

### 3. Missing Columns
- If tables exist but columns are missing, run the SQL setup again
- The `CREATE TABLE IF NOT EXISTS` will add missing columns

### 4. RLS Blocking Access
- Even if tables exist, RLS might be blocking access
- Go to Table Editor → Select each table → Disable RLS
- Or use Service Role Key (see below)

---

## 🚀 Using Service Role Key (Recommended)

For server-side operations, use the Service Role Key to bypass RLS:

1. **Get Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (NOT the anon key)

2. **Add to Environment:**
   - Create/update `server/.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Restart Server:**
   - The server will automatically use the service role key if available
   - This bypasses RLS and prevents permission errors

---

## ✅ Quick Checklist

- [ ] Run `server/supabase_setup.sql` in Supabase SQL Editor
- [ ] Verify all 3 tables exist in Table Editor
- [ ] Disable RLS on all tables (or use Service Role Key)
- [ ] Restart backend server
- [ ] Test creating an event
- [ ] Test RSVPing to an event

---

## 📊 Check Server Logs

After the fix, the server will show helpful error messages:

### If tables are missing:
```
⚠️  TABLE NOT FOUND: The "events" table may not exist in Supabase!
⚠️  SOLUTION: Run the SQL from server/supabase_setup.sql in Supabase SQL Editor
```

### If it's working:
```
✅ Server running on port 5000
✅ Connected to Supabase
```

---

## 🆘 Still Getting Errors?

1. **Check Supabase Dashboard:**
   - Go to Table Editor
   - Verify all 3 tables exist
   - Check that tables have data (or are empty but exist)

2. **Check Server Logs:**
   - Look at the terminal where `npm run dev` is running
   - Copy the full error message
   - Check for specific table/column names in the error

3. **Verify Supabase Connection:**
   - Check `server/supabaseClient.js`
   - Verify the Supabase URL is correct
   - Verify the API key is correct

4. **Re-run SQL Setup:**
   - Sometimes running the SQL again fixes missing indexes or constraints
   - Go to SQL Editor → Run `server/supabase_setup.sql` again

---

**The error should be resolved after creating the tables!** 🎉

