# Personal Tasks

## Overview

The Personal Tasks API enables individual task workflow management, allowing users to create, retrieve, update, and delete tasks for tracking work and reminders.

## Endpoints

### Create Personal Task

**Method:** `POST`

**Purpose:** Create a new personal task with title, description, and due date.

#### Request

```http
POST /api/tasks/create
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "title": "Follow up with client",
  "description": "Call Sarah Johnson about upcoming color appointment",
  "due_date": "2025-11-15T14:00:00Z",
  "priority": "high",
  "category": "customer_follow_up",
  "assignee_id": "emp_12345"
}
```

#### Response

```json
{
  "task_id": "task_98765",
  "title": "Follow up with client",
  "description": "Call Sarah Johnson about upcoming color appointment",
  "due_date": "2025-11-15T14:00:00Z",
  "priority": "high",
  "category": "customer_follow_up",
  "assignee_id": "emp_12345",
  "status": "pending",
  "created_at": "2025-11-06T10:30:00Z",
  "updated_at": "2025-11-06T10:30:00Z"
}
```

---

### Retrieve Personal Tasks

**Method:** `POST`

**Purpose:** Fetch tasks with optional filtering by status, date, or assignee.

#### Request - All Tasks

```http
POST /api/tasks/retrieve
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{}
```

#### Request - Filtered Tasks

```json
{
  "assignee_id": "emp_12345",
  "status": "pending",
  "due_date_start": "2025-11-01",
  "due_date_end": "2025-11-30"
}
```

#### Response

```json
{
  "tasks": [
    {
      "task_id": "task_98765",
      "title": "Follow up with client",
      "description": "Call Sarah Johnson about upcoming color appointment",
      "due_date": "2025-11-15T14:00:00Z",
      "priority": "high",
      "category": "customer_follow_up",
      "assignee_id": "emp_12345",
      "assignee_name": "Jane Smith",
      "status": "pending",
      "created_at": "2025-11-06T10:30:00Z",
      "updated_at": "2025-11-06T10:30:00Z"
    },
    {
      "task_id": "task_98766",
      "title": "Order supplies",
      "description": "Restock color products and foils",
      "due_date": "2025-11-10T12:00:00Z",
      "priority": "medium",
      "category": "inventory",
      "assignee_id": "emp_12345",
      "assignee_name": "Jane Smith",
      "status": "pending",
      "created_at": "2025-11-05T09:00:00Z",
      "updated_at": "2025-11-05T09:00:00Z"
    },
    {
      "task_id": "task_98767",
      "title": "Update service menu",
      "description": "Add new keratin treatment to services",
      "due_date": "2025-11-08T10:00:00Z",
      "priority": "low",
      "category": "admin",
      "assignee_id": "emp_12345",
      "assignee_name": "Jane Smith",
      "status": "completed",
      "completed_at": "2025-11-07T15:30:00Z",
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-07T15:30:00Z"
    }
  ],
  "total_count": 3,
  "pending_count": 2,
  "completed_count": 1
}
```

---

### Update Personal Task

**Method:** `PUT`

**Purpose:** Modify task details, status, or assignment.

#### Request

```http
PUT /api/tasks/update
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "task_id": "task_98765",
  "status": "in_progress",
  "notes": "Left voicemail, will try again tomorrow"
}
```

#### Request - Complete Task

```json
{
  "task_id": "task_98765",
  "status": "completed",
  "completed_at": "2025-11-06T14:30:00Z"
}
```

#### Response

```json
{
  "success": true,
  "task_id": "task_98765",
  "status": "completed",
  "updated_at": "2025-11-06T14:30:00Z"
}
```

---

### Delete Personal Task

**Method:** `POST`

**Purpose:** Remove a task from the system.

#### Request

```http
POST /api/tasks/delete
Authorization: Bearer {access_token}
Content-Type: application/json
```

```json
{
  "task_id": "task_98765"
}
```

#### Response

```json
{
  "success": true,
  "task_id": "task_98765",
  "deleted_at": "2025-11-06T10:30:00Z"
}
```

---

## Task Data Fields

### Core Fields
- `task_id` - Unique task identifier
- `title` - Task title/summary
- `description` - Detailed task description
- `due_date` - When task should be completed
- `priority` - Task priority (low, medium, high, urgent)
- `category` - Task category/type
- `assignee_id` - Employee assigned to task
- `status` - Current task status

### Status Values
- `pending` - Not yet started
- `in_progress` - Currently being worked on
- `completed` - Task finished
- `cancelled` - Task cancelled

### Timestamps
- `created_at` - Task creation time
- `updated_at` - Last modification time
- `completed_at` - Completion time (if completed)

---

## Task Categories

Common task categories:

