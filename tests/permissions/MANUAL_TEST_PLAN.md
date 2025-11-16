# Manual Test Plan for Permission System

This document provides a comprehensive checklist for manually testing the Digital Asset Management (DAM) permission system. Complete all tests to ensure the permission system works correctly across all user roles and scenarios.

## Test Environment Setup

Before starting, ensure you have:
- [ ] Access to admin panel at `/dam/admin/users`
- [ ] At least one user account for each role: `viewer`, `editor`, `admin`, `super_admin`
- [ ] Multiple test assets (images/videos) uploaded
- [ ] Multiple collections (tag categories) created
- [ ] Test accounts with various permission configurations

## 1. Authentication Tests

### Login and Session Management
- [ ] **Valid Login**: Login with valid phone number and OTP code
- [ ] **Invalid OTP**: Attempt login with incorrect OTP - should be rejected
- [ ] **Session Persistence**: Login and verify session persists across page refreshes
- [ ] **Session Expiry**: Wait for session to expire (or manually delete cookie) - should redirect to login
- [ ] **Logout**: Use logout button - should clear session and redirect to login
- [ ] **Concurrent Sessions**: Login from two different browsers - both should work

### Direct API Access Without Auth
- [ ] Try accessing `/api/dam/upload` without auth token - should return 401
- [ ] Try accessing `/api/dam/delete` without auth token - should return 401
- [ ] Try accessing `/api/dam/assets` without auth token - should return 401
- [ ] Try accessing `/api/admin/dam-users` without auth token - should return 401

## 2. Viewer Role Tests

### UI Visibility (Viewer)
- [ ] **Login as Viewer**: Login with viewer account
- [ ] **No Upload Button**: Upload button/interface should not be visible
- [ ] **No Delete Button**: Delete button should not be visible on assets
- [ ] **No Admin Menu**: Admin menu/link should not be visible
- [ ] **View Assets**: Can browse and view assets in grid/list
- [ ] **View Collections**: Can see collections they have access to
- [ ] **Search/Filter**: Can search and filter assets
- [ ] **Asset Details**: Can click on asset to view full details

### API Restrictions (Viewer)
- [ ] Try POST to `/api/dam/upload` - should return 403 (unless has `canUpload` permission)
- [ ] Try POST to `/api/dam/delete` - should return 403 (unless has `canDelete` permission)
- [ ] Try GET to `/api/admin/dam-users` - should return 403
- [ ] Try POST to `/api/admin/dam-users` - should return 403

### Viewer with Explicit Permissions
- [ ] **Grant canUpload**: Admin grants viewer `canUpload` permission
- [ ] **Verify Upload Access**: Viewer can now upload assets
- [ ] **Still No Delete**: Viewer still cannot delete assets
- [ ] **Revoke canUpload**: Admin revokes `canUpload` permission
- [ ] **Verify Upload Blocked**: Viewer can no longer upload assets

## 3. Editor Role Tests

### UI Visibility (Editor)
- [ ] **Login as Editor**: Login with editor account
- [ ] **Upload Access**: Can see and use upload button (if has `canUpload`)
- [ ] **Edit Access**: Can edit asset metadata, tags, team assignments
- [ ] **Limited Delete**: Cannot delete unless has `canDelete` permission
- [ ] **No Admin Menu**: Admin menu should not be visible
- [ ] **Collection Management**: Can create/edit collections (if has `canManageCollections`)

### API Access (Editor)
- [ ] **Upload Assets**: POST to `/api/dam/upload` - should succeed if has `canUpload`
- [ ] **Edit Asset Tags**: POST to `/api/dam/assets/bulk-tag` - should succeed
- [ ] **Delete Assets**: POST to `/api/dam/delete` - should fail unless has `canDelete`
- [ ] **User Management**: GET/POST to `/api/admin/dam-users` - should return 403

### Editor Permission Combinations
- [ ] **Editor + canUpload**: Can upload assets
- [ ] **Editor + canDelete**: Can delete assets
- [ ] **Editor + canManageCollections**: Can manage collections
- [ ] **Editor without canUpload**: Cannot upload assets
- [ ] **Editor without canDelete**: Cannot delete assets

## 4. Admin Role Tests

### UI Visibility (Admin)
- [ ] **Login as Admin**: Login with admin account
- [ ] **Full Upload Access**: Can upload assets
- [ ] **Full Delete Access**: Can delete assets
- [ ] **Admin Menu Visible**: Can see and access admin panel
- [ ] **User Management**: Can view user list at `/dam/admin/users`
- [ ] **Collection Management**: Can create, edit, delete collections
- [ ] **All Collections**: Can access all collections regardless of permissions

