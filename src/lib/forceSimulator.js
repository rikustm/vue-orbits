import * as d3 from "d3";
import d3ForceMagnetic from "d3-force-magnetic";

export function getGravityForceSimulator(G, speedfactor) {
  return d3
    .forceSimulation()
    .alphaDecay(0)
    .velocityDecay(0)
    .force(
      "gravity",
      d3ForceMagnetic()
        .id((d) => d.id)
        .charge((node) => node.mass)
        .strength(G * speedfactor)
    );
}
