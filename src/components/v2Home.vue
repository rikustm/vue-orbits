<template>
  <div class="flex">
    <div class="p-2 space-y-2">
      <button class="btn btn-primary" @click="onPause">Play/Pause</button>
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
        </g>
      </svg>
    </div>
    <div>
      <pre>{{ nodes }}</pre>
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

//Simulations
const forceSimPlanets = getGravityForceSimulator(G, speedfactor);
// d3
//   .forceSimulation()
//   .alphaDecay(0)
//   .velocityDecay(0)
//   .force(
//     "gravity",
//     d3ForceMagnetic()
//       .id((d) => d.id)
//       .charge((node) => node.mass)
//       .strength(G * speedfactor)
//   );

forceSimPlanets.nodes(nodes.value);

//EventHandlers
function onPause() {
  paused = !paused;
  if (paused) {
    forceSimPlanets.stop();
  } else {
    forceSimPlanets.restart();
  }
}
</script>
