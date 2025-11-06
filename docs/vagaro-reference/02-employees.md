# Employee Management

## Overview

The Employee API enables comprehensive staff management across multiple locations, including assignment, scheduling, profile updates, and removal.

## Endpoints

### Retrieve Employee

**Method:** `POST`

**Purpose:** Fetch employee details including contact information, assigned locations, and services.

#### Request

```http
POST /api/employees/retrieve
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "employee_id": "emp_12345"
}
```

#### Response

```json
{
  "employee_id": "emp_12345",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+1234567890",
  "locations": ["loc_001", "loc_002"],
  "services": ["service_123", "service_456"],
  "status": "active"
}
```

---

### Assign Employee

**Method:** `POST`

**Purpose:** Assign an employee to a specific business location for multi-location management.

#### Request

```http
POST /api/employees/assign
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "employee_id": "emp_12345",
  "location_id": "loc_003",
  "services": ["service_123", "service_456"],
  "start_date": "2025-01-15"
}
```

#### Response

```json
{
  "success": true,
  "employee_id": "emp_12345",
  "location_id": "loc_003",
  "assigned_at": "2025-11-06T10:30:00Z"
}
```

---

### Unassign Employee

**Method:** `POST`

**Purpose:** Remove an employee assignment from a specific location.

#### Request

```http
POST /api/employees/unassign
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "employee_id": "emp_12345",
  "location_id": "loc_003"
}
```

#### Response

```json
{
  "success": true,
  "employee_id": "emp_12345",
  "location_id": "loc_003",
  "unassigned_at": "2025-11-06T10:30:00Z"
}
```

---

### Update Employee

**Method:** `PUT`

**Purpose:** Modify employee profile information.

#### Request

```http
PUT /api/employees/update
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "employee_id": "emp_12345",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.newemail@example.com",
  "phone": "+1234567890",
  "status": "active"
}
```

#### Response

```json
{
  "success": true,
  "employee_id": "emp_12345",
  "updated_at": "2025-11-06T10:30:00Z"
}
```

---

### Update Employee Working Hours

**Method:** `PUT`

**Purpose:** Modify employee availability and scheduling information.

#### Request

```http
PUT /api/employees/working-hours
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "employee_id": "emp_12345",
  "location_id": "loc_001",
  "schedule": {
    "monday": {
      "start_time": "09:00",
      "end_time": "17:00",
      "breaks": [
        {
          "start_time": "12:00",
          "end_time": "13:00"
        }
      ]
    },
    "tuesday": {
      "start_time": "09:00",
      "end_time": "17:00"
    },
    "wednesday": {
      "start_time": "09:00",
      "end_time": "17:00"
    },
    "thursday": {
      "start_time": "09:00",
      "end_time": "17:00"
    },
    "friday": {
      "start_time": "09:00",
      "end_time": "15:00"
    },
    "saturday": null,
    "sunday": null
  }
}
```

#### Response

```json
{
  "success": true,
  "employee_id": "emp_12345",
  "schedule_updated_at": "2025-11-06T10:30:00Z"
}
```

---

### Delete Employee

**Method:** `POST`

**Purpose:** Remove an employee from the system.

#### Request

```http
POST /api/employees/delete
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "employee_id": "emp_12345"
}
```

#### Response

```json
{
  "success": true,
  "employee_id": "emp_12345",
  "deleted_at": "2025-11-06T10:30:00Z"
}
```

---

## Common Use Cases

### Multi-Location Staff Management

1. **Assign to Multiple Locations**
   ```javascript
   const locations = ['loc_001', 'loc_002', 'loc_003'];

   for (const locationId of locations) {
     await assignEmployee({
       employee_id: 'emp_12345',
       location_id: locationId,
       services: ['service_123']
     });
   }
   ```

2. **Update Schedules Across Locations**
   ```javascript
   await updateWorkingHours({
     employee_id: 'emp_12345',
     location_id: 'loc_001',
     schedule: mondayToFridaySchedule
   });
   ```

### Employee Lifecycle

1. Create employee (via admin interface)
2. Assign to location(s) with services
3. Update working hours
4. Update profile information as needed
5. Unassign from locations when needed
6. Delete when permanently removing

## Error Handling

### 404 Not Found

```json
{
  "error": "employee_not_found",
  "message": "Employee with ID emp_12345 does not exist"
}
```

### 400 Bad Request

```json
{
  "error": "invalid_schedule",
  "message": "Invalid time format in working hours"
}
```

### 409 Conflict

```json
{
  "error": "already_assigned",
  "message": "Employee is already assigned to this location"
}
```

## Best Practices

1. **Validate Before Assignment**
   - Check employee exists before assigning
   - Verify location is active
   - Ensure services are available at location

2. **Schedule Management**
   - Use consistent time format (24-hour)
   - Account for timezone differences
   - Include break periods for accurate availability

3. **Multi-Location Handling**
   - Track which locations need coverage
   - Avoid conflicting schedules across locations
   - Update all locations when employee status changes

## Related Sections

- [Business Locations](./05-locations.md)
- [Services](./06-services.md)
- [Appointments](./04-appointments.md)
- [Webhooks - Employee Events](./09-webhooks.md#employee-webhooks)
