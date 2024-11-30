<script setup>
import { ref, computed } from "vue";
import d3ForceMagnetic from "d3-force-magnetic";

const paused = ref(false);
const ticks = ref(0);
const scalingFactor = ref(800);

//Get sun/planet/satillite data
import solarSystem from "./../data/solarSystem.json";

//Set constants/scales
const width = 1000;
const height = 1000;
const maxDistance =
  d3.max(
    solarSystem.map((d) =>
      d3.max(d.satellites.map((s) => d.distance + s.distance))
    )
  ) * 1.2;
const au = d3
  .scaleLinear() // Astronomical unit
  .domain([0, maxDistance])
  .range([0, Math.min(width / 2, height / 2)]);

// const dateScale = d3
//   .scaleLinear()
//   .domain([0, 360])
//   .range([0, 1000 * 60 * 60 * 24 * 365]);

// const pxTom = d3
//   .scaleLinear()
//   .domain([0, au(maxDistance / 2)])
//   .range([0, (maxDistance / 2) * 1.496 * Math.pow(10, 11)]);

const G = 0.00005;
const pxG = G * Math.pow(au(1), 3);

const nodes = ref(parseBodies(solarSystem));

function parseBodies(
  bodies,
  parentMass = 0,
  posOffset = [0, 0],
  velocityOffset = [0, 0]
) {
  return [].concat(
    ...bodies.map((body) => {
      const ang =
        ((body.phase !== undefined ? body.phase : Math.random() * 360) *
          Math.PI) /
        180; // Random init angle if not specified (to prevent aligned init forces from distorting orbits)

      const x = posOffset[0] + au(body.distance) * Math.sin(ang);
      const y = posOffset[1] - au(body.distance) * Math.cos(ang);

      const relVelocity =
        (body.distance
          ? Math.sqrt((pxG * parentMass) / au(body.distance))
          : 0) * (body.factorV || 1); // orbital velocity: sqrt(GM/d)

      const vx = velocityOffset[0] + relVelocity * Math.cos(ang);
      const vy = velocityOffset[1] + relVelocity * Math.sin(ang);

      return [
        {
          name: body.name,
          color: body.color,
          r: au(body.r) * (body.scale || scalingFactor.value),
          mass: body.mass,
          x,
          y,
          vx,
          vy,
          trails: [],
        },
        ...parseBodies(body.satellites || [], body.mass, [x, y], [vx, vy]),
      ];
    })
  );
}

const forceSim = d3
  .forceSimulation()
  .alphaDecay(0)
  .velocityDecay(0)
  .force(
    "gravity",
    d3ForceMagnetic()
      .id((d) => d.id)
      .charge((node) => node.mass)
  );

forceSim.nodes(nodes.value).force("gravity").strength(pxG);

forceSim.on("tick", () => {
  ticks.value++;

  // const bodies = nodes.value;

  // bodies.forEach((body) => {
  //   body.trails.push([body.x, body.y]);
  // });
});

function onPause() {
  paused.value = !paused.value;
  if (paused.value) {
    forceSim.stop();
  } else {
    forceSim.restart();
  }
}

function onForward() {
  // forceSim.tick(1);
  // tick.value++;
}

function onBack() {
  // tick.value = tick.value - 1;
  // resetSatellite();
  // forceSim.restart().tick(tick.value).stop();
}

function onVelocityChange(e) {}

function onAcelerate(factor) {}

function onReset() {
  ticks.value = 0;
  nodes.value = parseBodies(solarSystem);
  forceSim.nodes(nodes.value);
}

const currentVelocity = computed(() => {
  // return Math.sqrt(
  //   Math.pow(satellite.value.vx, 2) + Math.pow(satellite.value.vy, 2)
  // ).toFixed(2);
});

const actualDistance = (x, y) => {
  return pxTom(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
};

const earthAngle = computed(() => {
  const earth = nodes.value.find((d) => d.name === "earth");
  const angleRad = Math.atan2(earth.x, -earth.y);
  const angle = (angleRad * 180) / Math.PI + (angleRad < 0 ? 360 : 0);
  return angle;
});
</script>

<template>
  <div class="p-2 space-x-2 flex items-center">
    <button class="btn btn-primary" @click="onPause">Play/Pause</button>
    <!-- <button class="btn btn-primary" @click="onBack"><</button>
    <button class="btn btn-primary" @click="onForward">></button> -->
    <button class="btn btn-primary" @click="onReset">Reset</button>
    <!-- <button class="btn btn-primary" @click="onAcelerate(0.99)"><<</button>
    <button class="btn btn-primary" @click="onAcelerate(1.01)">>></button> -->
  </div>
  <div class="flex">
    <div>
      <svg :width="width" :height="height">
        <g :transform="`translate(${width / 2},${height / 2})`">
          <circle
            v-for="node in nodes"
            :key="node.index"
            :r="node.r"
            :fill="node.color"
            :cx="node.x"
            :cy="node.y"
          ></circle>
          <!-- <circle r="20" fill="gold"></circle>
          <circle
            r="10"
            fill="green"
            :cx="nodes[1].x"
            :cy="nodes[1].y"
          ></circle>
          <circle r="10" fill="red" :cx="nodes[2].x" :cy="nodes[2].y"></circle> -->
        </g>
      </svg>
    </div>
    <div>
      <pre>{{ ticks }}</pre>
      <pre>{{ nodes }}</pre>
    </div>
  </div>
</template>
