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

variable "github_repository" {
  description = "GitHub repo allowed to deploy via Workload Identity Federation"
  type        = string
  default     = "SiCarlsson/dinner-club"
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