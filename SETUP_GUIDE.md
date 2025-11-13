# Phone Auth System Setup Guide

## Prerequisites

1. **Twilio Verify Service** - Sign up at https://www.twilio.com
   - Create a Verify Service in the Twilio Console
   - Get your Account SID, Auth Token, and Verify Service SID
   - **No phone number needed** - Verify uses Twilio's shared pool
   - Cost: Free trial, then $0.05 per verification attempt (cheaper than SMS!)

2. **Database** - PostgreSQL (Supabase recommended)
   - Already configured via `DATABASE_URL`

## Step 1: Install Dependencies

Dependencies are already installed in this worktree:
- `better-auth` - Authentication framework
- `twilio` - SMS provider
- `nanoid` - Token generation

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

### Required New Variables:

```env
# BetterAuth - Generate a random secret (min 32 characters)
BETTER_AUTH_SECRET=your-secret-key-here-min-32-characters

# Twilio Verify
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Your Twilio Verify Service:**
- Service SID: `your_verify_service_sid_here`
- Friendly Name: Your Service Name
- Account SID: `your_account_sid_here`

### Generate Auth Secret:

```bash
openssl rand -base64 32
```

## Step 3: Run Database Migration

Apply the new schema:

```bash
npx drizzle-kit push
```

This creates:
- `user` - BetterAuth users
- `session` - User sessions
- `verification` - OTP codes
- `profiles` - Extended user profiles
- `vagaro_sync_mappings` - Links users to Vagaro customers
- `friend_booking_requests` - Friend booking consent flow

## Step 4: Update Root Layout

The `AuthProvider` needs to wrap your app. Update `src/app/layout.tsx`:

```tsx
import { AuthProvider } from '@/components/auth/AuthProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

## Step 5: Test Authentication Flow

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login`

3. Enter a phone number

4. Check Twilio logs to confirm SMS was sent

5. Enter the OTP code

6. Verify user is redirected to dashboard

## Step 6: Set Up Twilio Verify

### Your Verify Service is Already Created!

Your credentials:
- **Account SID:** `your_account_sid_here`
- **Verify Service SID:** `your_verify_service_sid_here`
- **Service Name:** Your Service Name

### Get Your Auth Token:

1. Go to https://console.twilio.com
2. Dashboard → Account Info
3. Click "Show" next to Auth Token
4. Copy it to your `.env.local` as `TWILIO_AUTH_TOKEN`

### Test Verify (Optional):

```bash
curl -X POST "https://verify.twilio.com/v2/Services/YOUR_VERIFY_SERVICE_SID/Verifications" \
  --data-urlencode "To=+YOUR_PHONE" \
  --data-urlencode "Channel=sms" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/route.ts        # BetterAuth API
│   │   └── bookings/
│   │       └── friend/
│   │           ├── route.ts               # Create friend booking
│   │           └── [token]/
│   │               ├── accept/route.ts    # Accept booking
│   │               └── decline/route.ts   # Decline booking
│   ├── login/page.tsx                     # Login page
│   └── confirm/[token]/page.tsx           # Friend booking confirmation
├── components/
│   ├── auth/
│   │   ├── PhoneLoginForm.tsx             # Phone login UI
│   │   ├── AuthProvider.tsx               # Auth context provider
│   │   └── ProtectedRoute.tsx             # Route protection
│   └── bookings/
│       └── FriendBookingConfirmation.tsx  # Friend booking UI
├── db/
│   └── schema/
│       ├── auth_user.ts                   # User table
│       ├── auth_session.ts                # Session table
│       ├── auth_verification.ts           # OTP verification
│       ├── profiles.ts                    # User profiles
│       ├── vagaro_sync_mappings.ts        # Vagaro sync
│       └── friend_booking_requests.ts     # Friend bookings
├── actions/
│   └── profiles.ts                        # Profile server actions
└── lib/
    ├── auth.ts                            # BetterAuth server config
    ├── auth-client.ts                     # BetterAuth client
    ├── sms-provider.ts                    # Twilio SMS functions
    └── phone-utils.ts                     # Phone formatting
```

## Features Implemented

### ✅ Phone-First Authentication
- SMS OTP verification
- No passwords required
- 30-day sessions
- Automatic profile creation

### ✅ Progressive Profile System
- Start with phone only (20% complete)
- Add name/email later (+30%)
- Preferences (+20%)
- Additional details (+30%)

### ✅ Vagaro Integration
- Automatic customer matching by phone
- Links LashPop users to Vagaro customers
- Syncs appointment history
- Bidirectional sync ready

### ✅ Friend Booking
- Book appointments for friends
- SMS invitation with consent link
- Auto-creates account on acceptance
- 24-hour hold period

## API Endpoints

### Authentication
- `POST /api/auth/phone/send-otp` - Send OTP code
- `POST /api/auth/phone/verify-otp` - Verify code
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Sign out

### Friend Booking
- `POST /api/bookings/friend` - Create friend booking request
- `POST /api/bookings/friend/[token]/accept` - Accept booking
- `POST /api/bookings/friend/[token]/decline` - Decline booking

## Testing Checklist

- [ ] SMS OTP delivery works
- [ ] OTP verification succeeds
- [ ] Profile auto-created after auth
- [ ] Vagaro customer matching works
- [ ] Friend booking SMS sent
- [ ] Friend can accept booking
- [ ] Appointment created on acceptance
- [ ] Session persists across page reloads
- [ ] Protected routes redirect to login

## Troubleshooting

### SMS not sending
- Check Twilio credentials are correct
- Verify phone number format (+1234567890)
- Check Twilio console for errors
- Ensure trial account has verified the recipient (for trial accounts)

### Database errors
- Run migration: `npx drizzle-kit push`
- Check DATABASE_URL is correct
- Verify Supabase connection

### Auth not working
- Check BETTER_AUTH_SECRET is set
- Verify NEXT_PUBLIC_BASE_URL matches your domain
- Check browser console for errors

## Next Steps

1. **Deploy to production**
   - Set environment variables in Vercel/hosting
   - Upgrade Twilio from trial to paid account
   - Test SMS delivery in production

2. **Customize UI**
   - Update colors/branding in components
   - Add logo to login page
   - Customize SMS message templates

3. **Add features**
   - Email verification (optional)
   - Profile editing UI
   - Appointment management
   - Loyalty points tracking

## Cost Estimate

### Development (Trial)
- Twilio Verify Trial: Free
- Database: Free tier (Supabase)
- **Total: $0/month**

### Production (1,000 users)
- Twilio Verify (1,000 OTP verifications): $50/month
- Twilio SMS (500 friend invites + 2,000 reminders): $20/month
- Twilio phone number (for SMS): $1/month
- Database: Free tier
- **Total: ~$71/month**

### Production (10,000 users)
- Twilio Verify (10,000 OTP): $500/month
- Twilio SMS (5,000 friend invites + 20,000 reminders): $200/month
- Twilio phone number: $1/month
- Database: ~$25/month (paid tier)
- **Total: ~$726/month**

**Note:** Verify is $0.05 per verification attempt (send + check). Still cheaper than dealing with SMS pumping fraud!

## Support

For issues or questions:
- Check `/PHONE_AUTH_SYSTEM_PROPOSAL.md` for detailed architecture
- Review BetterAuth docs: https://www.better-auth.com
- Check Twilio docs: https://www.twilio.com/docs
