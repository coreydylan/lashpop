# Access Control

## Overview

The Access Control API manages permission tiers and role-based access for users, enabling fine-grained control over who can perform specific operations.

## Endpoints

### Get Access Levels

**Method:** `GET`

**Purpose:** Retrieve available permission tiers and access levels for user management.

#### Request

```http
GET /api/access/levels
Authorization: Bearer {access_token}
```

#### Response

```json
{
  "access_levels": [
    {
      "level_id": "owner",
      "name": "Owner",
      "description": "Full system access with business management capabilities",
      "permissions": [
        "manage_business",
        "manage_locations",
        "manage_employees",
        "manage_customers",
        "manage_appointments",
        "manage_services",
        "manage_billing",
        "manage_reports",
        "manage_access_control",
        "view_all_data",
        "delete_data"
      ]
    },
    {
      "level_id": "manager",
      "name": "Manager",
      "description": "Location management with staff supervision",
      "permissions": [
        "manage_employees",
        "manage_customers",
        "manage_appointments",
        "manage_services",
        "view_reports",
        "manage_location_settings"
      ]
    },
    {
      "level_id": "employee",
      "name": "Employee",
      "description": "Service provider with customer and appointment access",
      "permissions": [
        "view_customers",
        "manage_appointments",
        "view_services",
        "update_own_schedule",
        "view_own_reports"
      ]
    },
    {
      "level_id": "receptionist",
      "name": "Receptionist",
      "description": "Front desk operations with booking and customer management",
      "permissions": [
        "manage_customers",
        "manage_appointments",
        "view_services",
        "view_schedules",
        "process_payments"
      ]
    },
    {
      "level_id": "limited",
      "name": "Limited Access",
      "description": "Read-only access for reporting or auditing",
      "permissions": ["view_reports", "view_appointments", "view_customers"]
    }
  ]
}
```

---

## Permission Categories

### Business Management
- `manage_business` - Business settings and configuration
- `manage_locations` - Create, update, delete locations
- `manage_access_control` - Assign roles and permissions

### Staff Operations
- `manage_employees` - Employee lifecycle management
- `view_employees` - View employee information
- `update_own_schedule` - Modify personal availability

### Customer Management
- `manage_customers` - Full customer CRUD operations
- `view_customers` - Read-only customer access
- `delete_customers` - Remove customer records

### Appointment Handling
- `manage_appointments` - Create, update, cancel appointments
- `view_appointments` - Read-only appointment access
- `view_schedules` - View employee schedules

### Service Management
- `manage_services` - Service catalog management
- `view_services` - Read-only service access

### Financial Operations
- `manage_billing` - Billing and payment settings
- `process_payments` - Process customer payments
- `view_financial_reports` - Financial reporting access

### Reporting
- `view_reports` - General reporting access
- `view_own_reports` - Personal performance reports
- `view_all_data` - Unrestricted data access

### System Operations
- `delete_data` - Permanent data deletion
- `manage_integrations` - API and webhook configuration
- `view_audit_logs` - Security and audit logging

---

## Access Level Hierarchy

```
Owner (Full Access)
  ├── Manage all business operations
  ├── Access to all locations
  └── Can assign any access level

Manager
  ├── Location-specific management
  ├── Staff supervision
  └── Cannot modify owner settings

Employee
  ├── Service delivery
  ├── Personal schedule management
  └── Limited customer interaction

Receptionist
  ├── Front desk operations
  ├── Booking management
  └── Cannot modify services or settings

Limited Access
  ├── Read-only access
  └── Reporting and auditing
```

---

## Common Use Cases

### Check User Permissions

```javascript
async function canUserPerformAction(userId, requiredPermission) {
  const { access_levels } = await getAccessLevels();

  // Get user's access level (from your auth system)
  const userAccessLevel = await getUserAccessLevel(userId);

  const accessLevel = access_levels.find(
    level => level.level_id === userAccessLevel
  );

  return accessLevel?.permissions.includes(requiredPermission) || false;
}
```

### Role-Based UI Rendering

```javascript
async function getUserCapabilities(userId) {
  const userAccessLevel = await getUserAccessLevel(userId);
  const { access_levels } = await getAccessLevels();

  const accessLevel = access_levels.find(
    level => level.level_id === userAccessLevel
  );

  return {
    canManageEmployees: accessLevel.permissions.includes('manage_employees'),
    canManageCustomers: accessLevel.permissions.includes('manage_customers'),
    canViewReports: accessLevel.permissions.includes('view_reports'),
    canProcessPayments: accessLevel.permissions.includes('process_payments'),
    canManageServices: accessLevel.permissions.includes('manage_services')
  };
}
```

### Access Control Middleware

```javascript
function requirePermission(permission) {
  return async (req, res, next) => {
    const userId = req.user.id;
    const hasPermission = await canUserPerformAction(userId, permission);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        message: `This action requires '${permission}' permission`
      });
    }

    next();
  };
}

// Usage
app.delete('/api/customers/:id', requirePermission('delete_customers'), async (req, res) => {
  // Delete customer logic
});
```

---

## Multi-Location Access Control

### Location-Specific Permissions

```javascript
async function canUserAccessLocation(userId, locationId) {
  const userLocations = await getUserAssignedLocations(userId);
  const userAccessLevel = await getUserAccessLevel(userId);

  // Owners and managers can access all locations
  if (['owner', 'manager'].includes(userAccessLevel)) {
    return true;
  }

  // Other roles need explicit assignment
  return userLocations.includes(locationId);
}
```

