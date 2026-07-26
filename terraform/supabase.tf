resource "supabase_project" "prod" {
  name   = "dinner-club-prod"
  region = "eu-north-1"

  organization_id   = var.supabase_organization_id
  database_password = var.supabase_database_password
}

data "supabase_apikeys" "prod_keys" {
  project_ref = supabase_project.prod.id
}

# Auth configuration for the remote project
resource "supabase_settings" "prod_auth" {
  project_ref = supabase_project.prod.id

  auth = jsonencode({
    site_url = var.app_base_url

    uri_allow_list = join(",", [
      "http://localhost:3000/**",
      "${var.app_base_url}/**",
    ])

    # Not available in free tier of Supabase
    #mailer_subjects_magic_link          = "CaLí Dinner Club - Login link"
    #mailer_templates_magic_link_content = file("${path.module}/../supabase/templates/magic_link.html")
  })
}