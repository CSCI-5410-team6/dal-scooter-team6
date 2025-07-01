provider "google" {
  project = "dalscooter-464600"
  region  = "northamerica-northeast1"
}

resource "google_cloud_run_service" "frontend" {
  name     = "dalscooter-frontend"
  location = "northamerica-northeast1"

  template {
    spec {
      containers {
        image = "gcr.io/dalscooter-464600/dalscooter-frontend:latest"
        ports {
          container_port = 80
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  metadata {
    annotations = {
      "run.googleapis.com/ingress" = "all"
    }
  }
}

resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}