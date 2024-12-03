<template>
  <div class="flex">
    <div class="p-2 space-y-2 flex flex-col">
      <button class="btn btn-primary" @click="onPause">Play/Pause</button>
      <button class="btn btn-primary" @click="onThrust">Thrust</button>
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
          </g>
        </g>
      </svg>
    </div>
    <div>
      <pre>{{ nodes }}</pre>
      <pre>{{ satelliteNodes }}</pre>
    </div>
  </div>
</template>

<script setup>
//imports libraries
import { ref, computed } from "vue";
import * as d3 from "d3";
import d3ForceMagnetic from "d3-force-magnetic";

import { sun, planets } from "./../data/data.json";
import { linear } from "./../lib/scale";
import parseBodies from "@/lib/parseBodies";
import { getGravityForceSimulator } from "./../lib/forceSimulator";

//Constants
let height = 800;
let width = 800;
let scale = 600;
let speedfactor = 10000000000;
let G = 6.6743e-11;

//scales
const maxDistance = d3.max(planets.map((planet) => planet.distance));
const mToPx = linear(maxDistance * 1.2, Math.min(width, height) / 2);

//State variables
let paused = false;
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

let satelliteNodes = ref(parseBodies([sun, satellite], G * speedfactor));

//Simulations
const forceSimPlanets = getGravityForceSimulator(G, speedfactor).nodes(
  nodes.value
);
const forceSimSatellite = getGravityForceSimulator(G, speedfactor).nodes(
  satelliteNodes.value
);

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

function onThrust() {
  const satellite = satelliteNodes.value[1];

  satellite.vx *= 1.09;
  satellite.vy *= 1.09;
}
</script>