### Admin User Management
- [ ] **View All Users**: Can see list of all DAM users
- [ ] **Edit Viewer Role**: Can change viewer's role to editor
- [ ] **Edit Editor Role**: Can change editor's role to viewer
- [ ] **Cannot Edit Super Admin**: Cannot modify super_admin user's role
- [ ] **Grant Permissions**: Can grant specific permissions to users
- [ ] **Revoke Permissions**: Can revoke permissions from users
- [ ] **Link Team Member**: Can link user to team member profile
- [ ] **Deactivate User**: Can set user as inactive
- [ ] **Reactivate User**: Can set inactive user back to active
- [ ] **View Audit Log**: Can view permission change audit log

### Admin API Access
- [ ] GET `/api/admin/dam-users` - should return 200 with user list
- [ ] POST `/api/admin/dam-users` with `action: update_role` - should succeed for non-super_admin
- [ ] POST `/api/admin/dam-users` with `action: update_permissions` - should succeed
- [ ] POST `/api/admin/dam-users` with `action: toggle_active` - should succeed for non-super_admin
- [ ] All DAM asset endpoints - should have full access

### Admin Restrictions
- [ ] **Cannot Modify Super Admin**: Try to change super_admin role - should return 403
- [ ] **Cannot Deactivate Super Admin**: Try to deactivate super_admin - should return 403
- [ ] **Cannot Grant Super Admin**: Try to promote user to super_admin - should return 403

## 5. Super Admin Role Tests

### UI Visibility (Super Admin)
- [ ] **Login as Super Admin**: Login with super_admin account
- [ ] **Full System Access**: Can access all features
- [ ] **Admin Menu**: Admin panel visible
- [ ] **User Management**: Full user management access

### Super Admin User Management
- [ ] **View All Users**: Can see all users including other super_admins
- [ ] **Edit Any User**: Can edit any user's role and permissions
- [ ] **Edit Super Admin**: Can modify other super_admin users
- [ ] **Promote to Super Admin**: Can promote admin to super_admin
- [ ] **Demote Super Admin**: Can demote super_admin to admin
- [ ] **Deactivate Super Admin**: Can deactivate super_admin accounts
- [ ] **Create Super Admin**: Can create new super_admin users

### Super Admin API Access
- [ ] POST `/api/admin/dam-users` to edit super_admin - should succeed
- [ ] POST `/api/admin/dam-users` to promote to super_admin - should succeed
- [ ] POST `/api/admin/dam-users` to deactivate super_admin - should succeed
- [ ] All other endpoints - full access

## 6. Inactive User Tests

### Inactive User Restrictions
- [ ] **Deactivate User**: Admin sets user as inactive
- [ ] **Login Blocked**: Inactive user cannot login (or is logged out)
- [ ] **API Access Blocked**: All API calls return 403 with "inactive" message
- [ ] **Reactivate User**: Admin reactivates user
- [ ] **Access Restored**: User can login and use system normally

## 7. Collection-Level Permissions Tests

### Collection Access Control
- [ ] **Create Collection**: Admin creates new collection "Collection A"
- [ ] **Assign Viewer**: Add viewer to collection viewers list
- [ ] **Verify View Access**: Viewer can see "Collection A" assets
- [ ] **Verify No Edit**: Viewer cannot edit "Collection A" settings
- [ ] **Add to Editors**: Add viewer to collection editors list
- [ ] **Verify Edit Access**: Viewer can now edit "Collection A"

### Collection Permission Inheritance
- [ ] **User with "all" collections**: User can access any collection
- [ ] **User with specific collections**: User can only access listed collections
- [ ] **User with no collections**: User cannot access any collection (unless admin)
- [ ] **Admin Override**: Admin can access all collections regardless of list

### Global vs Collection Permissions
- [ ] **Global Permission**: User has global `canUpload` permission
- [ ] **Collection Restriction**: User only has access to specific collections
- [ ] **Verify Behavior**: User can upload but only see their allowed collections
- [ ] **Collection Override**: Collection-specific permissions override global settings

## 8. Permission Change Audit Log Tests

### Audit Log Recording
- [ ] **Role Change**: Admin changes user role - check audit log entry created
- [ ] **Permission Grant**: Admin grants permission - check audit log entry
- [ ] **Permission Revoke**: Admin revokes permission - check audit log entry
- [ ] **User Activation**: Admin activates user - check audit log entry
- [ ] **User Deactivation**: Admin deactivates user - check audit log entry
- [ ] **Team Member Link**: Admin links team member - check audit log entry

