export type MotionType = "linear" | "projectile";

export interface PhysicsParams {
  objectName: string;
  motionType: MotionType;
  isVerticalMotion: boolean;
  initialVelocity: number;
  finalVelocity: number | null;
  acceleration: number;
  time: number;
  displacement: number | null;
  angle: number;
  initialHeight: number;
  gravity: number;
}

export interface SimulationResult {
  displacement: number;
  time: number;
  maxHeight: number | null;
  range: number | null;
  equationsUsed: string[];
  trajectory: { x: number; y: number; t: number }[];
}

export function getDefaultParams(): PhysicsParams {
  return {
    objectName: "Object",
    motionType: "linear",
    isVerticalMotion: false,
    initialVelocity: 10,
    finalVelocity: null,
    acceleration: 0,
    time: 5,
    displacement: null,
    angle: 45,
    initialHeight: 0,
    gravity: 9.8,
  };
}

export function parsePhysicsProblem(text: string): Partial<PhysicsParams> {
  const result: Partial<PhysicsParams> = {};
  const lower = text.toLowerCase();
  const clampAngle = (value: number) => Math.max(-90, Math.min(90, value));

  // Extract object name
  const objects = ["car", "bike", "rocket", "ball", "stone", "object", "human", "person", "block", "particle", "bullet", "arrow"];
  for (const obj of objects) {
    if (lower.includes(obj)) {
      result.objectName = obj.charAt(0).toUpperCase() + obj.slice(1);
      break;
    }
  }
  if (!result.objectName) result.objectName = "Object";

  // Detect motion type
  const projectileVerbs = ["throw", "thrown", "launch", "launched", "project", "projected", "kick", "kicked", "fire", "fired", "shot", "shoot", "shooting", "toss", "tossed"];
  const verticalPhrases = [
    "straight up",
    "straight upward",
    "straight down",
    "straight downward",
    "vertically",
    "vertical motion",
    "moves upward",
    "moving upward",
    "moves downward",
    "moving downward",
    "goes up",
    "going up",
    "goes down",
    "going down",
  ];
  const projectileVerbPresent = projectileVerbs.some(word => lower.includes(word));
  const projectileKeywordPresent = projectileVerbPresent || lower.includes("projectile");
  const mentionsAngle = /(\d+\.?\d*)\s*(degree|°|deg)\b|\bangle\b/.test(lower);
  const isDropped = /\bdrop(ped|s|ping)?\b|free\s*fall/.test(lower);
  const verticalWithProjectile = /\b(thrown|launch(?:ed|es|ing)?|projected|kicked|fired|shot|shoot(?:ing|s)?|tossed|toss(?:ing|es)?)\s+(straight\s+)?(up|upward|down|downward|vertically)\b/.test(lower);
  const simpleVerticalMotion = /\bmoves?\s+(upward|upwards|downward|downwards|vertically)\b/.test(lower) || /\bfalls?\b/.test(lower);
  const verticalPhrasePresent = verticalPhrases.some(phrase => lower.includes(phrase));

  const verticalContext = isDropped || verticalWithProjectile || simpleVerticalMotion || verticalPhrasePresent;
  const shouldBeProjectile = projectileKeywordPresent || mentionsAngle;
  const shouldBeVertical = !shouldBeProjectile && verticalContext;

  result.motionType = shouldBeProjectile ? "projectile" : "linear";
  result.isVerticalMotion = shouldBeVertical;

  // Extract velocity
  const velMatch = lower.match(/(\d+\.?\d*)\s*m\/?s/);
  if (velMatch) result.initialVelocity = parseFloat(velMatch[1]);

  // Extract angle
  const angleMatch = lower.match(/(\d+\.?\d*)\s*(degree|°|deg)/);
  if (angleMatch) {
    result.angle = clampAngle(parseFloat(angleMatch[1]));
    result.motionType = "projectile";
    result.isVerticalMotion = false;
  }

  // Extract acceleration
  const accMatch = lower.match(/(\d+\.?\d*)\s*m\/?s[²2]/);
  if (accMatch && /accel|decel/.test(lower)) {
    result.acceleration = parseFloat(accMatch[1]);
    if (/decel|slow|brak|stop/.test(lower)) {
      result.acceleration = -result.acceleration;
    }
  }

  // Extract time
  const timeMatch = lower.match(/(\d+\.?\d*)\s*(second|sec|s\b)/);
  if (timeMatch) result.time = parseFloat(timeMatch[1]);

  // Extract height
  const heightMatch = lower.match(/(\d+\.?\d*)\s*(meter|m)\b/);
  if (/height|from/.test(lower) && heightMatch) {
    result.initialHeight = parseFloat(heightMatch[1]);
  }

  // Special cases
  if (isDropped) {
    result.initialVelocity = 0;
    const gravityValue = result.gravity ?? 9.8;
    result.acceleration = -Math.abs(gravityValue);
    result.motionType = "linear";
    result.isVerticalMotion = true;
    // For dropped objects, extract height
    const hMatch = lower.match(/(\d+\.?\d*)\s*(meter|m)\b/);
    if (hMatch) result.initialHeight = parseFloat(hMatch[1]);
  }

  if (result.motionType === "linear" && result.isVerticalMotion) {
    const gravityValue = result.gravity ?? 9.8;
    result.acceleration = -Math.abs(gravityValue);
  }

  if (result.angle !== undefined) {
    result.angle = clampAngle(result.angle);
  }

  if (result.motionType === "projectile" && (result.angle === undefined || Number.isNaN(result.angle))) {
    result.angle = 90;
  }

  if (/decel|stop|brak/.test(lower)) {
    result.finalVelocity = 0;
  }

  if (/from rest|from\s+rest|starts?\s+from\s+rest/.test(lower)) {
    result.initialVelocity = 0;
  }

  return result;
}

