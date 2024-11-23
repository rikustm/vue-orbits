<script setup>
import { ref } from "vue";
import d3ForceMagnetic from "d3-force-magnetic";

const nodes = ref([
  { fx: 0, fy: 0 },
  { x: 100, y: 0 },
]);

const orbitDistance = 166.66666666;
const initialV = 5.270462766947299;
const G = 4629.629629629629;
const centralMass = 1;

const satellite = ref({ mass: 0 });
const resetSatellite = () => {
  satellite.value.x = -orbitDistance;
  satellite.value.y = 0;
  satellite.value.vx = 0;
  satellite.value.vy = initialV;
};
resetSatellite();

const forceSim = d3
  .forceSimulation()
  .alphaDecay(0)
  .velocityDecay(0)
  .stop()
  .force(
    "gravity",
    d3ForceMagnetic()
      .strength(G)
      .charge((d) => d.mass)
  )
  .nodes([{ fx: 0, fx: 0, mass: centralMass }, satellite.value]);

resetSatellite();

forceSim.restart().on("tick", () => {});

function onTicked() {
  simulation.tick(10);
}
</script>

<template>
  <div><button class="btn btn-primary" @click="onTicked">Step</button></div>
  <div>
    <svg width="600" height="600">
      <g transform="translate(300,300)">
        <circle r="20"></circle>
        <circle r="10" :cx="satellite.x" :cy="satellite.y"></circle>
      </g>
    </svg>
  </div>
  <div>
    <pre>{{ satellite }}</pre>
  </div>
</template>
