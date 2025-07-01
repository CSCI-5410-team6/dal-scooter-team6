# Use an official Nginx image
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build output to Nginx's public directory
COPY build /usr/share/nginx/html

# Copy custom nginx config (optional, see below)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]