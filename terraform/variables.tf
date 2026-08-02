# ==============================================================================
# Supabase
# ==============================================================================

variable "supabase_access_token" {
  description = "Personal Supabase access token for authentication"
  type        = string
  sensitive   = true
}

variable "supabase_organization_id" {
  description = "The ID of your Supabase organization"
  type        = string
}

variable "supabase_database_password" {
  description = "The production database password"
  type        = string
  sensitive   = true
}

# ==============================================================================
# Google Cloud / Cloud Run
# ==============================================================================

variable "gcp_project_id" {
  description = "ID of the existing GCP project to deploy into"
  type        = string
}

variable "gcp_region" {
  description = "GCP region for Cloud Run, Artifact Registry, and Secret Manager"
  type        = string
  default     = "europe-north2" # Stockholm
}

variable "service_name" {
  description = "Name of the Cloud Run service and Artifact Registry repository"
  type        = string
  default     = "dinner-club"
}

variable "image_tag" {
  description = "Tag of the container image Terraform deploys on the initial create (CI/CD manages it thereafter)"
  type        = string
  default     = "latest"
}

variable "bootstrap_image" {
  description = "Public placeholder image used only when the Cloud Run service is first created, before CI/CD has pushed a real image (solves the cold-start chicken-and-egg). Cloud Run ignores later image changes (see the lifecycle block in cloudrun.tf), so once CI/CD deploys the real image this value is inert. Set to null to create the service directly against the real image (var.image_tag) if you have already pushed one."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "artifact_keep_count" {
  description = "Number of most-recent images to always keep in Artifact Registry, regardless of age"
  type        = number
  default     = 2
}

variable "artifact_max_age_days" {
  description = "Delete Artifact Registry images older than this many days (beyond the kept most-recent images)"
  type        = number
  default     = 7
}

variable "github_repository" {
  description = "GitHub repo (owner/name) allowed to deploy via Workload Identity Federation and whose Actions variables Terraform manages"
  type        = string
  default     = "SiCarlsson/dinner-club"
}

variable "github_token" {
  description = "GitHub token for managing Actions variables. Leave null to use the GITHUB_TOKEN env var (e.g. `export GITHUB_TOKEN=$(gh auth token)`)"
  type        = string
  sensitive   = true
  default     = null
}

# ------------------------------------------------------------------------------
# Application runtime configuration
# ------------------------------------------------------------------------------

variable "app_base_url" {
  description = "Public base URL of the app (NEXT_PUBLIC_BASE_URL)"
  type        = string
}

variable "vapid_public_key" {
  description = "Web Push VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY)"
  type        = string
}

variable "vapid_private_key" {
  description = "Web Push VAPID private key (stored in Secret Manager)"
  type        = string
  sensitive   = true
}

variable "vapid_subject" {
  description = "Web Push VAPID subject (VAPID_SUBJECT)"
  type        = string
}