### Audit Log Details
- [ ] **User ID**: Verify correct user ID in log
- [ ] **Changed By**: Verify admin who made change is recorded
- [ ] **Action Type**: Verify correct action type (role_changed, etc.)
- [ ] **Old Value**: Verify previous value is recorded
- [ ] **New Value**: Verify new value is recorded
- [ ] **Timestamp**: Verify timestamp is accurate
- [ ] **Reason**: If provided, reason is recorded

### Audit Log Access
- [ ] **Admin Access**: Admin can view audit log at `/api/admin/permission-audit`
- [ ] **Non-Admin Blocked**: Non-admin users cannot access audit log
- [ ] **Filter by User**: Can filter audit log by specific user
- [ ] **Date Range**: Can filter audit log by date range

## 9. API Endpoint Security Tests

### Upload Endpoint (`/api/dam/upload`)
- [ ] **No Auth**: Returns 401
- [ ] **Inactive User**: Returns 403
- [ ] **No Permission**: Returns 403
- [ ] **With Permission**: Returns 200/207
- [ ] **Admin**: Returns 200/207 (auto-granted)
- [ ] **File Validation**: Rejects non-image/video files
- [ ] **Size Validation**: Rejects files over 200MB

### Delete Endpoint (`/api/dam/delete`)
- [ ] **No Auth**: Returns 401
- [ ] **Inactive User**: Returns 403
- [ ] **No Permission**: Returns 403
- [ ] **With Permission**: Returns 200
- [ ] **Admin**: Returns 200 (auto-granted)
- [ ] **Invalid Asset ID**: Returns appropriate error
- [ ] **Audit Trail**: Deletion is logged to console

### User Management Endpoint (`/api/admin/dam-users`)
- [ ] **GET - No Auth**: Returns 401
- [ ] **GET - Non-Admin**: Returns 403
- [ ] **GET - Admin**: Returns 200 with user list
- [ ] **POST - Update Role**: Works with proper permissions
- [ ] **POST - Update Permissions**: Works with proper permissions
- [ ] **POST - Invalid Action**: Returns 400
- [ ] **POST - Missing Fields**: Returns 400

## 10. Edge Cases and Error Handling

### Session Edge Cases
- [ ] **Expired Token**: Old token returns 401
- [ ] **Invalid Token**: Malformed token returns 401
- [ ] **Missing Cookie**: No auth cookie returns 401
- [ ] **Concurrent Changes**: User role changed while logged in - check behavior

### Permission Edge Cases
- [ ] **Permission Object Missing**: Handle gracefully with defaults
- [ ] **Invalid Role Value**: Reject with validation error
- [ ] **Empty Permissions**: User with no permissions can only view
- [ ] **Conflicting Permissions**: Collection permissions override global

### Error Messages
- [ ] **401 Errors**: Clear authentication error messages
- [ ] **403 Errors**: Clear permission denied messages
- [ ] **404 Errors**: User/resource not found messages
- [ ] **500 Errors**: Generic error handling without exposing internals

## 11. Multi-User Scenarios

### Concurrent Operations
- [ ] **Two Users Upload**: Both can upload simultaneously
- [ ] **Admin Changes Permissions**: Changes take effect for active sessions
- [ ] **User Deactivated**: Active session is blocked immediately
- [ ] **Collection Shared**: Multiple users can access same collection

### Collaboration Tests
- [ ] **Editor A Tags Asset**: Editor B can see the tags
- [ ] **Admin Grants Permission**: User gains access immediately
- [ ] **Collection Created**: Users with access can see it
- [ ] **Team Member Linked**: Photos associated with correct team member

## 12. Performance and Scale

### Load Testing
- [ ] **100 Assets**: System performs well with 100+ assets
- [ ] **10 Collections**: Can handle multiple collections efficiently
- [ ] **50 Users**: User list loads quickly with many users
- [ ] **Complex Permissions**: Nested/complex permissions don't slow down system

## Test Results Summary

After completing all tests, summarize results:

### Passed Tests
- Total tests passed: _____ / _____
- Critical issues: _____
- Minor issues: _____
- Notes: _____________________________

### Failed Tests
List any failed tests with details:
1. _____________________________
2. _____________________________
3. _____________________________

### Recommendations
- _____________________________
- _____________________________
- _____________________________

## Notes

- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on different devices (desktop, tablet, mobile)
- Clear browser cache between test runs if needed
- Document any unexpected behavior
- Take screenshots of errors for debugging
- Test with realistic data volumes
- Verify database state after permission changes

---

**Tester Name**: _______________
**Date**: _______________
**Environment**: _______________
**Browser/Version**: _______________
