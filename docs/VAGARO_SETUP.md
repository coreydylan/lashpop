# Vagaro API Setup Guide

## Getting Your API Credentials

Your Vagaro API credentials appear to be encrypted (CryptoJS format). You need to get the actual unencrypted credentials from your Vagaro account.

### Steps to Get API Credentials:

1. **Log in to your Vagaro account**
   - Go to: https://us02.vagaro.com/merchants/settings/developers/webhooks

2. **Navigate to Developer Settings**
   - Click on Settings → Developers
   - Find the "API Credentials" section

3. **Generate or View Credentials**
   - Look for your `Client ID` and `Client Secret Key`
   - If you don't have them yet, click "Generate New Credentials"
   - **IMPORTANT**: Copy these values immediately - the secret key may only be shown once!

4. **Update Your `.env.local` File**

   Replace the encrypted values with your actual credentials:

   ```bash
   # Replace these with your actual credentials from Vagaro
   VAGARO_CLIENT_ID=your_actual_client_id_here
   VAGARO_CLIENT_SECRET=your_actual_client_secret_here
   ```

### Your Current Configuration:

- **Region**: `us02` (detected from your Vagaro URL)
- **API Base URL**: `https://api.vagaro.com`
- **Authentication Endpoint**: `https://api.vagaro.com/us02/api/v2/merchants/generate-access-token`

### Testing the Connection:

Once you've updated your credentials, test the connection:

```bash
npm run test:vagaro
```

Or run the test script directly:

```bash
npx tsx scripts/test-vagaro.ts
```

### Available Scopes:

The integration currently requests these scopes:
- `merchants.read` - Read business information
- `services.read` - Read service offerings
- `employees.read` - Read employee/staff information
- `appointments.read` - Read appointment data

You may need to adjust these scopes based on your Vagaro API access level.

### Troubleshooting:

**404 Not Found**
- Verify your region is correct (check your Vagaro URL subdomain)
- Make sure API access is enabled for your account

**401 Unauthorized**
- Double-check your Client ID and Client Secret
- Ensure the credentials are the actual values, not encrypted

**403 Forbidden**
- Check that your API scopes are correct
- Verify API access is enabled in your Vagaro account settings

### Security Note:

⚠️ **NEVER commit actual API credentials to version control!**

The `.env.local` file is already in `.gitignore`, but make sure you:
1. Never share your credentials publicly
2. Rotate credentials if they're ever exposed
3. Use environment variables in production (Vercel, etc.)
