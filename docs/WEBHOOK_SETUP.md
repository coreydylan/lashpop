# Vagaro Webhook Setup Guide

## Quick Deploy to Vercel

### 1. Deploy to Vercel (if not already deployed)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to Vercel
vercel

# Or push to GitHub and connect via Vercel dashboard
```

### 2. Your Webhook URL

Once deployed, your webhook endpoint will be at:

```
https://your-domain.vercel.app/api/webhooks/vagaro
```

Replace `your-domain` with your actual Vercel domain.

### 3. Configure in Vagaro

1. **Go to**: https://us02.vagaro.com/merchants/settings/developers/webhooks

2. **Add New Webhook**:
   - **Webhook URL**: `https://your-domain.vercel.app/api/webhooks/vagaro`
   - **Events to Subscribe**:
     - ✅ Customer Created
     - ✅ Customer Updated
     - ✅ Appointment Created
     - ✅ Appointment Updated

3. **Save the webhook**

### 4. Test to Get Business ID

Once configured, trigger a test event:

**Option A - Create Test Customer:**
1. Go to your Vagaro admin
2. Add a new test customer (or update an existing one)
3. This triggers the webhook

**Option B - Create Test Appointment:**
1. Book a test appointment through Vagaro
2. This triggers the webhook

**Option C - Use Vagaro's Test Function:**
- Look for a "Test Webhook" or "Send Test Event" button in Vagaro webhook settings
- Click it to send a test payload

### 5. View the Business ID

After triggering an event, check your webhook logs:

**In Vercel:**
1. Go to your Vercel dashboard
2. Click on your project
3. Go to "Functions" tab
4. Click on the `/api/webhooks/vagaro` function
5. View the logs - the Business ID will be printed there

**Or check locally:**
```bash
# Run in dev mode
npm run dev

# Use ngrok to expose localhost
npx ngrok http 3000

# Use the ngrok URL temporarily in Vagaro settings
https://xxxxx.ngrok.io/api/webhooks/vagaro
```

### 6. Add Business ID to Environment Variables

Once you see the Business ID in the logs:

**In Vercel:**
1. Go to Project Settings → Environment Variables
2. Add: `VAGARO_BUSINESS_ID` = `[the value from webhook]`
3. Redeploy

**Locally:**
Update `.env.local`:
```bash
VAGARO_BUSINESS_ID=your_business_id_here
```

---

## Webhook Payload Example

You should receive something like:

```json
{
  "eventType": "customer.created",
  "businessId": "U2FsdGVkX18zRbwyUxRZaHNTYGwjKCpDdAkKP4eUDsE=",
  "customerId": "cust_123456",
  "timestamp": "2025-11-06T21:00:00Z",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  }
}
```

The `businessId` field is what you need!

---

## Troubleshooting

**Webhook not receiving events:**
- Check the webhook URL is correct
- Verify SSL certificate is valid (Vercel provides this automatically)
- Check Vercel function logs for errors
- Ensure webhook is enabled in Vagaro settings

**Can't see logs:**
- In Vercel, logs appear in real-time under Functions → [function-name]
- Alternatively, use `console.log` and check Vercel deployment logs

**Business ID not in payload:**
- Try different event types (appointment vs customer events)
- Check Vagaro documentation for payload structure
- Contact Vagaro support to confirm which events include businessId