### Employee Assignment Validation

```javascript
async function validateEmployeeAssignment(managerId, employeeId, locationId) {
  const managerAccessLevel = await getUserAccessLevel(managerId);

  // Check if manager has permission to manage employees
  if (!await canUserPerformAction(managerId, 'manage_employees')) {
    throw new Error('Insufficient permissions to manage employees');
  }

  // Check if manager has access to the location
  if (!await canUserAccessLocation(managerId, locationId)) {
    throw new Error('No access to this location');
  }

  // Only owners can assign managers
  if (await getUserAccessLevel(employeeId) === 'manager' && managerAccessLevel !== 'owner') {
    throw new Error('Only owners can assign manager roles');
  }

  return true;
}
```

---

## Security Best Practices

### 1. Principle of Least Privilege

Always assign the minimum access level needed:

```javascript
const roleRecommendations = {
  service_provider: 'employee',
  front_desk: 'receptionist',
  location_supervisor: 'manager',
  business_owner: 'owner',
  accountant: 'limited' // Read-only for reporting
};
```

### 2. Permission Verification

Verify permissions on both frontend and backend:

```javascript
// Frontend - UI hiding
function renderActionButton(action, userId) {
  const canPerform = await canUserPerformAction(userId, action);

  if (!canPerform) {
    return null; // Hide button
  }

  return <Button>{action}</Button>;
}

// Backend - API enforcement
app.post('/api/appointments', requirePermission('manage_appointments'), handler);
```

### 3. Audit Trail

Log all permission-related actions:

```javascript
async function logAccessControlChange(performedBy, action, targetUser) {
  await createAuditLog({
    timestamp: new Date().toISOString(),
    performed_by: performedBy,
    action: action,
    target_user: targetUser,
    access_level_before: await getUserAccessLevel(targetUser),
    access_level_after: newAccessLevel
  });
}
```

### 4. Regular Access Reviews

```javascript
async function reviewAccessLevels() {
  const allUsers = await getAllUsers();
  const reviewDate = new Date();

  for (const user of allUsers) {
    const lastLogin = await getLastLoginDate(user.id);
    const daysSinceLogin = (reviewDate - lastLogin) / (1000 * 60 * 60 * 24);

    // Flag inactive users with high access
    if (daysSinceLogin > 90 && ['owner', 'manager'].includes(user.access_level)) {
      console.warn(`Review access for inactive user: ${user.email}`);
    }
  }
}
```

---

## Error Handling

### 403 Forbidden

```json
{
  "error": "insufficient_permissions",
  "message": "This action requires 'manage_employees' permission",
  "required_permission": "manage_employees",
  "user_access_level": "employee"
}
```

### 401 Unauthorized

```json
{
  "error": "authentication_required",
  "message": "Access token is missing or invalid"
}
```

### 404 Not Found

```json
{
  "error": "access_level_not_found",
  "message": "Access level 'invalid_level' does not exist"
}
```

---

## Access Control Checklist

### Implementation Checklist

- [ ] Implement authentication system
- [ ] Fetch and cache access levels
- [ ] Create permission checking functions
- [ ] Add authorization middleware
- [ ] Implement frontend permission checks
- [ ] Test all permission boundaries
- [ ] Set up audit logging
- [ ] Document role assignments
- [ ] Train staff on access levels
- [ ] Schedule regular access reviews

### Security Checklist

- [ ] Never trust client-side permission checks
- [ ] Always verify permissions server-side
- [ ] Use secure authentication tokens
- [ ] Implement session management
- [ ] Log all sensitive operations
- [ ] Review access logs regularly
- [ ] Implement IP restrictions if needed
- [ ] Use 2FA for owner accounts
- [ ] Rotate credentials regularly
- [ ] Have access revocation process

---

## Integration Examples

### Complete Authorization Flow

```javascript
class AuthorizationService {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.accessLevelsCache = null;
  }

  async getAccessLevels() {
    if (!this.accessLevelsCache) {
      const response = await this.apiClient.get('/api/access/levels');
      this.accessLevelsCache = response.access_levels;
    }
    return this.accessLevelsCache;
  }

  async getUserPermissions(userId) {
    const userAccessLevel = await this.getUserAccessLevel(userId);
    const accessLevels = await this.getAccessLevels();

    const level = accessLevels.find(l => l.level_id === userAccessLevel);
    return level?.permissions || [];
  }

  async hasPermission(userId, permission) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async requirePermission(userId, permission) {
    const hasPermission = await this.hasPermission(userId, permission);

    if (!hasPermission) {
      throw new Error(`Missing required permission: ${permission}`);
    }
  }

  async canAccessLocation(userId, locationId) {
    const userAccessLevel = await this.getUserAccessLevel(userId);

    // Owners can access all locations
    if (userAccessLevel === 'owner') {
      return true;
    }

    // Check location assignments
    const userLocations = await this.getUserLocations(userId);
    return userLocations.includes(locationId);
  }
}
```

---

## Related Sections

- [Authentication](./01-authentication.md) - Access token generation
- [Employees](./02-employees.md) - Employee role assignments
- [Business Locations](./05-locations.md) - Location-based access control
