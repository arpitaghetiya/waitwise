const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

function getBaseCrowdPressure(timeStr) {
  if (!timeStr) return "LOW";
  const parts = timeStr.split(":");
  if (parts.length < 2) return "LOW";
  const hour = parseInt(parts[0], 10);
  const min = parseInt(parts[1], 10);
  const timeFloat = hour + (min / 60);

  if (timeFloat >= 7.5 && timeFloat <= 9.5) return "HIGH";
  if (timeFloat >= 17.5 && timeFloat <= 19.5) return "HIGH";
  return "LOW";
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { stop, route, time } = req.body;
    
    if (!time || !stop || !route) {
      return res.status(400).json({ error: "Missing required fields: stop, route, or time." });
    }

    // Add 300ms artificial delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const basePressure = getBaseCrowdPressure(time);
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomFloat = (min, max) => (Math.random() * (max - min) + min);

    let v1Arrives = Math.round(randomFloat(1.5, 2.5) * 10) / 10;
    // Peak hour: crowdScore = random(78, 97). Else random(30, 60).
    let v1Score = basePressure === "HIGH" ? randomInt(78, 97) : randomInt(30, 60);

    let v2Arrives = Math.round(randomFloat(3.2, 4.5) * 10) / 10;
    // Vehicle 2: CrowdScore = random(15, 38) always (the "ghost" empty vehicle).
    let v2Score = randomInt(15, 38);

    let v3Arrives = Math.round(randomFloat(6.5, 8.0) * 10) / 10;
    // Vehicle 3: arrives in (6.5 to 8.0) minutes. CrowdScore = random(45, 70).
    let v3Score = randomInt(45, 70);

    let verdict = "";
    let waitSeconds = 0;
    if (v1Score > 70) {
      verdict = "WAIT";
      waitSeconds = Math.round((v2Arrives - v1Arrives) * 60);
    } else {
      verdict = "BOARD NOW";
      waitSeconds = 0;
    }

    let patiencePayoff = Math.round(((v1Score - v2Score) / 100) * 90 + 10);
    let timeSavedSeconds = Math.round((v1Score - v2Score) * 2.5);

    // Dynamic Reasoning
    const reasoning = [
      `Vehicle 1 is scheduled to arrive in ${v1Arrives} minutes, currently carrying a ${v1Score}% crowd density from upstream ${route} stops.`,
      `Vehicle 2 is operating optimally behind it at ${v2Score}% occupancy, providing a significantly improved density posture.`,
      `Time band analysis for ${time} reveals a common commuter bottleneck. Off-peak spacing here creates a brief low-density window.`,
      verdict === "WAIT" 
        ? `While holding for ${waitSeconds} seconds feels counterintuitive, boarding Vehicle 2 bypassing the crush load saves approximately ${timeSavedSeconds} seconds in entry/exit friction and vastly improves comfort.`
        : `Immediate boarding is recommended as Vehicle 1's ${v1Score}% density is below critical compression thresholds, minimizing friction.`
    ];

    const getStressIndex = (score) => Math.round((score / 100) * 9 * 10) / 10;
    const getTag = (score) => {
      if (score <= 40) return "Comfortable";
      if (score <= 70) return "Moderate";
      return "Packed";
    };

    let vehicles = [
      { label: "Vehicle 1", arrivesInMin: v1Arrives, crowdScore: v1Score, stressIndex: getStressIndex(v1Score), tag: getTag(v1Score), recommended: false },
      { label: "Vehicle 2", arrivesInMin: v2Arrives, crowdScore: v2Score, stressIndex: getStressIndex(v2Score), tag: getTag(v2Score), recommended: false },
      { label: "Vehicle 3", arrivesInMin: v3Arrives, crowdScore: v3Score, stressIndex: getStressIndex(v3Score), tag: getTag(v3Score), recommended: false }
    ];

    let minScore = Math.min(...vehicles.map(v => v.crowdScore));
    let recommendedVehicle = vehicles.find(v => v.crowdScore === minScore);
    recommendedVehicle.recommended = true;

    res.json({
      verdict,
      waitSeconds,
      patiencePayoff,
      timeSavedSeconds,
      vehicles,
      reasoning
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error during analysis." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WaitWise API running on http://localhost:${PORT}`));
