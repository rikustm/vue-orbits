const width = 800;
const height = 600;

const svg = d3.select("svg").attr("width", width).attr("height", height);

// Sample data
const nodes = [
  { id: 1, x: 100, y: 100 },
  { id: 2, x: 200, y: 200 },
  { id: 3, x: 300, y: 300 },
  { id: 4, x: 400, y: 400 },
];

// Create circles for each node
const circles = svg
  .selectAll("circle")
  .data(nodes)
  .enter()
  .append("circle")
  .attr("r", 10)
  .attr("fill", "steelblue");

// Initialize the simulation
const simulation = d3
  .forceSimulation(nodes)
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force(
    "magnetic",
    d3.forceMagnetic().strength(0.1) // Magnetic force strength
    //.radius(200) // Radius within which the force is active
  )
  .on("tick", ticked);

// Update circle positions on every tick
function ticked() {
  circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
}
