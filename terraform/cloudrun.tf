# ==============================================================================
# Cloud Run (v2) + Artifact Registry
# ==============================================================================

locals {
  container_image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.app.repository_id}/${var.service_name}:${var.image_tag}"

  supabase_project_url = "https://${supabase_project.prod.id}.supabase.co"
}

resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iamcredentials.googleapis.com",
  ])

  service = each.value

  disable_on_destroy = true
}

# --- Docker image registry ---------------------------------------------------
resource "google_artifact_registry_repository" "app" {
  location      = var.gcp_region
  repository_id = var.service_name
  format        = "DOCKER"
  description   = "Container images for the ${var.service_name} Cloud Run service"

  depends_on = [google_project_service.apis]
}

# --- Runtime identity for the service ----------------------------------------
resource "google_service_account" "cloud_run" {
  account_id   = "${var.service_name}-run"
  display_name = "Cloud Run runtime SA for ${var.service_name}"
}

# --- The Cloud Run service ---------------------------------------------------
resource "google_cloud_run_v2_service" "app" {
  name     = var.service_name
  location = var.gcp_region

  deletion_protection = false

  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }

    containers {
      image = local.container_image

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      # --- Non-secret runtime environment ---
      env {
        name  = "NEXT_PUBLIC_SUPABASE_PROJECT_URL"
        value = local.supabase_project_url
      }
      env {
        name  = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        value = data.supabase_apikeys.prod_keys.publishable_key
      }
      env {
        name  = "NEXT_PUBLIC_BASE_URL"
        value = var.app_base_url
      }
      env {
        name  = "NEXT_PUBLIC_VAPID_PUBLIC_KEY"
        value = var.vapid_public_key
      }
      env {
        name  = "VAPID_SUBJECT"
        value = var.vapid_subject
      }

      # --- Secrets, pulled from Secret Manager at startup ---
      env {
        name = "SUPABASE_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_secret_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "VAPID_PRIVATE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.vapid_private_key.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_iam_member.supabase_secret_key_access,
    google_secret_manager_secret_iam_member.vapid_private_key_access,
  ]

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

# --- Make the service publicly reachable -------------------------------------
resource "google_cloud_run_v2_service_iam_member" "public" {
  location = google_cloud_run_v2_service.app.location
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
