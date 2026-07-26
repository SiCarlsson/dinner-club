# ==============================================================================
# Secret Manager
# ==============================================================================

# --- Supabase secret (service-role) key -------------------------------------
resource "google_secret_manager_secret" "supabase_secret_key" {
  secret_id = "${var.service_name}-supabase-secret-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "supabase_secret_key" {
  secret      = google_secret_manager_secret.supabase_secret_key.id
  secret_data = data.supabase_apikeys.prod_keys.secret_keys[0].api_key
}

# --- Web Push VAPID private key ---------------------------------------------
resource "google_secret_manager_secret" "vapid_private_key" {
  secret_id = "${var.service_name}-vapid-private-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "vapid_private_key" {
  secret      = google_secret_manager_secret.vapid_private_key.id
  secret_data = var.vapid_private_key
}

# --- Allow the Cloud Run service account to read the secrets -----------------
resource "google_secret_manager_secret_iam_member" "supabase_secret_key_access" {
  secret_id = google_secret_manager_secret.supabase_secret_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "vapid_private_key_access" {
  secret_id = google_secret_manager_secret.vapid_private_key.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
