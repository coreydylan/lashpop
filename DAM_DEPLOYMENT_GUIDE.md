# DAM Separate Deployment Guide

This guide will help you deploy the Digital Asset Management (DAM) system as a standalone application on a separate Vercel URL.

## Overview

Your DAM system can now be deployed separately from the main LashPop application. When deployed as a DAM-only instance:
- Root URL (`/`) automatically redirects to `/dam`
- Non-DAM routes are blocked and redirect to `/dam`
- Simple password authentication protects all DAM routes
- Users must log in at `/dam/login` before accessing the system

## Prerequisites

1. **Vercel Account**: You'll need a Vercel account
2. **GitHub Repository**: Your code should be in a Git repository
3. **Database**: PostgreSQL database (can share with main app or use separate instance)
4. **AWS S3**: S3 bucket for asset storage (can share with main app or use separate bucket/prefix)

## Step-by-Step Deployment

### 1. Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import the **same repository** as your main LashPop app
4. Choose a different name (e.g., `lashpop-dam`)
5. **Do NOT deploy yet** - we need to configure environment variables first

### 2. Configure Environment Variables

In your new Vercel project settings, add the following environment variables:

#### Required DAM Variables

```bash
# Enable DAM-only mode (CRITICAL - this makes it DAM-only)
DAM_ONLY_DEPLOYMENT=true

# DAM Password (set a strong password)
DAM_PASSWORD=your-strong-password-here
```

#### Database Configuration

**Option A: Shared Database** (Recommended for team member sync)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
# Use the SAME database URL as your main app
# This allows team members to sync between both deployments
```

**Option B: Separate Database**
```bash
DATABASE_URL=postgresql://user:password@host:5432/dam_database
# Use a different database for complete isolation
# Note: Team members won't sync between deployments
```

#### AWS S3 Configuration

**Option A: Shared Bucket with Prefix** (Recommended)
```bash
AWS_REGION=us-west-2
AWS_S3_BUCKET_NAME=lashpop-dam-assets
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_S3_BUCKET_URL=https://lashpop-dam-assets.s3.us-west-2.amazonaws.com

# Optionally modify your upload code to use a prefix like "dam-standalone/"
```

**Option B: Separate Bucket**
```bash
AWS_REGION=us-west-2
AWS_S3_BUCKET_NAME=lashpop-dam-standalone
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_S3_BUCKET_URL=https://lashpop-dam-standalone.s3.us-west-2.amazonaws.com
```

#### Optional Variables (if you have them configured)

```bash
# Only if you use these features in your main app
ENABLE_DB=true
ENABLE_SUPABASE=true
```

### 3. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your DAM will be available at `https://your-project-name.vercel.app`

### 4. Test Your Deployment

1. Visit your DAM URL (e.g., `https://lashpop-dam.vercel.app`)
2. You should be automatically redirected to `/dam/login`
3. Enter the password you set in `DAM_PASSWORD`
4. You should be redirected to the DAM gallery
5. Try uploading an asset
6. Try navigating to `/dam/team`
7. Test the logout button (top right)

### 5. Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add a custom domain (e.g., `dam.lashpopstudios.com`)
3. Follow Vercel's instructions to configure DNS

## Database Strategy Decision Guide

### When to Use Shared Database

**Pros:**
- Team members sync automatically between main app and DAM
- Easier to maintain (one database)
- Assets tagged with team members stay in sync

**Cons:**
- Both deployments access same data
- Schema changes affect both deployments

**Best for:**
- When DAM is an internal tool for the same team
- When you want team consistency across deployments

### When to Use Separate Database

**Pros:**
- Complete data isolation
- Can make DAM-specific schema changes
- No risk of affecting main app data

**Cons:**
- Team members need to be added separately
- No data sync between deployments

**Best for:**
- When DAM is for a different team/client
- When you want complete independence

## S3 Strategy Decision Guide

### When to Use Shared Bucket

**Pros:**
- Assets available in both deployments
- Lower costs (one bucket)
- Simpler to manage

**Cons:**
- Both deployments can access all assets
- Need to be careful with deletions

**Best for:**
- Internal use where assets should be shared
- When you want one source of truth for assets

### When to Use Separate Bucket

**Pros:**
- Complete asset isolation
- Clear separation of storage
- Independent lifecycle policies

**Cons:**
- Higher S3 costs (two buckets)
- Assets not shared between deployments

**Best for:**
- Different clients/teams
- When you need complete separation

## Security Recommendations

1. **Use a Strong Password**: The `DAM_PASSWORD` should be at least 16 characters with mixed case, numbers, and symbols

2. **Rotate Password Regularly**: Update the password every 3-6 months in Vercel environment variables

3. **HTTPS Only**: Vercel provides HTTPS by default - never allow HTTP access

4. **Limit Access**: Only share the password with authorized team members

5. **Future Enhancement**: Consider upgrading to a proper authentication system (Clerk, Auth0, etc.) for production use with multiple users

## Troubleshooting

### Issue: Redirected to login but password doesn't work

**Solution**:
- Check that `DAM_PASSWORD` environment variable is set in Vercel
- Redeploy after adding the variable
- Clear browser cookies and try again

### Issue: Can access routes other than /dam

**Solution**:
- Verify `DAM_ONLY_DEPLOYMENT=true` is set in environment variables
- Redeploy the project
- Clear browser cache

### Issue: Assets not uploading

**Solution**:
- Verify all AWS S3 environment variables are set correctly
- Check AWS IAM permissions for S3 bucket access
- Check browser console for specific error messages

### Issue: Database connection errors

**Solution**:
- Verify `DATABASE_URL` is correctly formatted
- Test database connection from another tool
- Check database firewall allows Vercel IP ranges
- Ensure database has DAM tables (may need to run migrations)

## Maintenance

### Updating the DAM Deployment

When you push changes to your repository:
1. Vercel will automatically redeploy the DAM instance
2. Both main app and DAM deployments will update
3. Test both deployments after updates

### Monitoring

1. Check Vercel Analytics for usage
2. Monitor S3 storage costs
3. Review Vercel logs for errors
4. Set up Vercel notifications for failed deployments

## Next Steps

Once deployed, consider:

1. **Add More Team Members**: Visit `/dam/team` to add team member photos
2. **Create Collections**: Use the command palette to create collections
3. **Set Up Tags**: Create tag categories for better organization
4. **Train Users**: Share login instructions with authorized users
5. **Monitor Usage**: Check Vercel analytics to see who's using the system

## Environment Variables Reference

Here's a complete `.env` file template for the DAM deployment:

```bash
# DAM Configuration (REQUIRED)
DAM_ONLY_DEPLOYMENT=true
DAM_PASSWORD=your-strong-password-here

# Database (REQUIRED)
ENABLE_DB=true
DATABASE_URL=postgresql://user:password@host:5432/database

# AWS S3 (REQUIRED)
AWS_REGION=us-west-2
AWS_S3_BUCKET_NAME=lashpop-dam-assets
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_S3_BUCKET_URL=https://lashpop-dam-assets.s3.us-west-2.amazonaws.com

# Optional (only if using Supabase)
ENABLE_SUPABASE=true
```

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test database and S3 connectivity independently

## Summary

You now have:
- ✅ Password-protected DAM at a separate URL
- ✅ Auto-redirect from root to `/dam`
- ✅ Logout functionality
- ✅ Flexible database and S3 strategies
- ✅ Ready for production use

The deployment uses the same codebase as your main app, making it easy to maintain and update both instances simultaneously.
