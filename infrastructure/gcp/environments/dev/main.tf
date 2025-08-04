module "bigquery" {
  source                 = "../../modules/big-query"
  project_id             = var.project_id
  dataset_id             = var.dataset_id
  dataset_friendly_name  = var.dataset_friendly_name
  dataset_description    = var.dataset_description
  region                 = var.region
  environment            = var.environment
  table_id               = var.table_id
  table_schema           = var.table_schema
}
