# 🍽️ The Dinner Club

**The Dinner Club** – a lightweight, mobile-first web application built with Node.js and Supabase to coordinate events, track scores, and rank our dining group's culinary experiences in Stockholm.

---

## ✨ Features

* **Exclusive Access:** Strict, invitation-only registration paired with Supabase Auth.
* **Event Management:** Mobile-optimized calendar supporting RSVPs, plus-ones (+1).
* **Curated Ratings:** Separate 1–5 scoring for Food and Drinks.
* **Public Leaderboard:** A public ranking page displaying aggregated club analytics.

## 🛠️ Tech Stack

* **Runtime & Framework:** Node.js / Next.js (React)
* **Styling:** Tailwind CSS (Mobile-First, Dark/Light Mode support)
* **Localization:** i18n framework (English/Swedish support)
* **Backend & Database:** Supabase (PostgreSQL, Auth, Edge Functions)
* **Infrastructure & IaC:** Terraform & Google Cloud Platform (Cloud Run)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.