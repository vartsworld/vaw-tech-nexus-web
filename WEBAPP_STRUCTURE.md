# VAW Tech Nexus Web Application - Schematic & Structure

## 1. Architecture Overview

**Type:** Single Page Application (SPA)
**Tech Stack:**
*   **Frontend:** React (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Shadcn UI
*   **State Management:** React Context (`UserContext`) + React Query
*   **Backend / Database:** Supabase (PostgreSQL + Auth)
*   **Hosting Target:** (Likely Vercel/Netlify based on typical Vite stacks)

## 2. Directory Structure Key

```
src/
├── App.tsx             # Main Route Definitions & Global Context Providers
├── main.tsx            # Entry Point
├── components/         # Reusable UI Components
│   └── client-portal/  # [NEW] Dedicated components for client webapp
├── context/
│   └── UserContext.tsx # User Preferences (e.g., Intro status)
├── integrations/
│   └── supabase/       # Supabase Client & Types
├── pages/              # Page Logic (See Feature Map below)
│   └── client/         # [NEW] Client Portal Pages
└── providers/          # Theme & Utility Providers
```

## 3. Feature Map & Route Structure

The application is segmented into distinct portals based on the user persona.

### A. Public / Visitor Portal
The main interface for prospective clients and talent.

*   **Landing:** `/` (Home)
*   **Services:**
    *   `/digital-marketing` - Marketing Services
    *   `/website-development` - Standard Web Dev
    *   `/webapp-development` - Custom Web Apps
    *   `/ai-solutions` - Artificial Intelligence Services
    *   `/vr-ar-development` - VR/AR Experiences
    *   `/digital-design` - UI/UX & Graphic Design
*   **Engagement:**
    *   `/pricing` - Service plans and tiers
    *   `/service-request` - Quote/Proposal form for clients
*   **Careers & Talent:**
    *   `/internship` - Internship programs
    *   `/intern-experience` - Testimonials/Info
    *   `/team-application` - Core team hiring

### B. Staff & Internal Portal
For employees and management(internal use).

*   **Authentication:**
    *   `/staff/login` - Custom flow using Email/Password or "Emoji Password".
*   **Dashboards:**
    *   `/staff/dashboard` - General staff view (Attendance, Tasks).
    *   `/team-head/dashboard` - Leadership view.
    *   `/hr/dashboard` - Human Resources management.
*   **Utilities:**
    *   `/project-monitor` - Internal project tracking.
    *   `/mycoins` - Gamified reward system for staff.
    *   `/account` - Personal settings.

### C. Administrative Portal
For high-level system control.

*   **Login:** `/admin` - Separate admin authentication.
*   **Dashboard:** `/admin/dashboard` - Global metrics, request management, and **Client Management**.

### D. Client Webapp (Dedicated Experience) [EXPANDED]
A specialized, app-like experience for paying clients to manage their relationship with VAW Tech.

*   **Access:** `/portal/:clientId` (Protected via token/auth)
*   **Core Tabs/Features:**
    1.  **Dashboard (Home):**
        *   Project Summary (Marketing/Web/App/Product).
        *   **Renewal Monitor:** Countdown to subscription/hosting renewal.
        *   **Notifications:** Alert center for updates.
    2.  **Progress Tracker:**
        *   Visual Timeline (Milestones: Design -> Dev -> QA -> Live).
        *   Live Status Updates.
    3.  **Support Center:**
        *   **Report Error:** Ticket submission form for bugs.
        *   Request Changes/Updates.
    4.  **Settings & Install:**
        *   **PWA Install:** "Download App" button tailored to the client.
        *   Profile Management.

### E. Events (VAW Cups)
A specific sub-module for events.

*   `/vaw-cups` - Event Landing
*   `/vaw-cups/sponsor` - Sponsor information
*   `/vaw-cups/vendor` - Vendor registration
*   `/vaw-cups/admin` - Event administration

## 4. Key Workflows

### Authentication Flow (Staff)
1.  **User Input:** Staff enters Username + Passcode (or Emoji Password).
2.  **Lookup:** System queries `staff_profiles` to map Username -> Email.
3.  **Auth:** System calls `supabase.auth.signInWithPassword`.
4.  **Routing:**
    *   Checks Role (HR/Manager -> Team Head Dashboard).
    *   Checks `staff_attendance` for today.
    *   If attendance missing -> Redirects with `requireAttendance` flag.

### Client Webapp Workflow [NEW]
1.  **Onboarding (Admin):**
    *   Admin creates a "Project" in Admin Dashboard for a specific client.
    *   System generates a unique **Client Portal Link** (or User Account).
2.  **Client Access:**
    *   Client opens link -> Authenticates (OTP or Password).
    *   **Dynamic generation:** The app loads data specifically for `clientId`.
3.  **Engagement:**
    *   **Notification:** Client receives push notification (via PWA) for "Project Update".
    *   **Tracking:** Client views progress bar moving from "Development" to "Testing".
    *   **Action:** Client clicks "Report Error" -> Fills form -> Admin gets notification.
    *   **Renewal:** 30 days before expiry, "Renew Now" banner appears.

## 5. Deployment & PWA
*   **PWA Support:** `vite-plugin-pwa` is configured.
*   **Client Specifics:** The Client Portal will utilize `manifest` manipulation or in-app prompts to encourage installation, allowing it to function as a standalone app on their device.

## 6. Database Requirements (Proposed for Client Webapp)
To support the new Client Webapp, the following Supabase tables are recommended:

*   `client_projects`: Links `client_id` to service types, renewal dates, and status.
*   `project_milestones`: Stores timeline events for the Progress Tracker.
*   `support_tickets`: Stores "Report Error" submissions.
*   `client_notifications`: Stores history of alerts sent to the client.
