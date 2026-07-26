# ==============================================================================
# CI/CD: keyless GitHub Actions -> GCP via Workload Identity Federation
# ==============================================================================

locals {
  github_owner = split("/", var.github_repository)[0]
  github_repo  = split("/", var.github_repository)[1]
}

# --- Identity pool + GitHub OIDC provider ------------------------------------
resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions"
  description               = "Keyless CI/CD identity pool for GitHub Actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "GitHub"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }

  # Only tokens minted for our repo are accepted.
  attribute_condition = "assertion.repository == \"${var.github_repository}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# --- Deployer service account the workflow impersonates ----------------------
resource "google_service_account" "deployer" {
  account_id   = "${var.service_name}-deployer"
  display_name = "GitHub Actions deployer for ${var.service_name}"
}

# Let workflows from our repo (and only our repo) impersonate the deployer SA.
resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

# --- Least-privilege permissions for the deployer ----------------------------
# Push images to this repository only.
resource "google_artifact_registry_repository_iam_member" "deployer_push" {
  location   = google_artifact_registry_repository.app.location
  repository = google_artifact_registry_repository.app.repository_id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.deployer.email}"
}

# Deploy new revisions of Cloud Run services in the project.
resource "google_project_iam_member" "deployer_run" {
  project = var.gcp_project_id
  role    = "roles/run.developer"
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# A revision runs *as* the runtime SA, so the deployer must be allowed to act as it.
resource "google_service_account_iam_member" "deployer_act_as_runtime" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

# --- GitHub Actions variables consumed by cd.yml -----------------------------
# Terraform is the single source of truth for these; no manual `gh variable set`.
resource "github_actions_variable" "wif_provider" {
  repository    = local.github_repo
  variable_name = "WIF_PROVIDER"
  value         = google_iam_workload_identity_pool_provider.github.name
}

resource "github_actions_variable" "deployer_sa" {
  repository    = local.github_repo
  variable_name = "DEPLOYER_SA"
  value         = google_service_account.deployer.email
}

resource "github_actions_variable" "supabase_project_url" {
  repository    = local.github_repo
  variable_name = "NEXT_PUBLIC_SUPABASE_PROJECT_URL"
  value         = local.supabase_project_url
}

resource "github_actions_variable" "supabase_publishable_key" {
  repository    = local.github_repo
  variable_name = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  value         = nonsensitive(data.supabase_apikeys.prod_keys.publishable_key)
}
