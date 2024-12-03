import * as d3 from "d3";

export const linear = (actualValue, modelValue) =>
  d3
    .scaleLinear() // Astronomical unit
    .domain([0, actualValue])
    .range([0, modelValue]);
