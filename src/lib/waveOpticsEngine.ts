export type WaveOpticsProblemType =
  | "wavePropagation"
  | "doubleSlit"
  | "singleSlitDiffraction"
  | "refraction"
  | "reflection"
  | "fringeSpacingCalc"
  | "snellCalc"
  | "waveSpeedCalc"
  | "criticalAngle";

export interface WaveOpticsParams {
  problemType: WaveOpticsProblemType;
  wavelength: number;
  frequency: number;
  amplitude: number;
  slitSeparation: number;
  slitWidth: number;
  screenDistance: number;
  refractiveIndex1: number;
  refractiveIndex2: number;
  angleOfIncidence: number;
}

export interface WaveOpticsResult {
  problemType: WaveOpticsProblemType;
  waveSpeed?: number;
  period?: number;
  fringeSpacing?: number;
  angleOfRefraction?: number;
  criticalAngle?: number;
  firstMinimaAngle?: number;
  equationsUsed: string[];
  error?: string;
  /** When true, show simulation canvas. When false, show results only. */
  isSimulationFriendly: boolean;
}

const WAVE_OPTICS_KEYWORDS = [
  "wave", "light", "interference", "diffraction", "slit", "double slit", "single slit",
  "wavelength", "frequency", "reflection", "refraction", "lens", "mirror", "critical angle",
];

const CALC_ONLY_PHRASES = [
  "find the fringe spacing", "fringe spacing for", "find the wave speed", "wave speed",
  "find the angle of refraction", "find the refracted", "angle of refraction",
  "find the critical angle", "critical angle for", "critical angle",
];

function isCalculationOnly(lower: string): boolean {
  return CALC_ONLY_PHRASES.some(p => lower.includes(p));
}

