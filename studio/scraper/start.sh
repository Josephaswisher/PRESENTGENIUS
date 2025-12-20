#!/bin/bash
# Start the Medical Scraper Service for VibePresenterPro

cd "$(dirname "$0")"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -q

# Install Playwright browsers if needed
if ! python -c "from playwright.sync_api import sync_playwright" 2>/dev/null; then
    echo "Installing Playwright browsers..."
    playwright install chromium
fi

# Start the service
echo "Starting Medical Scraper Service on port 8765..."
uvicorn scraper_service:app --host 0.0.0.0 --port 8765 --reload
