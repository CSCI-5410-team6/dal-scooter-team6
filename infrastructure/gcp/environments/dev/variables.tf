variable "credentials_file" {

}
variable "project_id" {

}
variable "region" {
   default = "northamerica-northeast1" 
   } # Montréal, Canada
variable "dataset_id" { 
  default = "demo_dataset" 
  }
variable "dataset_friendly_name" { 
  default = "Demo Dataset"
   }
variable "dataset_description" {
   default = "Dataset created by Terraform in Canada region" 
   }
variable "environment" {
   default = "dev" 
   }
variable "table_id_users" {
   default = "users" 
   }
variable "table_schema_users" {
  type = any
  default = [
    {
      name = "createdAt"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "email"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "questions"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "userId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "userType"
      type = "STRING"
      mode = "REQUIRED"
    }
  ]
}

variable "table_id_feedback" {
   default = "feedback" 
   }
variable "table_schema_feedback" {
  type = any
  default = [
    {
      name = "bikeId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "bikeType"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "comment"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "feedbackId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "rating"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "sentiment"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "submittedAt"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "userId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "username"
      type = "STRING"
      mode = "REQUIRED"
    }
  ]
}

variable "table_id_bikes" {
   default = "bikes" 
   }
variable "table_schema_bikes" {
  type = any
  default = [
    {
      name = "bikeId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "createdAt"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "discountCode"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "features"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "franchiseId"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "hourlyRate"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "imageUrl"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "status"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "type"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "updatedAt"
      type = "STRING"
      mode = "REQUIRED"
    }
  ]
}


