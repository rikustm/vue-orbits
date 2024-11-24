<script setup>
import { ref, computed } from "vue";
import d3ForceMagnetic from "d3-force-magnetic";

const paused = ref(false);
const tick = ref(0);
const velocityFactor = ref(1);

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
  .force(
    "gravity",
    d3ForceMagnetic()
      .strength(G)
      .charge((d) => d.mass)
  )
  .on("tick", () => {
    tick.value++;
  })
  .nodes([{ fx: 0, fx: 0, mass: centralMass }, satellite.value]);

resetSatellite();

//forceSim.restart().on("tick", () => {});

function onPause() {
  paused.value = !paused.value;
  if (paused.value) {
    forceSim.stop();
  } else {
    forceSim.restart();
  }
}

function onForward() {
  forceSim.tick(1);
  tick.value++;
}

function onBack() {
  tick.value = tick.value - 1;
  resetSatellite();
  forceSim.restart().tick(tick.value).stop();
}

function onVelocityChange(e) {
  velocityFactor.value = e.target.value;
  satellite.value.vx *= velocityFactor.value;
  satellite.value.vy *= velocityFactor.value;
}

function onAcelerate(factor) {
  velocityFactor.value *= factor;
  satellite.value.vx *= factor;
  satellite.value.vy *= factor;
}

function onReset() {
  resetSatellite();
  tick.value = 0;
}

const currentVelocity = computed(() => {
  return Math.sqrt(
    Math.pow(satellite.value.vx, 2) + Math.pow(satellite.value.vy, 2)
  ).toFixed(2);
});
</script>

<template>
  <div class="p-2 space-x-2 flex items-center">
    <button class="btn btn-primary" @click="onPause">Play/Pause</button>
    <button class="btn btn-primary" @click="onBack"><</button>
    <button class="btn btn-primary" @click="onForward">></button>
    <button class="btn btn-primary" @click="onReset">Reset</button>
    <button class="btn btn-primary" @click="onAcelerate(0.99)"><<</button>
    <button class="btn btn-primary" @click="onAcelerate(1.01)">>></button>
    <!-- <div class="inline-block">
      <input
        @change="onVelocityChange"
        type="range"
        min="0"
        max="2"
        value="1"
        class="range range-primary"
        step="0.25"
      />
    </div> -->
  </div>
  <div>
    <svg width="600" height="600">
      <g transform="translate(300,300)">
        <circle r="20" fill="gold"></circle>
        <circle
          r="10"
          fill="green"
          :cx="satellite.x"
          :cy="satellite.y"
        ></circle>
      </g>
    </svg>
  </div>
  <div>
    <pre>{{ currentVelocity }}</pre>
    <pre>{{ tick }}</pre>
    <pre>{{ satellite }}</pre>
  </div>
</template>
