# SOHMI Admin App — Step 7

Static browser application for Sounds Of Heaven Music Institute.

## Supabase
Project URL:
https://fedoaxwzhiyvitvojzqj.supabase.co

This app uses the Supabase **publishable** key. It does not contain a service-role key.

## First run
Open `index.html` from a static web host. For local testing, use any simple static server (for example VS Code Live Server). Opening directly as `file://` may be blocked by browser module/security rules.

## Current screens
- Login
- Admin Dashboard
- Staff Management
- Add/Edit/Deactivate Staff
- Assign roles
- Assign teacher teaching areas

## Important
The app assumes the Supabase tables already created in the SOHMI project:
`profiles`, `branches`, `staff_members`, `roles`, `staff_role_assignments`, `teachers`, `instruments`, `teacher_instruments`.

Normal staff deletion is intentionally implemented as **Deactivate** to preserve history.

## Authentication
The existing Supabase Auth user must have a password configured for email/password login.

## Next development stages
1. Verify login and Staff Management with the existing Super Admin.
2. Add Students.
3. Add Parents/Parent Students.
4. Add Courses/Syllabus.
5. Add Attendance.
6. Add Fees.
7. Add Homework/Progress.
8. Add notifications and other modules.
