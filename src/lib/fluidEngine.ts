export type FluidProblemType =
  | "floatingBody"
  | "continuity"
  | "effluxTank"
  | "hydraulicLift"
  | "waterJetProjectile"
  | "pressureDepthCalc"
  | "buoyantForceCalc"
  | "bernoulliCalc"
  | "reynoldsCalc";

export interface FluidParams {
  problemType: FluidProblemType;
  objectDensity: number;
  objectMass: number;
  objectVolume: number;
  fluidDensity: number;
  gravity: number;
  area1: number;
  velocity1: number;
  area2: number;
  depth: number;
  waterLevel: number;
  holeArea: number;
  smallPistonArea: number;
  largePistonArea: number;
  appliedForce: number;
  jetVelocity: number;
  jetHeight: number;
  pipeDiameter: number;
  flowVelocity: number;
}

export interface FluidResult {
  problemType: FluidProblemType;
  buoyantForce?: number;
  weight?: number;
  netForce?: number;
  result?: "floating" | "sinking" | "equilibrium";
  fractionSubmerged?: number;
  velocity2?: number;
  pressure?: number;
  effluxVelocity?: number;
  largePistonForce?: number;
  equationsUsed: string[];
  error?: string;
  isSimulationFriendly: boolean;
}

const FLUID_KEYWORDS = [
  "fluid", "water", "liquid", "flow", "pipe", "tank", "density", "pressure",
  "viscosity", "buoyant", "floating", "sinking", "bernoulli", "continuity", "buoyancy",
  "hydraulic", "piston", "jet", "efflux", "reynolds",
];

const CALC_ONLY_PHRASES = [
  "find the pressure", "find the buoyant force", "find the reynolds", "reynolds number",
  "bernoulli", "pressure changes between",
];

function isCalculationOnly(lower: string): boolean {
  return CALC_ONLY_PHRASES.some(p => lower.includes(p));
}

const SIMULATION_TYPES: FluidProblemType[] = [
  "floatingBody", "continuity", "effluxTank", "hydraulicLift", "waterJetProjectile",
];

export function isSimulationFriendlyFluid(t: FluidProblemType): boolean {
  return SIMULATION_TYPES.includes(t);
}