export function parseWaveOpticsProblem(text: string): Partial<WaveOpticsParams> & { isCalculationOnly?: boolean } {
  const result: Partial<WaveOpticsParams> & { isCalculationOnly?: boolean } = {};
  const lower = text.toLowerCase();

  const isWaveOptics = WAVE_OPTICS_KEYWORDS.some(kw => lower.includes(kw));
  if (!isWaveOptics) return result;

  const calcOnly = isCalculationOnly(lower);

  if (lower.includes("critical angle") && (calcOnly || lower.includes("find"))) {
    result.problemType = "criticalAngle";
    result.isCalculationOnly = true;
    result.refractiveIndex1 = 1.5;
    result.refractiveIndex2 = 1;
    const nMatch = lower.match(/n\s*[=:]\s*(\d+\.?\d*)|(\d+\.?\d*)\s*\)/);
    if (nMatch) result.refractiveIndex1 = parseFloat(nMatch[1] || nMatch[2] || "1.5");
    return result;
  }

  if (lower.includes("single slit") || (lower.includes("single") && lower.includes("slit"))) {
    result.problemType = "singleSlitDiffraction";
    result.isCalculationOnly = false;
    const lambdaMatch = lower.match(/(\d+\.?\d*)\s*nm|wavelength\s*(?:of)?\s*(\d+\.?\d*)/);
    if (lambdaMatch) {
      const val = parseFloat(lambdaMatch[1] || lambdaMatch[2] || "500");
      result.wavelength = val <= 1000 ? val * 1e-9 : val;
    }
    const widthMatch = lower.match(/width\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*mm|slit\s*of\s*(\d+\.?\d*)/);
    if (widthMatch) {
      const v = parseFloat(widthMatch[1] || widthMatch[2] || widthMatch[3] || "0.2");
      result.slitWidth = v <= 10 ? v * 1e-3 : v;
    }
  } else if (lower.includes("mirror") && (lower.includes("strike") || lower.includes("reflect") || lower.includes("angle"))) {
    result.problemType = "reflection";
    result.isCalculationOnly = false;
    const angleMatch = lower.match(/(\d+\.?\d*)\s*degree|angle\s*(?:of)?\s*(\d+\.?\d*)|at\s*(\d+\.?\d*)\s*degree/);
    if (angleMatch) result.angleOfIncidence = parseFloat(angleMatch[1] || angleMatch[2] || angleMatch[3] || "40");
  } else if ((lower.includes("double slit") || (lower.includes("double") && lower.includes("slit"))) && calcOnly) {
    result.problemType = "fringeSpacingCalc";
    result.isCalculationOnly = true;
    const lambdaMatch = lower.match(/(\d+\.?\d*)\s*nm|wavelength\s*(?:of)?\s*(\d+\.?\d*)/);
    if (lambdaMatch) {
      const val = parseFloat(lambdaMatch[1] || lambdaMatch[2] || "500");
      result.wavelength = val <= 1000 ? val * 1e-9 : val;
    }
    const dMatch = lower.match(/separation\s*(\d+\.?\d*)|(\d+\.?\d*)\s*mm|d\s*=\s*(\d+\.?\d*)/);
    if (dMatch) result.slitSeparation = parseFloat(dMatch[1] || dMatch[2] || dMatch[3] || "0.5") * (dMatch[0]?.includes("mm") ? 1e-3 : 1);
  } else if ((lower.includes("double slit") || (lower.includes("double") && lower.includes("slit"))) && !calcOnly) {
    result.problemType = "doubleSlit";
    result.isCalculationOnly = false;
    const lambdaMatch = lower.match(/(\d+\.?\d*)\s*nm|wavelength\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*m/);
    if (lambdaMatch) {
      const val = parseFloat(lambdaMatch[1] || lambdaMatch[2] || lambdaMatch[3] || "600");
      result.wavelength = val <= 1000 ? val * 1e-9 : val;
    }
    const dMatch = lower.match(/separation\s*(?:of)?\s*(\d+\.?\d*)\s*mm|separation\s*(\d+\.?\d*)|(\d+\.?\d*)\s*mm/);
    if (dMatch) {
      const v = parseFloat(dMatch[1] || dMatch[2] || dMatch[3] || "0.5");
      result.slitSeparation = (dMatch[0]?.includes("mm") ? v * 1e-3 : v) || 0.0005;
    }
    const DMatch = lower.match(/screen\s*distance\s*(\d+\.?\d*)|distance\s*(?:of)?\s*(\d+\.?\d*)\s*m/);
    if (DMatch) result.screenDistance = parseFloat(DMatch[1] || DMatch[2] || "1");
  } else if ((lower.includes("glass") || lower.includes("air") || lower.includes("refraction")) && calcOnly) {
    result.problemType = "snellCalc";
    result.isCalculationOnly = true;
    if (lower.includes("air") && lower.includes("glass")) {
      result.refractiveIndex1 = 1;
      result.refractiveIndex2 = 1.5;
    }
    const angleMatch = lower.match(/(\d+\.?\d*)\s*degree|at\s*(\d+\.?\d*)\s*degree/);
    if (angleMatch) result.angleOfIncidence = parseFloat(angleMatch[1] || angleMatch[2] || "30");
  } else if (lower.includes("glass") || lower.includes("air")) {
    result.problemType = "refraction";
    result.isCalculationOnly = false;
    if (lower.includes("air") && lower.includes("glass")) {
      result.refractiveIndex1 = 1;
      result.refractiveIndex2 = 1.5;
    }
    const angleMatch = lower.match(/(\d+\.?\d*)\s*degree|angle\s*(?:of)?\s*incidence\s*(\d+\.?\d*)|at\s*(\d+\.?\d*)\s*degree/);
    if (angleMatch) result.angleOfIncidence = parseFloat(angleMatch[1] || angleMatch[2] || angleMatch[3] || "30");
  } else if ((lower.includes("wave") && (lower.includes("frequency") || lower.includes("wavelength"))) && calcOnly) {
    result.problemType = "waveSpeedCalc";
    result.isCalculationOnly = true;
    const lambdaMatch = lower.match(/(\d+\.?\d*)\s*(?:m|meter)|wavelength\s*(?:of)?\s*(\d+\.?\d*)/);
    if (lambdaMatch) result.wavelength = parseFloat(lambdaMatch[1] || lambdaMatch[2] || "3");
    const fMatch = lower.match(/(\d+\.?\d*)\s*Hz|frequency\s*(?:of)?\s*(\d+\.?\d*)/);
    if (fMatch) result.frequency = parseFloat(fMatch[1] || fMatch[2] || "10");
  } else {
    result.problemType = "wavePropagation";
    result.isCalculationOnly = false;
    const lambdaMatch = lower.match(/(\d+\.?\d*)\s*(?:m|meter)|wavelength\s*(?:of)?\s*(\d+\.?\d*)/);
    if (lambdaMatch) result.wavelength = parseFloat(lambdaMatch[1] || lambdaMatch[2] || "2");
    const fMatch = lower.match(/(\d+\.?\d*)\s*Hz|frequency\s*(?:of)?\s*(\d+\.?\d*)/);
    if (fMatch) result.frequency = parseFloat(fMatch[1] || fMatch[2] || "4");
  }

  return result;
}

