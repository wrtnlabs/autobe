# Time Tracking System

I want to create a time tracking system for organizations to monitor employee work hours, activities, and productivity.

## Organization & Multi-tenancy

- The system supports multiple organizations (tenants)
- Each organization has its own isolated data
- All entities belong to a specific organization

## Employee Management

- Employees are users who can track time
- Each employee belongs to one organization
- Employees can be assigned to multiple projects

## Timesheet Management

- Timesheets represent weekly work summaries for employees
- Each timesheet has:
  - Employee reference (required)
  - Start date (week start)
  - Stop date (week end)
  - Total duration in seconds
  - Keyboard activity count
  - Mouse activity count
  - Overall activity percentage (0-100)
  - Status: DRAFT, PENDING, APPROVED, DENIED
  - Billed status (boolean)
  - Approval timestamp
  - Approved by (user reference)

### Timesheet Workflow

- New timesheets start in DRAFT status
- Employees can submit timesheets for approval (DRAFT → PENDING)
- Managers can approve timesheets (PENDING → APPROVED)
- Managers can deny timesheets (PENDING → DENIED)
- Approved timesheets can be locked and marked as billed

## Time Log Management

- Time logs represent individual work sessions
- Each time log has:
  - Employee reference (required)
  - Timesheet reference (optional)
  - Start time (required)
  - Stop time (optional, null when running)
  - Duration in seconds (calculated)
  - Log type: TRACKED, MANUAL, IDLE, RESUMED
  - Source: WEB_TIMER, DESKTOP, MOBILE, BROWSER_EXTENSION, API
  - Description (optional)
  - Is billable (boolean)
  - Is running (boolean)
  - Project reference (optional)
  - Task reference (optional)

### Time Log Operations

- Start timer: creates time log with is_running=true
- Stop timer: sets stop time, calculates duration
- Manual entry: creates time log with start and stop times
- Edit entry: updates times/description

## Time Slot Management

- Time slots are 10-minute intervals for detailed tracking
- Each time slot has:
  - Employee reference (required)
  - Start time (required)
  - Duration in seconds (max 600)
  - Keyboard activity count
  - Mouse activity count
  - Overall activity percentage

### Time Slot Relationships

- Time slots have many-to-many relationship with time logs
- Time slots contain screenshots and activities

## Activity Tracking

- Activities record application and URL usage
- Each activity has:
  - Employee reference (required)
  - Title (required, app name or URL)
  - Duration in seconds
  - Type: APP, URL, BROWSER
  - Source: WEB_TIMER, DESKTOP, MOBILE
  - Project reference (optional)
  - Time slot reference (optional)

## Screenshot Management

- Screenshots are captured periodically during work
- Each screenshot has:
  - File path (required)
  - Thumbnail path (optional)
  - Recorded at timestamp
  - Storage provider: LOCAL, S3, WASABI
  - Time slot reference (required)
  - Is work related (boolean, AI result)

## API Endpoints

### Timesheet APIs
- GET /timesheets - List timesheets
- GET /timesheets/:id - Get timesheet
- POST /timesheets - Create timesheet
- PUT /timesheets/:id - Update timesheet
- DELETE /timesheets/:id - Delete timesheet
- POST /timesheets/:id/submit - Submit for approval
- POST /timesheets/:id/approve - Approve
- POST /timesheets/:id/deny - Deny

### Time Log APIs
- GET /time-logs - List time logs
- GET /time-logs/:id - Get time log
- POST /time-logs - Create time log
- PUT /time-logs/:id - Update time log
- DELETE /time-logs/:id - Delete time log
- POST /time-logs/start - Start timer
- POST /time-logs/stop - Stop timer

### Time Slot APIs
- GET /time-slots - List time slots
- GET /time-slots/:id - Get time slot with screenshots

### Activity APIs
- GET /activities - List activities
- POST /activities - Create activity
- POST /activities/bulk - Bulk create

### Screenshot APIs
- GET /screenshots - List screenshots
- POST /screenshots - Upload screenshot
- DELETE /screenshots/:id - Delete screenshot

## Technical Requirements

- All entities support soft delete
- All entities have createdAt, updatedAt timestamps
- Multi-tenant isolation by organization
- Pagination for all list endpoints

Please analyze these requirements and create a detailed specification.