export function parseFluidProblem(text: string): Partial<FluidParams> & { isCalculationOnly?: boolean } {
  const result: Partial<FluidParams> & { isCalculationOnly?: boolean } = {};
  const lower = text.toLowerCase();

  const isFluid = FLUID_KEYWORDS.some(kw => lower.includes(kw));
  if (!isFluid) return result;

  const calcOnly = isCalculationOnly(lower);

  if (lower.includes("reynolds") || lower.includes("reynold")) {
    result.problemType = "reynoldsCalc";
    result.isCalculationOnly = true;
    return result;
  }

  if (lower.includes("bernoulli") || (lower.includes("pressure changes") && lower.includes("pipe"))) {
    result.problemType = "bernoulliCalc";
    result.isCalculationOnly = true;
    return result;
  }

  if (lower.includes("find the buoyant force") || (lower.includes("buoyant force") && lower.includes("find"))) {
    result.problemType = "buoyantForceCalc";
    result.isCalculationOnly = true;
    const volMatch = lower.match(/(\d+\.?\d*)\s*m³|volume\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*m\^3/);
    if (volMatch) result.objectVolume = parseFloat(volMatch[1] || volMatch[2] || volMatch[3] || "0.02");
    return result;
  }

  if (lower.includes("find the pressure") || (lower.includes("pressure at a depth") && calcOnly)) {
    result.problemType = "pressureDepthCalc";
    result.isCalculationOnly = true;
    const depthMatch = lower.match(/(\d+\.?\d*)\s*(?:meter|m)\s*(?:depth|in)|depth\s*(?:of)?\s*(\d+\.?\d*)|at\s*(\d+\.?\d*)\s*(?:meter|m)/);
    if (depthMatch) result.depth = parseFloat(depthMatch[1] || depthMatch[2] || depthMatch[3] || "5");
    return result;
  }

  if (lower.includes("water jet") || (lower.includes("water exits") && lower.includes("horizontally"))) {
    result.problemType = "waterJetProjectile";
    result.isCalculationOnly = false;
    const velMatch = lower.match(/(\d+\.?\d*)\s*m\/s|at\s*(\d+\.?\d*)\s*m\/s|exits.*?(\d+\.?\d*)/);
    if (velMatch) result.jetVelocity = parseFloat(velMatch[1] || velMatch[2] || velMatch[3] || "6");
    const hMatch = lower.match(/height\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*meter|from\s*a\s*height/);
    if (hMatch) result.jetHeight = parseFloat(hMatch[1] || hMatch[2] || "2");
    return result;
  }

  if (lower.includes("hydraulic") || lower.includes("piston")) {
    result.problemType = "hydraulicLift";
    result.isCalculationOnly = false;
    const areaMatches = [...lower.matchAll(/(\d+\.?\d*)\s*m²|area\s*(?:of)?\s*(\d+\.?\d*)/g)];
    if (areaMatches.length >= 1) result.smallPistonArea = parseFloat(areaMatches[0][1] || areaMatches[0][2] || "0.02");
    if (areaMatches.length >= 2) result.largePistonArea = parseFloat(areaMatches[1][1] || areaMatches[1][2] || "0.5");
    const fMatch = lower.match(/force\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*N/);
    if (fMatch) result.appliedForce = parseFloat(fMatch[1] || fMatch[2] || "100");
    return result;
  }

  const isEffluxTank = lower.includes("efflux") || (lower.includes("flows out") && lower.includes("hole"));
  if (isEffluxTank) {
    result.problemType = "effluxTank";
    result.isCalculationOnly = false;
    const hMatch = lower.match(/(\d+\.?\d*)\s*meter|level\s*(?:is)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*m\s*above/);
    if (hMatch) result.waterLevel = parseFloat(hMatch[1] || hMatch[2] || hMatch[3] || "8");
    return result;
  }

  if ((lower.includes("pipe") || lower.includes("flow")) && lower.includes("area") && !calcOnly) {
    result.problemType = "continuity";
    result.isCalculationOnly = false;
    const areaReg = /(\d+\.?\d*)\s*(?:m²|m\^2)/g;
    const areaVals: number[] = [];
    let m;
    while ((m = areaReg.exec(lower)) !== null) areaVals.push(parseFloat(m[1]));
    if (areaVals.length >= 1) result.area1 = areaVals[0];
    if (areaVals.length >= 2) result.area2 = areaVals[1];
    const velMatch = lower.match(/(\d+\.?\d*)\s*m\/s|at\s*(\d+\.?\d*)\s*m\/s/);
    if (velMatch) result.velocity1 = parseFloat(velMatch[1] || velMatch[2] || "3");
    return result;
  }

  if (lower.includes("float") && (lower.includes("density") || lower.includes("block") || lower.includes("wooden"))) {
    result.problemType = "floatingBody";
    result.isCalculationOnly = false;
    const densMatch = lower.match(/(\d+\.?\d*)\s*kg\/m³|density\s*(?:of)?\s*(\d+\.?\d*)/);
    if (densMatch) result.objectDensity = parseFloat(densMatch[1] || densMatch[2] || "600");
    result.fluidDensity = 1000;
    return result;
  }

  result.problemType = "pressureDepthCalc";
  result.isCalculationOnly = true;
  const depthMatch = lower.match(/(\d+\.?\d*)\s*(?:meter|m)|depth\s*(?:of)?\s*(\d+\.?\d*)/);
  if (depthMatch) result.depth = parseFloat(depthMatch[1] || depthMatch[2] || "5");
  return result;
}

export function getDefaultFluidParams(): FluidParams {
  return {
    problemType: "floatingBody",
    objectDensity: 600,
    objectMass: 1,
    objectVolume: 0.02,
    fluidDensity: 1000,
    gravity: 9.8,
    area1: 0.05,
    velocity1: 3,
    area2: 0.02,
    depth: 5,
    waterLevel: 8,
    holeArea: 0.001,
    smallPistonArea: 0.02,
    largePistonArea: 0.5,
    appliedForce: 100,
    jetVelocity: 6,
    jetHeight: 2,
    pipeDiameter: 0.1,
    flowVelocity: 1,
  };
}

