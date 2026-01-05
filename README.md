# CerviCare - AI Cervical Cancer Assistant Website

A comprehensive web platform for cervical cancer risk assessment, protection plans, and healthcare guidance.

## Features

- **Risk Assessment**: AI-powered cervical health evaluation
- **Protection Plans**: Personalized protection plans and recommendations
- **Find Doctors**: GPS-based doctor finder
- **Health Insights**: AI-driven health recommendations
- **Vaccination Schedule**: Track vaccination schedules
- **Two-Step Assessment**: Comprehensive health evaluation

## Installation

1. Install Node.js (if not already installed)
   - Download from https://nodejs.org/

2. Install dependencies:
```bash
npm install
```

3. The `users.json` file will be automatically created when the server starts (it stores user account data).

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## File Structure

- `index.html` - Main homepage
- `auth.html` - Login and signup page
- `protection.html` - Protection plans page
- `style.css` - Main stylesheet (includes protection page styles)
- `auth.css` - Authentication page styles
- `protection.css` - Additional protection page styles
- `script.js` - Main JavaScript functionality
- `auth.js` - Authentication page JavaScript
- `protection.js` - Protection page specific JavaScript
- `server.js` - Express.js backend server
- `package.json` - Node.js dependencies
- `users.json` - User data storage (automatically created, contains hashed passwords)

## Navigation

- **Sign In / Sign Up**: Click on "Sign In" or "Sign Up" buttons in the navigation bar to access the authentication page
- **Protection Plans**: Click on "Protection Plans" in the navigation bar to visit the protection plans page
- **AskCervi**: Click on "AskCervi" to open the AI chatbot
- **Find Doctors**: Click on "Find Doctors" to access GPS-based hospital finder
- All links and buttons are functional

## API Endpoints

### Pages
- `GET /` - Serves the main homepage
- `GET /protection.html` - Serves the protection plans page
- `GET /auth.html` - Serves the login/signup page

### Authentication
- `POST /api/auth/signup` - Create a new user account
  - Body: `{ firstName, lastName, email, password }`
- `POST /api/auth/login` - Login with email and password
  - Body: `{ email, password }`
- `GET /api/auth/me` - Get current user information (requires authentication)

### Other
- `GET /api/protection-plans` - API endpoint for protection plans (future use)
- `POST /api/protection-plans/save` - API endpoint to save protection plan data (future use)

## Features

- **User Authentication**: Complete login and signup system with secure password hashing
- **Risk Assessment**: AI-powered cervical health evaluation
- **Protection Plans**: Personalized protection plans and recommendations
- **Find Doctors**: GPS-based doctor finder with OpenStreetMap integration
- **Health Insights**: AI-driven health recommendations
- **AskCervi Chatbot**: Integrated AI chatbot from cervibot.onrender.com
- **GPS Doctor Finder**: Real-time location-based hospital and doctor search
- **Vaccination Schedule**: Track vaccination schedules
- **Two-Step Assessment**: Comprehensive health evaluation

## Authentication

The website includes a full authentication system:

- **Sign Up / Create Account**: Users can create accounts with:
  - First Name & Last Name
  - Email Address
  - Strong Password (with validation rules)
  - Password Confirmation
  
- **Login**: Existing users can login with their email and password

- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)

- **Data Storage**: User credentials are securely stored in `users.json` file with bcrypt password hashing

## Setup Instructions

### Google Maps API Setup (Required for GPS features)

1. Get a Google Maps API Key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create credentials (API Key)
   - Restrict the API key to your domain (recommended)

2. Add your API key to `script.js`:
   - Open `script.js`
   - Find the line: `script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initGoogleMaps';`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

### Chatbot Integration

The chatbot is integrated from [cervibot.onrender.com](https://cervibot.onrender.com/). It will open in a modal when:
- Clicking "AskCervi" in the navigation bar
- Clicking "START" in the CerviBot section

## Navigation Features

- **AskCervi**: Opens the integrated chatbot modal
- **Find Doctors**: Opens GPS map to find nearby hospitals and doctors
- **Protection Plans**: Links to the protection plans page
- **GPS Doctor Finder**: Opens GPS map with hospital search functionality

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- Node.js
- Express.js
- bcrypt (password hashing)
- UUID (user ID generation)
- Leaflet.js (OpenStreetMap - no API key required)
- Font Awesome Icons
- Google Fonts (Montserrat)

## Browser Support

- Chrome (latest) - Full support including GPS
- Firefox (latest) - Full support including GPS
- Safari (latest) - Full support including GPS
- Edge (latest) - Full support including GPS

**Note**: GPS functionality requires browser location permissions to be granted by the user.

