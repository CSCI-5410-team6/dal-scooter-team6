output "service_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "service_name" {
  description = "The name of the deployed Cloud Run service"
  value       = google_cloud_run_service.frontend.name
}
