# WaitWise

WaitWise is an AI boarding intelligence layer for urban commuters. It analyzes real-time corridor telemetry, predicts vehicle density clustering, and provides actionable recommendations to optimize commuting time and comfort.

## Setup Instructions

### 1. Backend Server
```bash
cd waitwise/backend
npm install
node server.js
```

### 2. Frontend Application
```bash
cd waitwise/frontend
npx serve . -p 5500
```
Open `http://localhost:5500` in your browser.

## Pitch

Every day, millions of commuters board the first vehicle that shows up — crowded, slow, stressful. But buried in transit data is a pattern almost nobody knows: 60 to 90 seconds after a packed vehicle, an almost empty one follows. Always.

WaitWise is an AI boarding intelligence layer that reads this pattern in real time. You enter your stop and route. In under 2 seconds, WaitWise tells you: board now, or wait 94 seconds. It scores the next 3 vehicles for crowd density, calculates your patience payoff, and explains exactly why — in plain English.

We're not building another map. We're not optimizing routes. We're solving the 90 seconds before you step on a vehicle — the moment where one decision changes your entire commute.

The killer insight: the commuter who waits smart, arrives first.
