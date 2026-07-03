resource "supabase_project" "prod" {
  name   = "dinner-club-prod"
  region = "eu-north-1"

  organization_id   = var.supabase_organization_id
  database_password = var.supabase_database_password
}

data "supabase_apikeys" "prod_keys" {
  project_ref = supabase_project.prod.id
}