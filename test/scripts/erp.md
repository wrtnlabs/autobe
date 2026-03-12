# ERP — HRM & Time Tracking Platform

I want to create an ERP platform focused on human resource management and time tracking.

## Organization (Multi-Tenancy)

- The platform supports multiple organizations (multi-tenancy)
- Each organization operates independently with its own employees, projects, and data
- Users create an organization during initial sign-up
- Each organization has: name, description, logo image, currency (e.g., USD, EUR, KRW), timezone, and fiscal start month
- Organization owners can edit organization settings
- Organization owners can delete their organization only if:
  - All pending timesheets are resolved (approved or rejected)
  - There are no active employee contracts
- When an organization is deleted:
  - All employees, projects, tasks, timelogs, and timesheets are permanently deleted
  - The owner's account remains but is no longer associated with any organization

## User Account

- Users sign up with email and password
- Users log in with email and password
- Users can change their password
- A user can belong to multiple organizations
- When logging in, users select which organization to work in (organization context)
- All subsequent actions are scoped to the selected organization
- Users can switch organizations without logging out
- Users can delete their account:
  - If they are the sole owner of an organization, they must transfer ownership or delete the organization first
  - Their employee records in other organizations are marked as "deactivated"

## User Profile

- Each user has a global profile with: display name, avatar image, phone number
- Users can edit their profile
- Profile is shared across all organizations the user belongs to

## Roles and Permissions

- Each organization has its own set of roles
- Three built-in roles (cannot be deleted):
  - **Owner**: full access to all features, can manage roles and members
  - **Manager**: can manage employees, projects, approve timesheets, view reports
  - **Employee**: can track time, submit timesheets, view own data
- Organization owners can create custom roles
- Each custom role has: name and a set of permissions
- Available permissions:
  - `org:manage` — edit organization settings
  - `employee:manage` — add, edit, deactivate employees
  - `employee:view` — view employee list and details
  - `project:manage` — create, edit, delete projects and tasks
  - `project:view` — view projects and tasks
  - `time:manage` — edit or delete any employee's timelogs
  - `time:approve` — approve or reject timesheets
  - `time:view_all` — view all employees' timelogs and timesheets
  - `report:view` — view organization reports
- Organization owners can edit custom roles
- Organization owners can delete custom roles only if no employees are assigned to them
- Each employee in an organization is assigned exactly one role
- Role assignment can be changed by users with `employee:manage` permission

## Employee Management

- Users with `employee:manage` permission can invite new employees to the organization
- Invitation is done by email
- If the invited email already has an account, the user is added to the organization
- If the invited email has no account, a pending invitation is created
  - When the user signs up with that email, they are automatically added to the pending organizations
- Each employee record has:
  - Reference to the user account
  - Role in this organization
  - Department (optional)
  - Position/title (optional)
  - Employment type: full-time, part-time, contractor, intern
  - Status: active, deactivated
- Users with `employee:manage` permission can edit employee records (department, position, employment type)
- Users with `employee:manage` permission can deactivate employees
  - Deactivated employees cannot log time or submit timesheets
  - Deactivated employees' historical data (timelogs, timesheets) is preserved
  - Deactivated employees can be reactivated
- Users with `employee:view` permission can view the employee list
- The employee list is paginated
- Employees can filter the list by: department, employment type, status
- Employees can search by name

## Employee Contracts

- Each employee can have multiple contracts (historical record)
- Only one contract can be active at a time
- Each contract has:
  - Start date (required)
  - End date (optional, null means ongoing)
  - Pay rate (required, numeric value)
  - Pay period: hourly, daily, weekly, monthly
  - Working hours per week (required, e.g., 40)
  - Notes (optional)
- Users with `employee:manage` permission can create contracts for employees
- Creating a new contract automatically ends the previous active contract (sets end date to the day before the new contract starts)
- Users with `employee:manage` permission can edit the current active contract
- Past contracts cannot be edited (immutable historical record)
- Employees can view their own contracts
- Users with `employee:view` permission can view any employee's contracts

## Departments

- Each organization can have departments
- Each department has: name, description, and optional parent department (one level of nesting)
- Users with `org:manage` permission can create, edit, and delete departments
- Deleting a department sets employees' department to null (does not delete employees)
- Employees can view the list of departments

## Projects

- Users with `project:manage` permission can create projects
- Each project has:
  - Name (required)
  - Description (optional)
  - Color code (for UI display, required)
  - Status: active, archived, completed
  - Budget hours (optional, total estimated hours)
  - Start date (optional)
  - End date (optional)
- Users with `project:manage` permission can edit projects
- Users with `project:manage` permission can archive or complete projects
  - Archived/completed projects cannot receive new timelogs
  - Existing timelogs on archived/completed projects are preserved
- Users with `project:manage` permission can delete projects only if:
  - The project has no timelogs associated with it
- Users with `project:view` permission can view all projects
- The project list is paginated
- Projects can be filtered by status

## Project Members

- Users with `project:manage` permission can assign employees to projects
- An employee can be assigned to multiple projects
- Each project membership has: employee, project, and assigned role (member or project-lead)
- Project leads can manage tasks within their project
- Users with `project:manage` permission can remove employees from projects
- Employees can view which projects they are assigned to

## Tasks

