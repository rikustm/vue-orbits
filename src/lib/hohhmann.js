//input (lowerorbit, higherorbit, G, sunMass)

export function calculateTrusts(lowerOrbit, higherOrbit, G, sunMass) {
  const gravitationParameterCentralBody = G * sunMass;

  const initialOrbitVelocity = Math.sqrt(
    gravitationParameterCentralBody / lowerOrbit
  );

  const finalOrbitVelocity = Math.sqrt(
    gravitationParameterCentralBody / higherOrbit
  );

  const semiMajorAxisTransferOrbit = (lowerOrbit + higherOrbit) / 2;

  const vTransferStart = Math.sqrt(
    gravitationParameterCentralBody *
      (2 / lowerOrbit - 1 / semiMajorAxisTransferOrbit)
  );

  const vTransferEnd = Math.sqrt(
    gravitationParameterCentralBody *
      (2 / higherOrbit - 1 / semiMajorAxisTransferOrbit)
  );

  const vDeltaStart = vTransferStart - initialOrbitVelocity;
  const vDeltaEnd = finalOrbitVelocity - vTransferEnd;

  return [vDeltaStart, vDeltaEnd];
}

//output (deltaV1, deltaV2)
