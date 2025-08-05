module "bigquery_users" {
  source                 = "../../modules/big-query"
  project_id             = var.project_id
  dataset_id             = "${var.dataset_id}_users"
  dataset_friendly_name  = var.dataset_friendly_name
  dataset_description    = var.dataset_description
  region                 = var.region
  environment            = var.environment
  table_id               = var.table_id_users
  table_schema           = var.table_schema_users
}

module "bigquery_feedback" {
  source                 = "../../modules/big-query"
  project_id             = var.project_id
  dataset_id             = "${var.dataset_id}_feedback"
  dataset_friendly_name  = var.dataset_friendly_name
  dataset_description    = var.dataset_description
  region                 = var.region
  environment            = var.environment
  table_id               = var.table_id_feedback
  table_schema           = var.table_schema_feedback
  
}

module "bigquery_bikes" {
  source                 = "../../modules/big-query"
  project_id             = var.project_id
  dataset_id             = "${var.dataset_id}_bikes"
  dataset_friendly_name  = var.dataset_friendly_name
  dataset_description    = var.dataset_description
  region                 = var.region
  environment            = var.environment
  table_id               = var.table_id_bikes
  table_schema           = var.table_schema_bikes
  
}