export function solveSimulation(params: PhysicsParams): SimulationResult {
  const { motionType, initialVelocity: u, acceleration: a, gravity: g, angle, initialHeight: h, isVerticalMotion } = params;

  if (motionType === "projectile") {
    return solveProjectile(u, angle, g, h, params.objectName);
  } else {
    if (isVerticalMotion) {
      return solveVertical(params);
    }
    return solveLinear(params);
  }
}

function solveProjectile(u: number, angleDeg: number, g: number, h: number, _name: string): SimulationResult {
  const theta = (angleDeg * Math.PI) / 180;
  const ux = u * Math.cos(theta);
  const uy = u * Math.sin(theta);

  // Time of flight: solve h + uy*t - 0.5*g*t^2 = 0
  const discriminant = uy * uy + 2 * g * h;
  const T = discriminant >= 0 ? (uy + Math.sqrt(discriminant)) / g : (2 * uy) / g;
  const totalTime = Math.max(T, 0.1);

  const maxHeight = h + (uy * uy) / (2 * g);
  const range = ux * totalTime;

  const steps = 200;
  const trajectory: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalTime;
    const x = ux * t;
    const y = h + uy * t - 0.5 * g * t * t;
    if (y < 0 && i > 0) break;
    trajectory.push({ x, y: Math.max(0, y), t });
  }

  const equations = [
    `x = ${ux.toFixed(1)}t`,
    `y = ${h.toFixed(1)} + ${uy.toFixed(1)}t - ½(${g})t²`,
    `H = (u²sin²θ)/(2g) = ${maxHeight.toFixed(2)} m`,
    `T = (u sinθ + √(u²sin²θ + 2gh))/g = ${totalTime.toFixed(2)} s`,
    `R = ${range.toFixed(2)} m`,
  ];

  return {
    displacement: range,
    time: totalTime,
    maxHeight,
    range,
    equationsUsed: equations,
    trajectory,
  };
}

function solveLinear(params: PhysicsParams): SimulationResult {
  const { initialVelocity: u, acceleration: a, time: tParam, finalVelocity: vf } = params;
  const equations: string[] = [];
  let s: number;
  let t: number;

  if (vf !== null && vf === 0 && a !== 0) {
    // Stopping: v = 0
    t = -u / a;
    s = u * t + 0.5 * a * t * t;
    equations.push(`v = u + at → 0 = ${u} + (${a})t → t = ${t.toFixed(2)} s`);
    equations.push(`s = ut + ½at² = ${s.toFixed(2)} m`);
  } else if (a !== 0) {
    t = tParam;
    s = u * t + 0.5 * a * t * t;
    equations.push(`s = ut + ½at² = ${u}(${t}) + ½(${a})(${t})² = ${s.toFixed(2)} m`);
  } else {
    t = tParam;
    s = u * t;
    equations.push(`s = ut = ${u} × ${t} = ${s.toFixed(2)} m`);
  }

  const steps = 200;
  const simTime = Math.abs(t) || tParam;
  const trajectory: { x: number; y: number; t: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const ti = (i / steps) * simTime;
    const xi = u * ti + 0.5 * a * ti * ti;
    // If decelerating and stopped
    if (vf === 0 && a < 0) {
      const stopTime = -u / a;
      if (ti > stopTime) {
        trajectory.push({ x: u * stopTime + 0.5 * a * stopTime * stopTime, y: 0, t: ti });
        continue;
      }
    }
    trajectory.push({ x: Math.max(0, xi), y: 0, t: ti });
  }

  return {
    displacement: Math.abs(s),
    time: simTime,
    maxHeight: null,
    range: null,
    equationsUsed: equations,
    trajectory,
  };
}

function solveVertical(params: PhysicsParams): SimulationResult {
  const { initialVelocity: u, initialHeight: h, gravity: g, time: fallbackTime } = params;
  const equations: string[] = [];
  const gMag = Math.max(Math.abs(g), 0.1);

  const discriminant = u * u + 2 * gMag * Math.max(h, 0);
  const sqrtDisc = Math.sqrt(Math.max(discriminant, 0));
  const totalTimeRaw = (u + sqrtDisc) / gMag;
  const totalTime = totalTimeRaw > 0 ? totalTimeRaw : Math.max(fallbackTime, 0.1);

  const maxHeight = u > 0 ? h + (u * u) / (2 * gMag) : h;
  const steps = 200;
  const trajectory: { x: number; y: number; t: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalTime;
    const y = h + u * t - 0.5 * gMag * t * t;
    if (y < 0 && i > 0) {
      trajectory.push({ x: 0, y: 0, t });
      break;
    }
    trajectory.push({ x: 0, y: Math.max(0, y), t });
  }

  equations.push(`y = ${h.toFixed(1)} + ${u.toFixed(1)}t - ½(${gMag.toFixed(2)})t²`);
  equations.push(`T = (u + √(u² + 2gh)) / g = ${totalTime.toFixed(2)} s`);

  const displacement = Math.abs(trajectory[trajectory.length - 1]?.y ?? 0 - h);

  return {
    displacement,
    time: totalTime,
    maxHeight,
    range: null,
    equationsUsed: equations,
    trajectory,
  };
}
