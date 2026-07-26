# ==============================================================================
# Outputs
# ==============================================================================

output "cloud_run_url" {
  description = "Public URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_repository" {
  description = "Artifact Registry Docker repository path (without image/tag)"
  value       = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.app.repository_id}"
}

output "container_image" {
  description = "Full image reference Cloud Run deploys"
  value       = local.container_image
}

output "github_actions_wif_provider" {
  description = "Value for the WIF_PROVIDER GitHub Actions variable"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "github_actions_deployer_sa" {
  description = "Value for the DEPLOYER_SA GitHub Actions variable"
  value       = google_service_account.deployer.email
}

output "docker_build_and_push" {
  description = "Commands to build and push the image that this service deploys"
  value       = <<-EOT
    gcloud auth configure-docker ${var.gcp_region}-docker.pkg.dev

    docker build --platform linux/amd64 \
      --build-arg NEXT_PUBLIC_SUPABASE_PROJECT_URL="${local.supabase_project_url}" \
      --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${nonsensitive(data.supabase_apikeys.prod_keys.publishable_key)}" \
      -t ${local.container_image} \
      -f web/Dockerfile web

    docker push ${local.container_image}
  EOT
}
