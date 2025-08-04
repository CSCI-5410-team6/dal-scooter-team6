variable "credentials_file" {}
variable "project_id" {}
variable "region" { default = "northamerica-northeast1" } # Montréal, Canada
variable "dataset_id" { default = "demo_dataset" }
variable "dataset_friendly_name" { default = "Demo Dataset" }
variable "dataset_description" { default = "Dataset created by Terraform in Canada region" }
variable "environment" { default = "dev" }
variable "table_id" { default = "bookings" }
variable "table_schema" {
  type = any
  default = [
    {
      name = "bookingId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "accessCode"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "assignedFranchise"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "bikeId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "bookingDate"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "createdAt"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "email"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "referenceCode"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "slotTime"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "status"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "updatedAt"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "userId"
      type = "STRING"
      mode = "REQUIRED"
    }
  ]
}