- `customer_follow_up` - Customer communication tasks
- `inventory` - Inventory management
- `admin` - Administrative tasks
- `marketing` - Marketing activities
- `maintenance` - Equipment/facility maintenance
- `training` - Staff training and development
- `appointment_prep` - Appointment preparation
- `billing` - Billing and invoicing

---

## Common Use Cases

### Daily Task List

```javascript
async function getTodaysTasks(employeeId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { tasks } = await retrieveTasks({
    assignee_id: employeeId,
    due_date_start: today.toISOString(),
    due_date_end: tomorrow.toISOString(),
    status: 'pending'
  });

  return tasks.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

### Overdue Tasks

```javascript
async function getOverdueTasks(employeeId) {
  const now = new Date();

  const { tasks } = await retrieveTasks({
    assignee_id: employeeId,
    status: 'pending'
  });

  return tasks.filter(task => new Date(task.due_date) < now);
}
```

### Task Completion Rate

```javascript
async function calculateCompletionRate(employeeId, startDate, endDate) {
  const { tasks, total_count, completed_count } = await retrieveTasks({
    assignee_id: employeeId,
    due_date_start: startDate,
    due_date_end: endDate
  });

  return {
    total: total_count,
    completed: completed_count,
    rate: (completed_count / total_count) * 100
  };
}
```

---

## Task Automation

### Auto-Create Follow-Up Tasks

```javascript
async function createFollowUpTask(appointment) {
  // Create follow-up task after appointment
  await createTask({
    title: `Follow up - ${appointment.customer_name}`,
    description: `Check satisfaction with ${appointment.service_name}`,
    due_date: calculateFollowUpDate(appointment.end_time),
    priority: 'medium',
    category: 'customer_follow_up',
    assignee_id: appointment.employee_id
  });
}

function calculateFollowUpDate(appointmentDate) {
  const followUp = new Date(appointmentDate);
  followUp.setDate(followUp.getDate() + 3); // 3 days after
  return followUp.toISOString();
}
```

### Recurring Task Generator

```javascript
async function createRecurringTask(template, frequency) {
  // Create weekly inventory check
  const frequencies = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30
  };

  const daysAhead = frequencies[frequency];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysAhead);

  await createTask({
    ...template,
    due_date: dueDate.toISOString(),
    recurring: true,
    frequency: frequency
  });
}
```

---

## Task Management Best Practices

### Task Creation

1. **Clear Titles**
   - Use action verbs
   - Include key context
   - Keep concise

2. **Detailed Descriptions**
   - What needs to be done
   - Why it's important
   - Any special instructions

3. **Appropriate Prioritization**
   - `urgent` - Immediate action required
   - `high` - Important, time-sensitive
   - `medium` - Standard tasks
   - `low` - Can be deferred

### Task Organization

1. **Categorization**
   - Use consistent categories
   - Enable filtering and reporting
   - Track task types

2. **Assignment**
   - Assign to appropriate person
   - Consider workload balance
   - Clear ownership

3. **Due Dates**
   - Set realistic deadlines
   - Build in buffer time
   - Account for dependencies

### Task Completion

1. **Status Updates**
   - Update as progress is made
   - Add notes for context
   - Mark complete promptly

2. **Review Process**
   - Daily review of pending tasks
   - Weekly review of completed tasks
   - Identify patterns and improvements

---

## Integration Examples

### Appointment-Based Task Creation

```javascript
async function handleAppointmentCompletion(appointment) {
  const tasks = [];

  // Follow-up call
  tasks.push(
    createTask({
      title: `Follow up - ${appointment.customer_name}`,
      description: 'Check customer satisfaction',
      due_date: addDays(appointment.end_time, 3),
      priority: 'medium',
      category: 'customer_follow_up',
      assignee_id: appointment.employee_id
    })
  );

  // Rebook reminder
  if (appointment.service_category === 'haircare') {
    tasks.push(
      createTask({
        title: `Rebook reminder - ${appointment.customer_name}`,
        description: 'Send rebooking reminder',
        due_date: addWeeks(appointment.end_time, 6),
        priority: 'low',
        category: 'customer_follow_up',
        assignee_id: appointment.employee_id
      })
    );
  }

  await Promise.all(tasks);
}
```

---

## Error Handling

### 404 Not Found

```json
{
  "error": "task_not_found",
  "message": "Task with ID task_98765 does not exist"
}
```

### 400 Bad Request

```json
{
  "error": "invalid_due_date",
  "message": "Due date must be in the future"
}
```

### 403 Forbidden

```json
{
  "error": "task_access_denied",
  "message": "You do not have permission to modify this task"
}
```

---

## Related Sections

- [Employees](./02-employees.md) - Task assignment to employees
- [Appointments](./04-appointments.md) - Appointment-related tasks
- [Customers](./03-customers.md) - Customer follow-up tasks
