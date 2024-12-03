export default function parseBodies(bodies, G) {
  const parentMass = bodies.find((body) => body.name === "sun").mass;

  const nodes = bodies.map((body) => {
    const angRad = (body.phase ?? Math.random() * 360) * (Math.PI / 180);

    const x = (body.distance || 0) * Math.sin(angRad);
    const y = -(body.distance || 0) * Math.cos(angRad);

    const relVelocity = body.distance
      ? Math.sqrt((G * parentMass) / body.distance)
      : 0; // orbital velocity: sqrt(GM/d)

    const vx = relVelocity * Math.cos(angRad);
    const vy = relVelocity * Math.sin(angRad);

    const node = {
      name: body.name,
      color: body.color,
      radius: body.radius,
      distance: body.distance || 0,
      mass: body.mass,
      x,
      y,
      vx,
      vy,
      trials: [],
    };

    if (body.scale) node.scale = body.scale;

    return node;
  });

  return nodes;
}
