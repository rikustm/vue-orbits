<script setup>
import { DateTime } from "luxon";
import { ref, computed } from "vue";
import d3ForceMagnetic from "d3-force-magnetic";
import {
  Body,
  Illumination,
  HelioVector,
  SearchRelativeLongitude,
} from "astronomy-engine";

const paused = ref(false);
const ticks = ref(0);

const scalingFactor = ref(800);
let date = ref(DateTime.now());
let years = date.value.year - 1970;

//Set constants/scales
const width = 800;
const height = 800;
const maxDistance =
  d3.max(
    solarSystem.map((d) =>
      d3.max(d.satellites.map((s) => d.distance + s.distance))
    )
  ) * 1.2;
let speedFactor = 1000000;
let G = 6.6743e-11 * speedFactor;

const au = d3
  .scaleLinear() // Astronomical unit
  .domain([0, maxDistance])
  .range([0, Math.min(width / 2, height / 2)]);

const dateScale = d3
  .scaleLinear()
  .domain([0, 360])
  .range([0, 1000 * 60 * 60 * 24 * 365]);

const msToAngle = d3
  .scaleLinear()
  .domain([0, 1000 * 60 * 60 * 24 * 365])
  .range([0, 360]);

const today = new Date();
const nextAlignemntDate = SearchRelativeLongitude(Body.Mars, 0, today).date;
const msTillnextAlignment = nextAlignemntDate - today;
const EarthDegTillNextAlignemnt =
  (msTillnextAlignment / (1000 * 60 * 60 * 24 * 365)) * 360;
const MarsDegTillNextAlignment = (EarthDegTillNextAlignemnt * 365.256) / 686.98;

let earthPhase = msToAngle(date.value.toMillis() % (1000 * 60 * 60 * 24 * 365));
let marsPhase =
  earthPhase + (EarthDegTillNextAlignemnt - MarsDegTillNextAlignment);

const nextAlignment = computed(() => {
  return SearchRelativeLongitude(Body.Mars, 0, date.value.toJSDate()).date;
});

//Get sun/planet/satillite data
import solarSystem from "./../data/solarSystem.json";

const extractSunAndSatillite = (bodies) => {
  const sunOnly = { ...bodies[0] };
  const { distance, r, mass, phase } = sunOnly.satellites.find(
    (planet) => planet.name === "earth"
  );

  sunOnly.satellites = [
    {
      name: "satellite",
      distance,
      r: 0.00001,
      mass,
      phase: earthPhase,
    },
  ];

  return parseBodies([sunOnly]);
};

const satillite = ref(extractSunAndSatillite(solarSystem));

const nodes = ref(parseBodies(solarSystem));

function parseBodies(
  bodies,
  parentMass = 0,
  posOffset = [0, 0],
  velocityOffset = [0, 0]
) {
  return [].concat(
    ...bodies.map((body) => {
      if (body.name === "earth") body.phase = earthPhase;
      if (body.name === "mars") body.phase = marsPhase;
      const ang =
        ((body.phase !== undefined ? body.phase : Math.random() * 360) *
          Math.PI) /
        180; // Random init angle if not specified (to prevent aligned init forces from distorting orbits)

      const x = posOffset[0] + body.distance * Math.sin(ang);
      const y = posOffset[1] - body.distance * Math.cos(ang);

      const relVelocity =
        (body.distance ? Math.sqrt((G * parentMass) / body.distance) : 0) *
        (body.factorV || 1); // orbital velocity: sqrt(GM/d)

      const vx = velocityOffset[0] + relVelocity * Math.cos(ang);
      const vy = velocityOffset[1] + relVelocity * Math.sin(ang);

      return [
        {
          name: body.name,
          color: body.color,
          r: body.r,
          distance: body.distance,
          mass: body.mass,
          x,
          y,
          vx,
          vy,
          scale: body.scale,
          trails: [],
        },
        ...parseBodies(body.satellites || [], body.mass, [x, y], [vx, vy]),
      ];
    })
  );
}

const sun = nodes.value[0];
const earth = nodes.value[1];
const mars = nodes.value[2];

const initialOrbitVelocity = Math.sqrt((G * sun.mass) / earth.distance);
const finalOrbitVelocity = Math.sqrt((G * sun.mass) / mars.distance);
const semiMajorAxisTransferOrbit = (earth.distance + mars.distance) / 2;
const vTransferStart = Math.sqrt(
  G * sun.mass * (2 / earth.distance - 1 / semiMajorAxisTransferOrbit)
);
const vTransferEnd = Math.sqrt(
  G * sun.mass * (2 / mars.distance - 1 / semiMajorAxisTransferOrbit)
);
const vDeltaStart = vTransferStart - initialOrbitVelocity;
const vDeltaEnd = finalOrbitVelocity - vTransferEnd;

