# 🍽️ The Dinner Club

**The Dinner Club** – a lightweight, mobile-first web application built with Next.js and Supabase to coordinate dinners and rank our dining group's culinary experiences in Stockholm.

---

## ✨ Features

* **Exclusive Access:** Invitation-only membership enforced at the database with passwordless login via one-time email codes (Supabase Auth).
* **Installable PWA:** Mobile-first progressive web app you can add to your home screen with web push notifications.
* **Dinner Management:** Calendar of upcoming dinners with RSVPs, plus-ones (+1), and per-dinner dietary notes.
* **Curated Ratings:** Independent 1–5 scoring for Food, Drinks and Venue.
* **The Guide:** A public leaderboard ranking Stockholm venues by aggregate club scores, plotted on an interactive map.
* **Admin Dashboard:** Role-based tools to send invitations, manage dinners, and curate venues.

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (React 19) with TypeScript
* **Styling & UI:** Tailwind CSS, shadcn/ui, Base UI, and `next-themes` (Dark/Light Mode)
* **Localization:** `next-intl` (Swedish default / English)
* **Maps:** Leaflet via `react-leaflet`
* **PWA & Notifications:** Web app manifest, service worker, and `web-push`
* **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security)
* **Testing:** Vitest, Playwright, and Testing Library
* **Infrastructure & IaC:** Terraform & Google Cloud Platform (Cloud Run)
