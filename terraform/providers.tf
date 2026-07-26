terraform {
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }

    google = {
      source  = "hashicorp/google"
      version = "~> 7.39"
    }

    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Manages the repo's Actions variables consumed by cd.yml
provider "github" {
  owner = local.github_owner
  token = var.github_token
}
