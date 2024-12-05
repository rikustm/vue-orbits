<template>
  <div class="flex">
    <div class="p-2 space-y-2 flex flex-col">
      <button class="btn btn-primary" @click="onPause">Play/Pause</button>
      <button class="btn btn-primary" @click="onReset">Reset</button>
      <button class="btn btn-primary" @click="onThrust(thrust[0])">
        Thrust1
      </button>
      <button
        :disabled="autopilot"
        class="btn btn-primary"
        @click="onThrust(thrust[1])"
      >
        Thrust2
      </button>
      <label> <input type="checkbox" v-model="autopilot" /> Autopilot </label>
    </div>
    <div>
      <svg :width="width" :height="height">
        <g :transform="`translate(${width / 2},${height / 2})`">
          <g v-for="body in nodes" :key="body.id">
            <circle
              :cx="mToPx(body.x)"
              :cy="mToPx(body.y)"
              :r="mToPx(body.radius) * (body.scale || scale)"
              :fill="body.color"
            ></circle>
            <circle
              v-for="crumb in trials[body.name]"
              :cx="mToPx(crumb[0])"
              :cy="mToPx(crumb[1])"
              r="1"
              fill="gray"
            ></circle>
          </g>
          <g>
            <circle
              :cx="mToPx(satelliteNodes[1].x)"
              :cy="mToPx(satelliteNodes[1].y)"
              :r="
                mToPx(satelliteNodes[1].radius) *
                (satelliteNodes[1].scale || scale)
              "
              :fill="satelliteNodes[1].color"
            ></circle>
            <circle
              v-for="crumb in satelliteNodes[1].trials"
              :cx="mToPx(crumb[0])"
              :cy="mToPx(crumb[1])"
              r="1"
              fill="red"
            ></circle>
          </g>
        </g>
      </svg>
    </div>
    <div>
      <pre>{{
        `deltaV1: ${(thrust[0] / Math.sqrt(speedfactor)).toFixed(4)}m/s`
      }}</pre>
      <pre>{{
        `deltaV2: ${(thrust[1] / Math.sqrt(speedfactor)).toFixed(4)}m/s`
      }}</pre>
      <pre>{{ `Angel of Earth: ${angleOfPlanets.earth}` }}</pre>
      <pre>{{ `Angel of Mars: ${angleOfPlanets.mars}` }}</pre>
      <pre>{{
        `Difference: ${angleOfPlanets.mars - angleOfPlanets.earth}`
      }}</pre>
      <pre v-if="launched">{{ `Angle of Launch: ${angleOfLaunch ?? ""}` }}</pre>
      <!-- <Maths /> -->
    </div>
  </div>
</template>

<script setup>
//imports libraries
import { ref, computed } from "vue";
import * as d3 from "d3";

import Maths from "./Maths.vue";

import { sun, planets } from "./../data/data.json";
import { linear } from "./../lib/scale";
import parseBodies from "@/lib/parseBodies";
import { getGravityForceSimulator } from "./../lib/forceSimulator";
import { setItem } from "./../lib/utils";
import { calculateTrusts } from "./../lib/hohhmann";

//Constants
let height = 800;
let width = 800;
let scale = 600;
let speedfactor = 1000000000;
let G = 6.6743e-11;

//scales
const maxDistance = d3.max(planets.map((planet) => planet.distance));
const mToPx = linear(maxDistance * 1.2, Math.min(width, height) / 2);

//State variables
let paused = false;
const autopilot = ref(true);
let launched = ref(false);
let nodes = ref(parseBodies([sun, ...planets], G * speedfactor));
let { distance, mass, phase, radius } = planets.find(
  (planet) => planet.name === "earth"
);
let satellite = {
  name: "satellite",
  color: "black",
  distance,
  mass,
  phase,
  radius: radius * 0.3,
};
const thrust = ref(
  calculateTrusts(
    nodes.value[1].distance,
    nodes.value[2].distance,
    G * speedfactor,
    nodes.value[0].mass
  )
);
let satelliteTrialActive = false;
let trials = ref({ earth: [], mars: [] });
const angleOfLaunch = ref(null);
const angleOfPlanets = ref({});

