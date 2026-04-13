#!/bin/bash
set -e

cd "$(dirname "$0")/client"
echo "📦 Building client..."
bun run build
echo "🚀 Uploading to EC2..."
scp -i ~/.ssh/holonet-key.pem -r dist/* ubuntu@13.232.34.17:/home/ubuntu/holonet/client/dist/
echo "✅ Deployed!"