- Project leads or users with `project:manage` permission can create tasks within a project
- Each task has:
  - Title (required)
  - Description (optional)
  - Status: open, in-progress, completed, closed
  - Priority: low, medium, high, urgent
  - Estimated hours (optional)
  - Due date (optional)
  - Assigned employee (optional, must be a project member)
  - Parent task (optional, for subtasks — one level of nesting only)
- Project leads can edit tasks in their project
- Users with `project:manage` permission can edit any task
- Task status changes are recorded in task history
- Each task history entry records: timestamp, old status, new status, who made the change
- Employees can view tasks in projects they are assigned to
- Tasks can be filtered by: status, priority, assigned employee
- Tasks can be sorted by: due date, priority, creation date

## Time Tracking — Timelogs

- Employees can log time entries (timelogs)
- Each timelog has:
  - Date (required)
  - Duration in minutes (required)
  - Project (required, must be a project the employee is assigned to)
  - Task (optional, must belong to the selected project)
  - Description (optional, what was done)
  - Billable flag (boolean, default true)
- Employees can only create timelogs for themselves
- Employees can edit their own timelogs only if:
  - The timelog is not part of an approved timesheet
- Employees can delete their own timelogs only if:
  - The timelog is not part of any submitted or approved timesheet
- Users with `time:manage` permission can edit or delete any employee's timelogs
- Users with `time:view_all` permission can view all employees' timelogs
- Employees can view their own timelogs
- Timelogs are paginated
- Timelogs can be filtered by: date range, project, task, billable status

## Time Tracking — Timesheets

- A timesheet is a collection of timelogs for a specific week (Monday to Sunday)
- Employees submit timesheets for approval
- Each timesheet has:
  - Employee (owner)
  - Week start date (Monday)
  - Week end date (Sunday)
  - Status: draft, submitted, approved, rejected
  - Total hours (calculated from included timelogs)
  - Submitted at (timestamp)
  - Reviewed at (timestamp, when approved/rejected)
  - Reviewed by (the user who approved/rejected)
  - Rejection reason (text, required when rejecting)
- Employees can create a draft timesheet for a specific week
- Creating a draft automatically includes all timelogs for that employee in that week
- Employees can add or remove timelogs from a draft timesheet
- Employees can submit a draft timesheet for approval
  - A timesheet cannot be submitted if it has no timelogs
  - A timesheet cannot be submitted if another timesheet for the same week is already submitted or approved
- Users with `time:approve` permission can view all submitted timesheets
- Users with `time:approve` permission can approve submitted timesheets
  - Approved timesheets lock all included timelogs (cannot be edited or deleted)
- Users with `time:approve` permission can reject submitted timesheets with a reason
  - Rejected timesheets return to draft status
  - The employee can modify and resubmit the rejected timesheet
- Employees can view their own timesheets
- Timesheets are paginated
- Timesheets can be filtered by: status, date range

## Timer (Live Time Tracking)

- Employees can start a timer to track time in real-time
- Each employee can have at most one active timer at a time
- Starting a timer requires selecting a project (task is optional)
- The timer records: start timestamp, project, task, description
- Employees can stop their timer
  - Stopping the timer creates a timelog with the calculated duration
  - Duration is rounded to the nearest minute
- Employees can discard their timer (no timelog is created)
- Employees can view their currently running timer
- If an employee forgets to stop their timer, it continues running indefinitely (no automatic stop)
- Employees can edit the description and project/task of a running timer

## Reports

- Users with `report:view` permission can access organization reports
- Available reports:

**Time Report**
- Shows total hours logged per employee for a given date range
- Can be grouped by: employee, project, task
- Can be filtered by: date range, employee, project, billable status
- Shows breakdown: total hours, billable hours, non-billable hours

**Project Budget Report**
- Shows each project's budget hours vs. actual hours logged
- Shows percentage of budget consumed
- Projects without budget hours are excluded

**Weekly Summary Report**
- Shows a week-by-week summary for a given date range
- Each week shows: total hours, number of timelogs, number of employees who logged time
- Can be filtered by project

## Activity Log

- The system records significant actions as activity log entries
- Each activity log entry has: timestamp, user who performed the action, action type, target entity, and details
- Logged actions include:
  - Employee invited, deactivated, reactivated
  - Contract created or edited
  - Project created, archived, completed, deleted
  - Task status changed
  - Timesheet submitted, approved, rejected
  - Role assigned or changed
- Users with `org:manage` permission can view the full activity log
- The activity log is paginated
- The activity log can be filtered by: action type, user, date range

## Dashboard

- Each employee has a personal dashboard showing:
  - Hours logged today
  - Hours logged this week
  - Active timer status (if running)
  - Recent timelogs (last 5)
  - Pending timesheet status for current week
  - Tasks assigned to them with status "in-progress" or "open"

- Users with `report:view` permission see an organization dashboard showing:
  - Total employees (active)
  - Total hours logged this week (all employees)
  - Number of pending timesheets awaiting approval
  - Projects with budget utilization over 80%
  - Top 5 employees by hours logged this week

## Data Isolation

- All data is strictly isolated per organization
- Employees in one organization cannot see data from another organization
- Users who belong to multiple organizations only see data for their currently selected organization
- API endpoints enforce organization context on every request

Please analyze these requirements and create a detailed requirements specification document.
