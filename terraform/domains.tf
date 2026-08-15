# Maps the custom domain onto the Cloud Run service, with a Google-managed TLS
# certificate. Only offered in a subset of regions — europe-north2 (Stockholm)
# is not one of them, which is why gcp_region is europe-north1 (Finland).
#
# The domain must be verified first, or the create fails with a 403:
#   gcloud domains verify calidinnerclub.se

resource "google_cloud_run_domain_mapping" "app" {
  location = var.gcp_region
  name     = "calidinnerclub.se"

  metadata {
    namespace = var.gcp_project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.app.name
  }

  lifecycle {
    # The API stamps its own bookkeeping annotations onto the mapping, which
    # would otherwise show as drift on every plan.
    ignore_changes = [metadata[0].annotations]
  }
}