export function getDefaultWaveOpticsParams(): WaveOpticsParams {
  return {
    problemType: "wavePropagation",
    wavelength: 2,
    frequency: 4,
    amplitude: 1,
    slitSeparation: 0.0005,
    slitWidth: 0.0002,
    screenDistance: 1,
    refractiveIndex1: 1,
    refractiveIndex2: 1.5,
    angleOfIncidence: 30,
  };
}

const SIMULATION_TYPES: WaveOpticsProblemType[] = [
  "wavePropagation", "doubleSlit", "singleSlitDiffraction", "refraction", "reflection",
];

export function isSimulationFriendlyType(t: WaveOpticsProblemType): boolean {
  return SIMULATION_TYPES.includes(t);
}

export function solveWaveOptics(
  params: WaveOpticsParams,
  forceCalculationOnly?: boolean
): WaveOpticsResult {
  const p = { ...getDefaultWaveOpticsParams(), ...params };
  const calcOnly = forceCalculationOnly ?? !isSimulationFriendlyType(p.problemType);

  if (p.problemType === "wavePropagation" || p.problemType === "waveSpeedCalc") {
    const λ = p.wavelength;
    const f = p.frequency;
    const v = λ * f;
    const T = 1 / f;
    return {
      problemType: p.problemType,
      waveSpeed: v,
      period: T,
      equationsUsed: [`v = λf = ${v.toFixed(2)} m/s`, `T = 1/f = ${T.toFixed(2)} s`],
      isSimulationFriendly: !calcOnly,
    };
  }

  if (p.problemType === "doubleSlit" || p.problemType === "fringeSpacingCalc") {
    const λ = p.wavelength;
    const d = p.slitSeparation || 0.0005;
    const D = p.screenDistance || 1;
    if (d <= 0) return { problemType: p.problemType, equationsUsed: [], isSimulationFriendly: false, error: "Slit separation must be > 0." };
    const β = (λ * D) / d;
    return {
      problemType: p.problemType,
      fringeSpacing: β,
      equationsUsed: [`β = λD/d = ${β.toExponential(2)} m`],
      isSimulationFriendly: !calcOnly,
    };
  }

  if (p.problemType === "singleSlitDiffraction") {
    const λ = p.wavelength;
    const a = p.slitWidth || 0.0002;
    const θ = Math.asin(λ / a);
    const θDeg = (θ * 180) / Math.PI;
    return {
      problemType: "singleSlitDiffraction",
      firstMinimaAngle: isFinite(θDeg) ? θDeg : 0,
      equationsUsed: [`θ = arcsin(λ/a) = ${(θDeg || 0).toFixed(2)}° for first minima`],
      isSimulationFriendly: true,
    };
  }

  if (p.problemType === "refraction" || p.problemType === "snellCalc") {
    const n1 = p.refractiveIndex1;
    const n2 = p.refractiveIndex2;
    const θ1 = (p.angleOfIncidence * Math.PI) / 180;
    const sinθ2 = (n1 * Math.sin(θ1)) / n2;
    const θ2 = Math.asin(Math.min(1, Math.max(-1, sinθ2)));
    const θ2Deg = (θ2 * 180) / Math.PI;
    return {
      problemType: p.problemType,
      angleOfRefraction: θ2Deg,
      equationsUsed: [`n₁sinθ₁ = n₂sinθ₂`, `θ₂ = ${θ2Deg.toFixed(2)}°`],
      isSimulationFriendly: !calcOnly,
    };
  }

  if (p.problemType === "reflection") {
    return {
      problemType: "reflection",
      angleOfRefraction: p.angleOfIncidence,
      equationsUsed: [`θ_incident = θ_reflected = ${p.angleOfIncidence}°`],
      isSimulationFriendly: true,
    };
  }

  if (p.problemType === "criticalAngle") {
    const n1 = p.refractiveIndex1;
    const n2 = p.refractiveIndex2;
    const sinθc = n2 / n1;
    const θc = Math.asin(Math.min(1, sinθc));
    const θcDeg = (θc * 180) / Math.PI;
    return {
      problemType: "criticalAngle",
      criticalAngle: θcDeg,
      equationsUsed: [`sin θc = n₂/n₁`, `θc = ${θcDeg.toFixed(2)}°`],
      isSimulationFriendly: false,
    };
  }

  return { problemType: p.problemType, equationsUsed: [], isSimulationFriendly: false };
}
