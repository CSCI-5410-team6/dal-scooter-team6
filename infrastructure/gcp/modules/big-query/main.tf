resource "google_project_service" "bigquery" {
  project = var.project_id
  service = "bigquery.googleapis.com"
  disable_dependent_services  = true
}

resource "google_bigquery_dataset" "this" {
  dataset_id    = var.dataset_id
  project       = var.project_id
  friendly_name = var.dataset_friendly_name
  description   = var.dataset_description
  location      = var.region

  labels = {
    environment = var.environment
  }
}

resource "google_bigquery_table" "this" {
  dataset_id = google_bigquery_dataset.this.dataset_id
  table_id   = var.table_id
  project    = var.project_id

  schema = jsonencode(var.table_schema)
  deletion_protection = false
}

resource "google_project_service" "bigquery_dts" {
  project = var.project_id
  service = "bigquerydatatransfer.googleapis.com"
}