WaitWise 🚌

AI boarding intelligence for urban commuters.
Board now, or wait 94 seconds for an empty one? WaitWise tells you — in under 2 seconds.

The Problem
Every day, millions of urban commuters board the first vehicle that shows up — crowded, slow, stressful. But buried in transit data is a pattern almost nobody knows:

60 to 90 seconds after a packed vehicle, an almost empty one follows. Always.

WaitWise reads this pattern in real time. You enter your stop and route. In under 2 seconds, WaitWise tells you: board now, or wait. It scores the next 3 vehicles for crowd density, calculates your patience payoff, and explains exactly why — in plain English.
We're not building another map. We're not optimizing routes. We're solving the 90 seconds before you step on a vehicle — the moment where one decision changes your entire commute.

Features

Instant boarding recommendation — board now vs. wait, with a plain-English reason
Crowd density prediction — scores next 3 vehicles on a 1–10 scale
Patience payoff score — quantifies whether waiting is worth it (0–100)
Time saved estimate — how many minutes you gain by choosing wisely
Comfort level score — expected ride comfort out of 10
Google Maps integration — visualise your stop location instantly
Places Autocomplete — real stop suggestions as you type
Sub-2-second response — all results delivered faster than a bus pulls away


Demo
Live app: https://waitwise-5l98.vercel.app/
How it works

Enter your stop name or ID
Enter your route or line number
Hit Should I board?
Get an instant AI-powered recommendation


Architecture
waitwise/
├── frontend/               # Static HTML/CSS/JS frontend
│   ├── index.html          # Main UI
│   ├── style.css           # Styles
│   └── app.js              # Frontend logic, API calls
│
├── backend/                # Node.js Express API
│   ├── server.js           # Express server entry point
│   ├── routes/
│   │   └── predict.js      # /api/predict route handler
│   ├── controllers/
│   │   └── boardingController.js  # Request handling logic
│   ├── services/
│   │   └── simulate.js     # Vehicle density simulation engine
│   └── __tests__/          # Jest test suites
│       ├── simulate.test.js
│       └── predict.test.js
│
├── api/                    # Vercel serverless functions (production)
│   └── predict.js          # Serverless version of the predict endpoint
│
├── .env.example            # Environment variable template
├── vercel.json             # Vercel deployment config + security headers
└── README.md
Data flow
User Input (stop, route, time)
        │
        ▼
Frontend (Places Autocomplete + Maps JS)
        │
        ▼
POST /api/predict
        │
        ▼
Input Validation + Sanitisation
        │
        ▼
Simulation Engine
(corridor telemetry model → vehicle density clusters → crowd scores)
        │
        ▼
Boarding Recommendation + Patience Score
        │
        ▼
JSON Response → UI renders in <2s

Tech Stack
LayerTechnologyFrontendHTML5, CSS3, Vanilla JSBackendNode.js, Express.jsDeploymentVercel (frontend + serverless API)MapsGoogle Maps JavaScript APIPlacesGoogle Places Autocomplete APIGeocodingGoogle Maps Geocoding APITestingJest, SupertestSecurityHelmet.js, express-rate-limit

Getting Started
Prerequisites

Node.js 18+
npm 9+
A Google Maps API key (get one here)

1. Clone the repository
bashgit clone https://github.com/arpitaghetiya/waitwise.git
cd waitwise
2. Set up environment variables
bashcp .env.example .env
Edit .env and add your keys:
envGOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGIN=http://localhost:5500
3. Start the backend
bashcd backend
npm install
npm start
The API will be running at http://localhost:3000.
4. Start the frontend
bashcd frontend
npx serve . -p 5500
Open http://localhost:5500 in your browser.

API Reference
POST /api/predict
Returns a boarding recommendation for a given stop, route, and time.
Request body
json{
  "stop": "MG Road Bus Stop",
  "route": "9B",
  "time": "9"
}
FieldTypeRequiredDescriptionstopstringYesStop name or ID (max 100 chars)routestringYesRoute or line number (max 50 chars)timestringYesHour of day (0–23)
Response
json{
  "recommendation": "wait",
  "waitSeconds": 94,
  "reason": "A significantly less crowded vehicle arrives in 94 seconds. Waiting saves you 8 minutes of standing time.",
  "patienceScore": 82,
  "timeSaved": 8,
  "comfortScore": 8.4,
  "vehicles": [
    { "label": "Now", "crowdScore": 9, "eta": 0 },
    { "label": "In 94s", "crowdScore": 2, "eta": 94 },
    { "label": "In 4m", "crowdScore": 5, "eta": 240 }
  ]
}
Error responses
StatusMeaning400Invalid or missing input fields429Rate limit exceeded (30 req/min)500Internal server error

Running Tests
bashcd backend
npm test
To view coverage report:
bashnpm run test:coverage

Deployment
The app is fully deployable on Vercel with zero configuration beyond environment variables.
Deploy to Vercel
bashnpm install -g vercel
vercel --prod
Set the following environment variables in the Vercel dashboard:

GOOGLE_MAPS_API_KEY
ALLOWED_ORIGIN (your Vercel frontend URL)

The vercel.json in this repo configures:

Serverless API routing (/api/* → api/predict.js)
Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
Static frontend serving


Security

All user inputs are validated and sanitised before processing
CORS is restricted to the deployed frontend domain
Rate limiting: 30 requests per minute per IP
Security headers set via Helmet.js and vercel.json
No API keys are hardcoded — all secrets via environment variables
.env is gitignored; .env.example is provided as a template


Problem Statement Alignment

Challenge: Smart Mobility Intelligence System — design an AI-powered micro-solution that improves a single aspect of urban mobility.

RequirementWaitWiseSolves one specific problem✅ Boarding decision (board now vs. wait)Uses real-time or simulated data✅ Simulated corridor telemetry with time-of-day weightingActionable output in seconds✅ Recommendation + reason in under 2 secondsFunctional prototype with clear logic✅ Documented simulation engine with test coverageGoogle Services usage✅ Maps JS API, Places Autocomplete, Geocoding API

The Insight
The killer insight: the commuter who waits smart, arrives first.
Transit vehicles naturally cluster — a delayed bus causes bunching, and its follower runs ahead of schedule with almost no passengers. WaitWise models this pattern using time-of-day corridor telemetry to predict which vehicle in the next 3 arrivals will be least crowded, and whether the comfort gain is worth the wait time cost.

Contributing

Fork the repository
Create a feature branch: git checkout -b feature/your-feature
Commit your changes: git commit -m 'Add your feature'
Push to the branch: git push origin feature/your-feature
Open a Pull Request


License
MIT © Arpita Ghetiya

Built for the Smart Mobility Intelligence System hackathon challenge.
