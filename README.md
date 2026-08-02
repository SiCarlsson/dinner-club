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

## 🚀 Deployment

Infrastructure lives in `terraform/` (GCP Cloud Run, Artifact Registry, Secret Manager, Workload Identity Federation, and the Supabase project). Application deploys are handled by GitHub Actions (`.github/workflows/cd.yml`) on every push to `main`.

### Prerequisites

* [Terraform](https://developer.hashicorp.com/terraform/downloads), [Google Cloud SDK](https://cloud.google.com/sdk/docs/install), [Docker](https://docs.docker.com/get-docker/), and the [GitHub CLI](https://cli.github.com/)
* An existing **GCP project** and a **Supabase organization**
* Authenticated locally: `gcloud auth application-default login` and `gh auth login`
* VAPID keys for Web Push: `npx web-push generate-vapid-keys`

### First deployment (cold start)

The Cloud Run service references a container image that doesn't exist until CI/CD builds it. To break that chicken-and-egg, Terraform creates the service against a public placeholder image (`var.bootstrap_image`, Google's `hello` container) on the **initial create only**. The `lifecycle { ignore_changes = [image] }` block in `terraform/cloudrun.tf` then hands ownership of the image to CI/CD, so Terraform never reverts real deploys.

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # then fill in your values
terraform init
terraform apply
```

After apply the service is live on the placeholder "hello" page. Now ship the real image:

1. **(Optional) set the real URL.** Read the assigned URL with `terraform output cloud_run_url`. If you're not using a custom domain, set `app_base_url` in `terraform.tfvars` to that URL and re-run `terraform apply` (this updates the Supabase auth allow-list and the runtime env). `NEXT_PUBLIC_BASE_URL` is baked into the client bundle at build time, so the value must be correct **before** the image is built in the next step.
2. **Trigger CI/CD** to build and deploy the real image. Terraform already populated the Actions variables it needs (`WIF_PROVIDER`, `DEPLOYER_SA`, `NEXT_PUBLIC_SUPABASE_*`):

   ```bash
   gh workflow run cd.yml     # or use the Actions tab → CD → Run workflow
   ```

The workflow builds the image, pushes it to Artifact Registry, and deploys it to Cloud Run. The app is now live on the real image.

### Ongoing deployments

Every push to `main` triggers `cd.yml`, which builds, pushes, and deploys automatically. No Terraform run is needed for application changes — only for infrastructure changes.
