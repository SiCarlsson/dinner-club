# 🍽️ Project Specification: The Dinner Club

Initial outline for the project.

---

## 🔐 1. Authentication & Security

### 1.1 Login Functionality
A secure entry system mapped for registered users, leveraging Supabase Auth to handle authentication flows smoothly via Magic Links or traditional passwords.

### 1.2 Exclusive Invitation Links
Public registration must be completely locked down (`Allow public sign up = false`). The system requires a mechanism to generate unique, time-bound invitation tokens. Upon account creation, the specific token is immediately invalidated to prevent re-use, blocking unauthorized sign-ups entirely.

### 1.3 Role Distribution (Admin vs Member)
Role-based access control (RBAC) enforced across the application layer:
* **Admin:** Exclusive access to a dedicated admin dashboard with capabilities to generate invitation links, create/edit/delete events, and curate restaurant profile data.
* **Member:** Restricted access allowing users to view the event calendar, submit RSVPs, manage their personal profile, and rate visited locations.

---

## 📅 2. Calendar & Event Management

### 2.1 Event Calendar
A centralized dashboard providing an overview of upcoming dinner events, detailing essential parameters such as dates, times, and restaurant profiles.

### 2.2 Secret Destination
A feature allowing admins to flag a destination as secret. The system masks or completely omits the restaurant's name and address from the member payload, automatically revealing the location details at a designated cutoff point (e.g., 24 hours prior to the dinner) to maintain an element of surprise.

### 2.3 RSVP Functionality
Interactive capabilities enabling members to explicitly declare their attendance status ("Attending" or "Cannot Attend") for scheduled events.

### 2.4 Guest Management (+1)
An extension of the RSVP flow allowing members to register a guest ("Plus-one") and input the guest's name, ensuring aggregate booking metrics update accurately for reservations.

### 2.5 Dietary Preferences & Allergens
Persistent profile fields allowing members to save long-term allergies or dietary restrictions. Additionally, the RSVP flow must include an optional free-text field for temporary, event-specific food comments. Admins have access to a consolidated view compiling all participant requirements ahead of table bookings.

---

## 🔔 3. Notifications & Communication

### 3.1 Automatic Reminders/Notifications
A notification layer triggered by key events (RSVP deadlines, secret location reveals, and post-event rating requests). While initial communication relies on email (via Supabase/SMTP), the underlying Node.js architecture must be modularized using webhooks or abstract API structures to seamlessly support future integrations with external chat clients like Discord, Telegram, or WhatsApp.

---

## 🏆 4. Rating System & Leaderboard

### 4.1 Eligibility
Stricter backend validation ensures that only members who held an active "Attending" status for a specific event are permitted to write records to the rating database.

### 4.2 Curated Rating System
A multi-dimensional scoring layout where eligible users provide independent ratings for both Food and Drinks, measured on a defined 1–5 scale.

### 4.3 Flexibility ("Not Applicable")
Both rating tracks must accept a "Not Applicable" (N/A) state to handle scenarios where a participant abstains from a category (e.g., did not consume alcohol). The mathematical aggregation engine must explicitly drop these null values to avoid skewing category averages.

### 4.4 Public Leaderboard
* **Public View:** A completely unauthenticated route displaying an official ranking of visited Stockholm venues based on aggregate club averages. Individual user records, names, personal comments, and private histories are completely stripped from this view.
* **The Club's Verdict:** Visual presentation of aggregated analytics on the public view, highlighting fun metrics like highest food scores vs best drinks, or venues where member opinions diverged the most.

---

## 📱 5. UI/UX & Accessibility

### 5.1 Mobile-First Design
Given that interaction primarily happens on the go—outside venues or directly at the table—the interface must follow a strict mobile-first engineering approach with fluid responsiveness.

### 5.2 Dark Mode / Light Mode
Full interface accommodation for both dark and light themes, reacting automatically to system preferences while offering a manual override switch within the application layout.

### 5.3 Internationalization (i18n)
A solid internationalization framework providing complete parity between Swedish and English, supporting manual switching alongside automatic fallback translation based on browser locale headers.