const satelliteNodes = ref(parseBodies([sun, satellite], G * speedfactor));

//Simulations
const forceSimPlanets = getGravityForceSimulator(G, speedfactor)
  .nodes(nodes.value)
  .stop();

const forceSimSatellite = getGravityForceSimulator(G, speedfactor)
  .nodes(satelliteNodes.value)
  .stop();

preDrawTrials(forceSimPlanets);

startSimulation();

function startSimulation() {
  forceSimPlanets.restart();
  forceSimSatellite.restart();
}

function stopSimulation() {
  forceSimPlanets.stop();
  forceSimSatellite.stop();
}

//EventHandlers
function onPause() {
  paused = !paused;
  if (paused) {
    forceSimPlanets.stop();
    forceSimSatellite.stop();
  } else {
    forceSimPlanets.restart();
    forceSimSatellite.restart();
  }
}

function onThrust(deltaV) {
  launched.value = true;
  satelliteTrialActive = true;
  const satellite = satelliteNodes.value[1];

  angleOfLaunch.value = getAngle(satellite.x, satellite.y);

  const vectorAngle = Math.atan(satellite.vy / satellite.vx);

  const deltaX = deltaV * Math.cos(vectorAngle);
  const deltaY = deltaV * Math.sin(vectorAngle);

  if (satellite.vx > 0) {
    satellite.vx += Math.abs(deltaX);
  } else {
    satellite.vx -= Math.abs(deltaX);
  }
  if (satellite.vy > 0) {
    satellite.vy += Math.abs(deltaY);
  } else {
    satellite.vy -= Math.abs(deltaY);
  }
}

function onReset() {
  resetPlanets();
  resetSatellite();
}

function resetPlanets() {
  nodes.value = parseBodies([sun, ...planets], G * speedfactor);
  forceSimPlanets.nodes(nodes.value);
}

function resetSatellite() {
  satelliteTrialActive = false;
  satelliteNodes.value = parseBodies([sun, satellite], G * speedfactor);
  forceSimSatellite.nodes(satelliteNodes.value);
}

function preDrawTrials(simulation) {
  for (let i = 0; i < 200; i++) {
    simulation.tick(10);
    simulation.nodes().map((planet) => {
      if (planet.name !== "sun") {
        trials.value[planet.name].push([planet.x, planet.y]);
      }
    });
  }
  resetPlanets();
}

function getAngle(x, y) {
  const angleRad = Math.atan2(x, -y);
  const angle = (angleRad * 180) / Math.PI + (angleRad < 0 ? 360 : 0);
  return angle;
}

//Trials
setInterval(() => {
  nodes.value.map((node) => {
    if (node.name !== "sun") {
      const angle = getAngle(node.x, node.y);
      angleOfPlanets.value[node.name] = angle;
    }
    //if (node.name !== "sun") setItem(node.trials, [node.x, node.y], 50);
  });

  if (
    launched.value === false &&
    autopilot.value &&
    +(
      angleOfPlanets.value["mars"] - angleOfPlanets.value["earth"]
    ).toFixed() === 44
  ) {
    onThrust(thrust.value[0]);
  }

  satelliteNodes.value.map((node) => {
    if (node.name !== "sun" && satelliteTrialActive) {
      setItem(node.trials, [node.x, node.y], 500);
      const currentAngle = getAngle(node.x, node.y);

      if (
        (currentAngle < angleOfLaunch.value ? 360 : 0) +
          currentAngle -
          angleOfLaunch.value >
          180 &&
        autopilot.value
      ) {
        onThrust(thrust.value[1]);
        autopilot.value = false;
      }
    }
  });
}, 50);
</script>
