#!/bin/bash

# Start Nginx as nginx user in the background
sudo -u nginx nginx &

# Run the ASP.NET application as appuser
sudo -u appuser /app/Socigy.Microservices.Auth