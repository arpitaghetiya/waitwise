/**
 * @file response.js
 * @description Builds the final API response payload from simulation results,
 * generating plain-English reasoning strings for commuters.
 */

/**
 * @typedef {import('./simulation').SimulationResult} SimulationResult
 */

/**
 * Generates dynamic plain-English reasoning bullets from simulation data.
 * @param {SimulationResult} sim
 * @param {{ stop: string, route: string, time: string }} params
 * @returns {string[]} Array of 4 reasoning strings.
 */
function buildReasoning(sim, { route, time }) {
  const { vehicles, verdict, waitSeconds, timeSavedSeconds, isPeak } = sim;
  const [v1, v2] = vehicles;

  const timeBand = isPeak ? 'peak-hour congestion' : 'off-peak conditions';
  const waitMin  = Math.floor(waitSeconds / 60);
  const waitSec  = waitSeconds % 60;
  const waitStr  = waitMin > 0 ? `${waitMin}m ${waitSec}s` : `${waitSec}s`;

  return [
    `Vehicle 1 arrives in ${v1.arrivesInMin} min on ${route} and is currently at ${v1.crowdScore}% crowd load — ${v1.tag.toLowerCase()}.`,
    `Vehicle 2 is running behind it at only ${v2.crowdScore}% occupancy, making it far more comfortable to board.`,
    `Your time slot (${time}) shows ${timeBand}. ${isPeak ? 'Passenger bunching from upstream stops inflates early vehicle load.' : 'Lower demand creates natural spacing between vehicles.'}`,
    verdict === 'WAIT'
      ? `Waiting ${waitStr} for Vehicle 2 saves an estimated ${timeSavedSeconds}s of travel friction and avoids peak compression.`
      : `Vehicle 1's ${v1.crowdScore}% crowd level is below the critical threshold — boarding now is the optimal choice.`,
  ];
}

/**
 * Assembles the complete API response object from a simulation result.
 * @param {SimulationResult} sim - Output from runSimulation().
 * @param {{ stop: string, route: string, time: string }} params - Original request params.
 * @returns {object} API response payload.
 */
function buildResponse(sim, params) {
  const { vehicles, verdict, waitSeconds, patiencePayoff, timeSavedSeconds } = sim;
  const reasoning = buildReasoning(sim, params);

  return {
    verdict,
    waitSeconds,
    patiencePayoff,
    timeSavedSeconds,
    vehicles,
    reasoning,
  };
}

module.exports = { buildResponse, buildReasoning };