// function getEarthAngle() {
//   const earth = nodes.value.find((d) => d.name === "earth");
//   const angleRad = Math.atan2(earth.x, -earth.y);
//   const angle = (angleRad * 180) / Math.PI + (angleRad < 0 ? 360 : 0);
//   return angle;
// }
const earthAngle = computed(() => {
  const earth = nodes.value.find((d) => d.name === "earth");
  const angleRad = Math.atan2(earth.x, -earth.y);
  const angle = (angleRad * 180) / Math.PI + (angleRad < 0 ? 360 : 0);
  return angle;
});

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

forceSim.nodes(nodes.value).force("gravity").strength(G);

let previousAngle = 0;

forceSim.on("tick", () => {
  ticks.value++;

  const bodies = nodes.value;

  bodies.forEach((body) => {
    setItem(body.trails, [body.x, body.y], 1000);
  });

  date.value = DateTime.fromObject({ year: years + 1970 }).plus(
    dateScale(earthAngle.value)
  );

  if (previousAngle > earthAngle.value) years++;
  previousAngle = earthAngle.value;
});

const forceSim2 = d3
  .forceSimulation()
  .alphaDecay(0)
  .velocityDecay(0)
  .force(
    "gravity",
    d3ForceMagnetic()
      .id((d) => d.id)
      .charge((node) => node.mass)
  );

forceSim2.nodes(satillite.value).force("gravity").strength(G);

forceSim2.on("tick", () => {
  const bodies = forceSim2.nodes();
  bodies.forEach((body) => {
    setItem(body.trails, [body.x, body.y], 1000);
  });
});

function onPause() {
  paused.value = !paused.value;
  if (paused.value) {
    forceSim.stop();
    forceSim2.stop();
  } else {
    forceSim.restart();
    forceSim2.restart();
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

// function onSpeedChange(e) {
//   G = e.target.value / 100000;
//   onReset();
// }

function onVelocityChange(e) {}

function onAcelerate(factor) {}

function onReset() {
  ticks.value = 0;
  nodes.value = parseBodies(solarSystem);
  forceSim.nodes(nodes.value);
  satillite.value = parseBodies(extractSunAndSatillite(solarSystem));
  forceSim2.nodes(satillite.value);
}

function onThrust(deltaV) {
  const velocity = Math.sqrt(
    Math.pow(satillite.value[1].vx, 2) + Math.pow(satillite.value[1].vy, 2)
  );
  const accFactor = 1 + deltaV / (velocity + deltaV);

  satillite.value[1].vx *= accFactor;
  satillite.value[1].vy *= accFactor;
}

function setItem(array, item, length) {
  array.unshift(item) > length ? array.pop() : null;
}

const currentVelocity = computed(() => {
  return Math.sqrt(
    Math.pow(satillite.value[1].vx, 2) + Math.pow(satillite.value[1].vy, 2)
  );
});

const actualDistance = computed(() => {
  const mars = nodes.value.find((node) => node.name === "mars");
  const distance = Math.sqrt(Math.pow(mars.x, 2) + Math.pow(mars.y, 2));

  return distance;
});
</script>

<template>
  <div class="flex">
    <div>
      <div class="p-2 space-y-2 flex flex-col">
        <button class="btn btn-primary" @click="onPause">Play/Pause</button>
        <!-- <button class="btn btn-primary" @click="onBack"><</button>
    <button class="btn btn-primary" @click="onForward">></button> -->
        <button class="btn btn-primary" @click="onReset">Reset</button>
        <button
          class="btn btn-primary"
          @click="onThrust(0.0008080730543428352)"
        >
          Launch
        </button>
        <button class="btn btn-primary" @click="onThrust(0.000726863210490712)">
          Thrust
        </button>

        <!-- <div>
      <input
        type="range"
        min="0"
        max="100"
        value="15"
        class="range range-primary"
        @change="onSpeedChange"
      />
    </div> -->

        <!-- <button class="btn btn-primary" @click="onAcelerate(0.99)"><<</button>
    <button class="btn btn-primary" @click="onAcelerate(1.01)">>></button> -->
      </div>
    </div>
    <div>
      <svg :width="width" :height="height">
        <g :transform="`translate(${width / 2},${height / 2})`">
          <g v-for="node in nodes">
            <circle
              :key="node.index"
              :r="au(node.r) * (node.scale || scalingFactor)"
              :fill="node.color"
              :cx="au(node.x)"
              :cy="au(node.y)"
            ></circle>
            <circle
              v-for="crumb in node.trails"
              r="1"
              :cx="au(crumb[0])"
              :cy="au(crumb[1])"
              fill="lightgray"
            ></circle>
          </g>

          <circle
            :r="au(satillite[1].r) * (satillite[1].scale || scalingFactor)"
            :cx="au(satillite[1].x)"
            :cy="au(satillite[1].y)"
          ></circle>
          <circle
            v-for="crumb in satillite[1].trails"
            r="1"
            :cx="au(crumb[0])"
            :cy="au(crumb[1])"
            fill="lightgray"
          ></circle>
        </g>
      </svg>
    </div>
    <div>
      <pre>{{ date.toFormat("yyyy-MM-dd") }}</pre>
      <pre>{{ nextAlignment }}</pre>
      <pre>{{ currentVelocity }}</pre>
    </div>
  </div>
</template>
