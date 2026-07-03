# resource "google_cloud_run_v2_service" "dinner-club-app" {
#   name     = "dinner-club-app"
#   location = "europe-north2"

#   template {
#     scaling {
#       min_instance_count = 0
#       max_instance_count = 1
#     }

#     containers {
#       image = "gcr.io/${var.gcp_project_id}/dinner-club-app:latest"

#       resources {
#         limits = {
#           cpu    = "1"
#           memory = "512Mi"
#         }
#         cpu_idle = true
#       }

#       env {
#         name  = "NEXT_PUBLIC_SUPABASE_URL"
#         value = "https://${supabase_project.prod.id}.supabase.co"
#       }
#       env {
#         name  = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
#         value = data.supabase_apikeys.prod_keys.publishable_key
#       }
#       env {
#         name  = "SUPABASE_SERVICE_ROLE_KEY"
#         value = data.supabase_apikeys.prod_keys.service_role_key
#       }
#     }
#   }
# }

# resource "google_cloud_run_v2_service_iam_member" "public_access" {
#   name     = google_cloud_run_v2_service.dinner-club-app.name
#   location = google_cloud_run_v2_service.dinner-club-app.location
#   role     = "roles/run.viewer"
#   member   = "allUsers"
# }
