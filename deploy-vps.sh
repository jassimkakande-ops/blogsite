#!/bin/bash

# VPS Deployment Script for Kilax Blog Site
# This script helps deploy the Next.js app on your VPS server

echo "🚀 Starting VPS deployment for Kilax Blog Site..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Start the application
echo "🌟 Starting the application on port 4577..."
echo "📱 Your app will be available at: http://your-vps-ip:4577"
echo "🔧 To run in background, use: nohup npm start > app.log 2>&1 &"
echo "🛑 To stop background process, use: pkill -f 'next start'"

# Option to start immediately
read -p "Do you want to start the app now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting the application..."
    npm start
else
    echo "✅ Deployment complete. Run 'npm start' when ready."
fi