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