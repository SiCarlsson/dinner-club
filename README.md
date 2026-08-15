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

1. **(Optional) set the real URL.** Read the assigned URL with `terraform output cloud_run_url`. If you're not using a custom domain, set `app_base_url` in `terraform.tfvars` to that URL and re-run `terraform apply`. This updates Supabase's `site_url` / redirect allow-list and the `NEXT_PUBLIC_BASE_URL` runtime env var on Cloud Run — it is *not* a Docker build arg, so no image rebuild is needed and it can be changed at any point.
2. **Trigger CI/CD** to build and deploy the real image. Terraform already populated the Actions variables it needs (`WIF_PROVIDER`, `DEPLOYER_SA`, `GCP_PROJECT_ID`, `GCP_REGION`, `SERVICE_NAME`, `NEXT_PUBLIC_SUPABASE_*`), so `cd.yml` hardcodes nothing — run `terraform apply` before the first deploy or the workflow builds a malformed image path:

   ```bash
   gh workflow run cd.yml     # or use the Actions tab → CD → Run workflow
   ```

The workflow builds the image, pushes it to Artifact Registry, and deploys it to Cloud Run. The app is now live on the real image.

### Custom domain (optional)

Cloud Run domain mappings are only offered in a subset of regions, and `europe-north2` (Stockholm) is **not** one of them. That's why `gcp_region` defaults to `europe-north1` (Finland). If you don't want a custom domain, delete `terraform/domains.tf` and any region works.

The mapping itself lives in `terraform/domains.tf`; change the `name` to your domain.

1. **Verify ownership.** This must be the *same* Google account Terraform authenticates as, or the apply fails with `Caller is not authorized to administer the domain`:

   ```bash
   gcloud domains verify example.com
   ```

2. **Point `app_base_url` at it** in `terraform.tfvars` — this drives Supabase's `site_url` and redirect allow-list, so auth emails link to the right host:

   ```hcl
   app_base_url = "https://example.com"
   ```

3. **`terraform apply`.** Expect it to sit and wait: the mapping isn't `Ready` until DNS resolves to Google *and* the certificate issues, so the first apply usually ends in `Resource readiness deadline exceeded`. That's normal, not a misconfiguration.

4. **Add the DNS records while it waits.** They're available as soon as the mapping object exists:

   ```bash
   terraform output domain_dns_records
   ```

   An apex domain gets **4 A + 4 AAAA** records (apex domains can't take a CNAME); a subdomain gets a single CNAME to `ghs.googlehosted.com`. Re-run `terraform apply` once they're in place and it converges.

Add every record **unproxied**. Behind Cloudflare that means the **grey cloud**. Once the mapping reports `CertificateProvisioned` you can switch to proxied with SSL/TLS mode **Full (strict)**.

### Ongoing deployments

Every push to `main` triggers `cd.yml`, which builds, pushes, and deploys automatically. No Terraform run is needed for application changes — only for infrastructure changes.