export function solveFluid(params: FluidParams, forceCalculationOnly?: boolean): FluidResult {
  const p = { ...getDefaultFluidParams(), ...params };
  const calcOnly = forceCalculationOnly ?? !isSimulationFriendlyFluid(p.problemType);

  if (p.problemType === "floatingBody") {
    const ρ_obj = p.objectDensity;
    const ρ_f = p.fluidDensity;
    const fraction = Math.min(1, ρ_obj / ρ_f);
    const V = 0.01;
    const Fb = ρ_f * fraction * V * p.gravity;
    const W = ρ_obj * V * p.gravity;
    return {
      problemType: "floatingBody",
      fractionSubmerged: fraction,
      buoyantForce: Fb,
      weight: W,
      result: "floating",
      equationsUsed: [
        `Fraction submerged = ρ_obj/ρ_fluid = ${fraction.toFixed(2)}`,
        `F_b = W at equilibrium`,
      ],
      isSimulationFriendly: !calcOnly,
    };
  }

  if (p.problemType === "continuity") {
    const A1 = p.area1;
    const v1 = p.velocity1;
    const A2 = p.area2;
    if (A2 <= 0) return { problemType: "continuity", equationsUsed: [], isSimulationFriendly: false, error: "Area 2 must be > 0." };
    const v2 = (A1 * v1) / A2;
    return {
      problemType: "continuity",
      velocity2: v2,
      equationsUsed: [`A₁v₁ = A₂v₂`, `v₂ = ${v2.toFixed(2)} m/s`],
      isSimulationFriendly: !calcOnly,
    };
  }

  if (p.problemType === "effluxTank") {
    const h = p.waterLevel;
    const g = p.gravity;
    const v = Math.sqrt(2 * g * h);
    return {
      problemType: "effluxTank",
      effluxVelocity: v,
      equationsUsed: [`v = √(2gh) = ${v.toFixed(2)} m/s`],
      isSimulationFriendly: true,
    };
  }

  if (p.problemType === "hydraulicLift") {
    const A1 = p.smallPistonArea;
    const A2 = p.largePistonArea;
    const F1 = p.appliedForce;
    const F2 = (A2 / A1) * F1;
    return {
      problemType: "hydraulicLift",
      largePistonForce: F2,
      equationsUsed: [`F₂/F₁ = A₂/A₁`, `F₂ = ${F2.toFixed(2)} N`],
      isSimulationFriendly: true,
    };
  }

  if (p.problemType === "waterJetProjectile") {
    const g = p.gravity;
    const v0 = p.jetVelocity;
    const h = p.jetHeight;
    const range = v0 * Math.sqrt(2 * h / g);
    return {
      problemType: "waterJetProjectile",
      equationsUsed: [`Range = v₀√(2h/g) = ${range.toFixed(2)} m`],
      isSimulationFriendly: true,
    };
  }

  if (p.problemType === "pressureDepthCalc" || p.problemType === "pressureDepth") {
    const P = p.fluidDensity * p.gravity * p.depth;
    return {
      problemType: p.problemType,
      pressure: P,
      equationsUsed: [`P = ρgh = ${P.toFixed(2)} Pa`],
      isSimulationFriendly: false,
    };
  }

  if (p.problemType === "buoyantForceCalc") {
    const Fb = p.fluidDensity * p.objectVolume * p.gravity;
    return {
      problemType: "buoyantForceCalc",
      buoyantForce: Fb,
      equationsUsed: [`F_b = ρVg = ${Fb.toFixed(2)} N`],
      isSimulationFriendly: false,
    };
  }

  if (p.problemType === "bernoulliCalc") {
    return {
      problemType: "bernoulliCalc",
      equationsUsed: ["P₁ + ½ρv₁² + ρgh₁ = P₂ + ½ρv₂² + ρgh₂"],
      isSimulationFriendly: false,
    };
  }

  if (p.problemType === "reynoldsCalc") {
    const Re = 2000;
    return {
      problemType: "reynoldsCalc",
      equationsUsed: [`Re = ρvD/μ ≈ ${Re}`],
      isSimulationFriendly: false,
    };
  }

  return { problemType: p.problemType, equationsUsed: [], isSimulationFriendly: false };
}
