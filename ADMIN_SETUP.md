# NexBase Admin Panel Setup Guide

## ✅ What's Been Implemented

### Enhanced Admin Panel Features:
1. **Statistics Dashboard**
   - Total Users count (active/blocked breakdown)
   - Total Workspaces count
   - Monthly Revenue (€) with annual projection
   - Average Revenue per User

2. **User Management Table**
   - Displays ALL users across the platform
   - Columns: Email, Plan, Status, Workspaces Count, Joined Date, Actions
   - Color-coded badges for plans and status
   - Real-time workspace counts per user

3. **Admin Actions**
   - **Change Plan Dropdown**: Free, Starter (€19), Builder (€49), Agency (€149)
   - **Block Button**: Suspend user accounts
   - **Activate Button**: Restore suspended accounts
   - Actions update immediately with server revalidation

4. **User Blocking System**
   - Blocked users redirected to `/suspended` page
   - Middleware checks user status on every request
   - Login attempts by blocked users show error message
   - Automatic sign-out for blocked users

5. **Suspended Page**
   - Professional suspension notice
   - Contact support options
   - Email link to support@nexbase.com

## 🚀 Setup Instructions

### Step 1: Create Database Tables

1. Open your Supabase project: https://supabase.com/dashboard/project/sweurfszajcmwkwuecwl
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the contents of `supabase-setup.sql` file
4. Click **Run** to execute the SQL

This will:
- Create the `user_profiles` table
- Set up Row Level Security policies
- Create a trigger to automatically add users on signup
- Create indexes for better performance

### Step 2: Verify Admin Access

The admin panel is restricted to: **gregaquino2021@gmail.com**

To access the admin panel:
1. Create an account with email: `gregaquino2021@gmail.com`
2. Navigate to: http://localhost:3000/admin

If you use a different email, you'll be redirected to the dashboard.

### Step 3: Test the Features

#### Test User Management:
1. Create a test user (signup with any email)
2. Log in as admin (gregaquino2021@gmail.com)
3. Go to `/admin`
4. You should see the test user in the users table

#### Test User Blocking:
1. Click "Block" button next to a user
2. Log out of admin account
3. Try to log in as the blocked user
4. You should see: "Your account has been suspended"
5. Or if already logged in, redirected to `/suspended`

#### Test Plan Changes:
1. In admin panel, change a user's plan using the dropdown
2. Revenue calculations update automatically
3. Plan badge changes color based on selection

## 📊 Revenue Calculation

Plans and their pricing:
- **Free**: €0/month
- **Starter**: €19/month
- **Builder**: €49/month
- **Agency**: €149/month

Total Monthly Revenue = Sum of all user plans
Total Annual Revenue = Monthly Revenue × 12

## 🔒 Security Features

### Admin Access Control:
- Only `ADMIN_EMAIL` (gregaquino2021@gmail.com) can access `/admin`
- Other users redirected to dashboard
- Server-side verification on all admin actions

### User Status Checking:
- Middleware checks status on EVERY request
- Blocked users cannot access any protected routes
- Blocked status check happens before route protection
- Automatic logout on login attempt for blocked users

### Row Level Security:
- `user_profiles` table has RLS enabled
- Admin policy allows all operations (using service role)
- Users can read their own profile
- All admin operations use server actions

## 🗂️ File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx          # Main admin dashboard
│   │   └── actions.ts        # Server actions for user management
│   ├── suspended/
│   │   └── page.tsx          # Suspension notice page
│   └── (auth)/
│       └── login/page.tsx    # Enhanced with blocked user check
├── components/
│   └── admin-actions.tsx     # Client component for admin actions
├── lib/
│   └── types.ts              # Added UserProfile interface
└── middleware.ts             # Enhanced with status checking

supabase-setup.sql            # Database setup script
```

## 📝 Database Schema

### user_profiles Table:
```sql
id          UUID PRIMARY KEY (references auth.users)
email       TEXT NOT NULL
full_name   TEXT
plan        TEXT DEFAULT 'free' (free|starter|builder|agency)
status      TEXT DEFAULT 'active' (active|blocked)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### Automatic User Creation:
When a user signs up via Supabase Auth, a trigger automatically creates their profile in `user_profiles` with:
- Default plan: 'free'
- Default status: 'active'
- Email from auth.users

## 🎯 Admin Panel Access

**URL**: http://localhost:3000/admin

**Authorized User**: gregaquino2021@gmail.com

**Features**:
- View all users and their statistics
- Change user plans
- Block/activate user accounts
- Monitor revenue metrics
- Track workspace distribution

## 🐛 Troubleshooting

### "No users found" in admin panel
- Run the SQL setup script in Supabase
- Create at least one user account via signup
- Check that `user_profiles` table exists

### Can't access admin panel
- Verify you're logged in as `gregaquino2021@gmail.com`
- Check `.env.local` has `ADMIN_EMAIL=gregaquino2021@gmail.com`
- Restart the dev server after changing `.env.local`

### Blocked user can still access site
- Restart dev server (middleware caches environment variables)
- Check user's status in Supabase dashboard
- Verify middleware.ts was updated correctly

### Changes not reflecting
- Server actions use `revalidatePath('/admin')` to update cache
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors

## 🚢 Production Deployment

When deploying to production:
1. Add `ADMIN_EMAIL` environment variable to your hosting platform
2. Run `supabase-setup.sql` in your production Supabase project
3. Ensure all Supabase environment variables are set
4. Test admin panel access and user blocking features

## 📧 Support Email

Users blocked will see this email for support:
**support@nexbase.com**

Make sure to:
1. Set up this email address
2. Monitor for suspension appeals
3. Update the email in `src/app/suspended/page.tsx` if needed

---

**✨ The admin panel is now fully functional and ready to use!**

Access it at: http://localhost:3000/admin (when logged in as gregaquino2021@gmail.com)
