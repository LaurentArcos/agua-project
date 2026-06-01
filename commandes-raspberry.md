docker build -t agua-project:latest .

docker run -d \
  --name agua \
  --restart unless-stopped \
  -p 127.0.0.1:3018:3000 \
  --env-file /var/www/agua-project/.env \
  agua-project:latest