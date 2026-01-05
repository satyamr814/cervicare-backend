# Setup Guide for CerviCare Website

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. **IMPORTANT**: Add your Google Maps API key to `script.js`:
   - Find line with `YOUR_GOOGLE_MAPS_API_KEY`
   - Replace with your actual API key

3. Start the server:
```bash
npm start
```

## Getting a Google Maps API Key

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name (e.g., "CerviCare Website")
5. Click "Create"

### Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

### Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy your API key

### Step 4: Restrict API Key (Recommended)

1. Click on your newly created API key
2. Under "Application restrictions", select "HTTP referrers"
3. Add your website URLs:
   - `http://localhost:3000/*`
   - `https://yourdomain.com/*`
4. Under "API restrictions", select "Restrict key"
5. Select only:
   - Maps JavaScript API
   - Places API
   - Geocoding API
6. Click "Save"

### Step 5: Add API Key to Your Website

1. Open `script.js`
2. Find this line:
```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initGoogleMaps';
```
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual key

## Testing Features

### Test Chatbot Integration
- Click "AskCervi" in navigation bar
- Or click "START" in CerviBot section
- Chatbot should open in a modal

### Test GPS Features
- Click "Find Doctors" in navigation bar
- Or click "START" in GPS Doctor Finder section
- Allow location access when prompted
- Map should show nearby hospitals

## Troubleshooting

### Google Maps Not Loading
- Check that your API key is correct
- Verify that Maps JavaScript API and Places API are enabled
- Check browser console for error messages
- Make sure API key restrictions allow your domain

### GPS Not Working
- Check browser permissions (must allow location access)
- Verify that HTTPS is used (required for geolocation on some browsers)
- Check browser console for errors

### Chatbot Not Loading
- Verify internet connection
- Check that cervibot.onrender.com is accessible
- Check browser console for iframe loading errors

## Environment Variables (Optional)

For production, you can use environment variables:

1. Create a `.env` file:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

2. Update `server.js` to serve the API key to the frontend

3. Update `script.js` to use the environment variable

