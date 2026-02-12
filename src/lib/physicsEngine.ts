export type MotionType = "linear" | "projectile" | "circular" | "friction" | "inclined" | "inclinedProjectile";

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
  // Circular motion
  radius: number;
  angularVelocity: number;
  mass: number | null;
  // Friction / Inclined
  coefficientOfFriction: number;
  inclineAngle: number;
  launchAngleRelativeToIncline: number;
}

export interface SimulationResult {
  displacement: number;
  time: number;
  maxHeight: number | null;
  range: number | null;
  equationsUsed: string[];
  trajectory: { x: number; y: number; t: number }[];
  error?: string;
  // Circular motion results
  angularVelocity?: number;
  centripetalAcceleration?: number;
  centripetalForce?: number | null;
  // Friction results
  frictionForce?: number;
  frictionAcceleration?: number;
  timeToStop?: number;
  isConstantVelocity?: boolean;
  // Inclined plane results
  normalForce?: number;
  netAccelerationAlongIncline?: number;
  inclineFrictionForce?: number | null;
}

export function validateParams(params: PhysicsParams): { valid: boolean; message?: string } {
  const { motionType } = params;
  const g = params.gravity ?? 9.8;
  const t = params.time ?? 5;
  const mu = params.coefficientOfFriction ?? 0;
  const inclineAng = params.inclineAngle ?? 30;

  if (g <= 0 || !Number.isFinite(g)) {
    return { valid: false, message: "Invalid input values. Please check parameters.\nGravity must be greater than 0." };
  }
  if (t < 0 || !Number.isFinite(t)) {
    return { valid: false, message: "Invalid input values. Please check parameters.\nTime must be greater than or equal to 0." };
  }
  if (mu < 0 || !Number.isFinite(mu)) {
    return { valid: false, message: "Invalid input values. Please check parameters.\nCoefficient of friction must be greater than or equal to 0." };
  }
  if (inclineAng < 0 || inclineAng > 90 || !Number.isFinite(inclineAng)) {
    return { valid: false, message: "Invalid input values. Please check parameters.\nIncline angle must be between 0 and 90 degrees." };
  }

  if (motionType === "circular") {
    const r = params.radius ?? 5;
    if (r <= 0 || !Number.isFinite(r)) {
      return { valid: false, message: "Invalid radius. Radius must be greater than zero." };
    }
  }

  if (motionType === "friction") {
    const m = params.mass ?? 1;
    if (mu > 0 && (m <= 0 || !Number.isFinite(m))) {
      return { valid: false, message: "Invalid input values. Please check parameters.\nMass must be greater than 0." };
    }
  }
  if (motionType === "inclined") {
    // Incline angle 0: handled by solveInclined (converts to friction), validation still passes
    const m = params.mass ?? 1;
    if (m <= 0 || !Number.isFinite(m)) {
      return { valid: false, message: "Invalid input values. Please check parameters.\nMass must be greater than 0." };
    }
  }

  const angle = params.angle ?? 45;
  const launchAng = params.launchAngleRelativeToIncline ?? 45;
  if ((motionType === "projectile" || motionType === "inclinedProjectile") && (angle < -90 || angle > 90 || !Number.isFinite(angle))) {
    return { valid: false, message: "Invalid input values. Please check parameters.\nLaunch angle must be between -90 and 90 degrees." };
  }
  if (motionType === "inclinedProjectile" && (launchAng < -90 || launchAng > 90 || !Number.isFinite(launchAng))) {
    return { valid: false, message: "Invalid input values. Please check parameters.\nLaunch angle must be between -90 and 90 degrees." };
  }

  return { valid: true };
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
    radius: 5,
    angularVelocity: 1,
    mass: null,
    coefficientOfFriction: 0.3,
    inclineAngle: 30,
    launchAngleRelativeToIncline: 45,
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

  // Detect motion type - Priority: Circular > Inclined projectile > Inclined plane > Friction > Projectile > Linear
  const circularKeywords = [
    "uniform circular motion",
    "circular", "circle", "orbit", "revolving", "rotating", "rotation",
    "centripetal", "spinning", "satellite", "wheel", "turning",
  ];
  const isCircular = circularKeywords.some(kw => lower.includes(kw));

  const inclinedProjectileKeywords = [
    "projectile from incline", "thrown from a slope", "launched from an inclined plane",
    "projection from incline", "projectile from slope", "launched from incline",
    "projected from a slope", "projected from incline", "projected from slope",
    "thrown from incline",
  ];
  const isInclinedProjectile = inclinedProjectileKeywords.some(kw => lower.includes(kw));

  const inclinedKeywords = [
    "inclined plane", "slope", "incline", "ramp", "angle of incline",
    "block on incline", "object on slope", "block on slope",
  ];
  const isInclined = inclinedKeywords.some(kw => lower.includes(kw));

  const frictionKeywords = [
    "friction", "rough surface", "coefficient of friction", "sliding",
    "block on surface", "kinetic friction", "static friction",
    "resisting force", "horizontal surface",
  ];
  const isFriction = frictionKeywords.some(kw => lower.includes(kw));

  const projectileVerbs = ["thrown", "launched", "projected", "kicked", "fired", "tossed", "shot"];
  const verticalPhrases = [
    "dropped", "free fall", "falls", "falling",
    "thrown straight up", "thrown straight upward", "thrown vertically",
    "moves upward", "moves downward", "moving upward", "moving downward",
    "vertical motion", "straight up", "straight upward", "straight down", "straight downward",
    "vertically", "goes up", "going up", "goes down", "going down",
  ];
  const projectileVerbPresent = projectileVerbs.some(word => new RegExp(`\\b${word}\\b`).test(lower));
  const mentionsAngle = /(\d+\.?\d*)\s*(degree|°|deg)\b|\bangle\b/i.test(lower);
  const isDropped = /\b(drop(ped|s|ping)?|free\s*fall)\b/.test(lower);
  const isFalling = /\b(falls?|falling)\b/.test(lower);
  const verticalWithProjectile = /\b(thrown|launched|projected|kicked|fired|tossed|shot)\s+(straight\s+)?(up|upward|down|downward|vertically)\b/.test(lower);
  const simpleVerticalMotion = /\bmoves?\s+(upward|upwards|downward|downwards|vertically)\b/.test(lower);
  const verticalPhrasePresent = verticalPhrases.some(phrase => lower.includes(phrase));

  const verticalContext = isDropped || isFalling || verticalWithProjectile || simpleVerticalMotion || verticalPhrasePresent;
  const shouldBeProjectile = !isCircular && !isInclinedProjectile && !isInclined && !isFriction && !verticalContext && (projectileVerbPresent || mentionsAngle);
  const shouldBeVertical = !isCircular && !isInclinedProjectile && !isInclined && !isFriction && !shouldBeProjectile && verticalContext;

  if (isCircular) result.motionType = "circular";
  else if (isInclinedProjectile) result.motionType = "inclinedProjectile";
  else if (isInclined) result.motionType = "inclined";
  else if (isFriction) result.motionType = "friction";
  else if (shouldBeProjectile) result.motionType = "projectile";
  else result.motionType = "linear";
  result.isVerticalMotion = shouldBeVertical;

  // Extract velocity
  const velMatch = lower.match(/(\d+\.?\d*)\s*m\/?s/);
  if (velMatch) result.initialVelocity = parseFloat(velMatch[1]);

  // Extract angle (only for projectile, not for vertical/linear)
  const angleMatch = lower.match(/(\d+\.?\d*)\s*(degree|°|deg)/);
  if (angleMatch && !verticalContext) {
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

  // Extract height (match "15 m", "15 meter", "15 meters")
  const heightMatch = lower.match(/(\d+\.?\d*)\s*(?:meters?|m)\b/);
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
    // For dropped objects, extract height (match "15 m", "15 meter", "15 meters")
    const hMatch = lower.match(/(\d+\.?\d*)\s*(?:meters?|m)\b/);
    if (hMatch) {
      result.initialHeight = parseFloat(hMatch[1]);
    } else {
      result.initialHeight = 10;
    }
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

  // Extract friction parameters
  if (result.motionType === "friction") {
    const muMatch = lower.match(/coefficient\s*(?:of)?\s*friction\s*(?:[=:]?\s*)?(\d+\.?\d*)|μ\s*=\s*(\d+\.?\d*)|(?:mu|μ)\s*=\s*(\d+\.?\d*)|friction\s*(?:coefficient)?\s*(\d+\.?\d*)/);
    if (muMatch) {
      const mu = parseFloat(muMatch[1] || muMatch[2] || muMatch[3] || muMatch[4] || "0.3");
      if (Number.isFinite(mu)) result.coefficientOfFriction = mu;
    }
    const massMatch = lower.match(/mass\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*kg/);
    if (massMatch) {
      const m = parseFloat(massMatch[1] || massMatch[2] || "1");
      if (Number.isFinite(m)) result.mass = m;
    }
  }

  // Extract inclined plane parameters
  if (result.motionType === "inclined" || result.motionType === "inclinedProjectile") {
    const inclineMatch = lower.match(/incline\s*(?:angle|of)?\s*(?:[=:]?\s*)?(\d+\.?\d*)|slope\s*(?:of)?\s*(\d+\.?\d*)|angle\s*(?:of)?\s*incline\s*(?:[=:]?\s*)?(\d+\.?\d*)|(\d+\.?\d*)\s*(?:degree|°|deg)/);
    if (inclineMatch) {
      const ang = parseFloat(inclineMatch[1] || inclineMatch[2] || inclineMatch[3] || inclineMatch[4] || "30");
      if (Number.isFinite(ang)) result.inclineAngle = Math.min(90, Math.max(0, ang));
    }
    const muMatch = lower.match(/coefficient\s*(?:of)?\s*friction\s*(?:[=:]?\s*)?(\d+\.?\d*)|μ\s*=\s*(\d+\.?\d*)/);
    if (muMatch) {
      const mu = parseFloat(muMatch[1] || muMatch[2] || "0");
      if (Number.isFinite(mu)) result.coefficientOfFriction = mu;
    }
    if (result.motionType === "inclinedProjectile") {
      const launchMatch = lower.match(/launch\s*angle\s*(?:[=:]?\s*)?(\d+\.?\d*)|angle\s*relative\s*(?:to)?\s*incline\s*(?:[=:]?\s*)?(\d+\.?\d*)/);
      if (launchMatch) {
        const ang = parseFloat(launchMatch[1] || launchMatch[2] || "45");
        if (Number.isFinite(ang)) result.launchAngleRelativeToIncline = clampAngle(ang);
      } else {
        // Inclined projectile detected but launch angle not specified: default to 45°
        result.launchAngleRelativeToIncline = 45;
      }
    }
  }

  // Extract circular motion parameters
  if (result.motionType === "circular") {
    const radiusMatch = lower.match(/radius\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*(?:m|meter)s?\s*(?:radius)?|orbit\s*(?:with\s*)?(?:radius\s*)?(\d+\.?\d*)/);
    if (radiusMatch) {
      const r = parseFloat(radiusMatch[1] || radiusMatch[2] || radiusMatch[3] || "5");
      if (Number.isFinite(r)) result.radius = r;
    }
    const omegaMatch = lower.match(/(\d+\.?\d*)\s*rad\/s|angular\s*velocity\s*(?:of)?\s*(\d+\.?\d*)|omega\s*=\s*(\d+\.?\d*)|rotating\s*at\s*(\d+\.?\d*)|at\s*(\d+\.?\d*)\s*rad/);
    if (omegaMatch) {
      const w = parseFloat(omegaMatch[1] || omegaMatch[2] || omegaMatch[3] || omegaMatch[4] || omegaMatch[5] || "1");
      if (Number.isFinite(w)) result.angularVelocity = w;
    }
    const speedMatch = lower.match(/(\d+\.?\d*)\s*m\/s|speed\s*(?:of)?\s*(\d+\.?\d*)/);
    if (speedMatch && result.radius != null && result.radius > 0) {
      const v = parseFloat(speedMatch[1] || speedMatch[2] || "0");
      if (Number.isFinite(v) && v > 0) result.angularVelocity = v / result.radius;
    }
    const massMatch = lower.match(/mass\s*(?:of)?\s*(\d+\.?\d*)|(\d+\.?\d*)\s*kg/);
    if (massMatch) {
      const m = parseFloat(massMatch[1] || massMatch[2] || "1");
      if (Number.isFinite(m)) result.mass = m;
    }
  }

  return result;
}

export function solveSimulation(params: PhysicsParams): SimulationResult {
  const validation = validateParams(params);
  if (!validation.valid) {
    return {
      displacement: 0,
      time: 0,
      maxHeight: null,
      range: null,
      equationsUsed: [],
      trajectory: [],
      error: validation.message,
    };
  }
  const { motionType, initialVelocity: u, acceleration: a, gravity: g, angle, initialHeight: h, isVerticalMotion } = params;

  // Inclined projectile without launch angle: default to 45°
  let effectiveParams = params;
  if (motionType === "inclinedProjectile") {
    const launchAng = params.launchAngleRelativeToIncline ?? 45;
    if (!Number.isFinite(launchAng) || launchAng < -90 || launchAng > 90) {
      effectiveParams = { ...params, launchAngleRelativeToIncline: 45 };
    }
  }

  if (motionType === "circular") return solveCircular(params);
  if (motionType === "friction") return solveFriction(params);
  if (motionType === "inclined") return solveInclined(params);
  if (motionType === "inclinedProjectile") return solveInclinedProjectile(effectiveParams);
  if (motionType === "projectile") return solveProjectile(u, angle, g, h, params.objectName);
  if (isVerticalMotion) return solveVertical(params);
  return solveLinear(params);
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

  const displacement = Math.abs((trajectory[trajectory.length - 1]?.y ?? 0) - h);

  return {
    displacement,
    time: totalTime,
    maxHeight,
    range: null,
    equationsUsed: equations,
    trajectory,
  };
}

function solveCircular(params: PhysicsParams): SimulationResult {
  const { radius: r, angularVelocity: omega, mass } = params;
  const R = Math.max(Math.abs(r), 0.5);
  const w = Math.abs(omega) || 0.5;
  const period = (2 * Math.PI) / w;
  const steps = 200;
  const trajectory: { x: number; y: number; t: number }[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * period;
    const x = R * Math.cos(w * t);
    const y = R * Math.sin(w * t);
    trajectory.push({ x, y, t });
  }

  const v = w * R;
  const ac = (v * v) / R;
  const Fc = mass != null && mass > 0 ? mass * ac : null;

  const equations = [
    `v = ωr = ${v.toFixed(2)} m/s`,
    `a_c = v²/r = ω²r = ${ac.toFixed(2)} m/s²`,
    Fc != null ? `F_c = m·a_c = ${Fc.toFixed(2)} N` : null,
    `T = 2π/ω = ${period.toFixed(2)} s`,
  ].filter(Boolean) as string[];

  return {
    displacement: 2 * Math.PI * R,
    time: period,
    maxHeight: null,
    range: null,
    equationsUsed: equations,
    trajectory,
    angularVelocity: w,
    centripetalAcceleration: ac,
    centripetalForce: Fc,
  };
}

function solveFriction(params: PhysicsParams): SimulationResult {
  const { initialVelocity: u, mass, coefficientOfFriction: mu, gravity: g } = params;
  const m = Math.max(mass ?? 1, 0.1);
  const μ = Math.max(mu ?? 0.3, 0);
  const gMag = Math.abs(g) || 9.8;
  const Ff = μ * m * gMag;

  if (μ === 0) {
    const simTime = 5;
    const distance = u * simTime;
    const steps = 200;
    const trajectory: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * simTime;
      const x = u * t;
      trajectory.push({ x: Math.max(0, x), y: 0, t });
    }
    const equations = [
      "Friction force = 0",
      "Acceleration = 0",
      "Motion type: constant velocity",
    ];
    return {
      displacement: distance,
      time: simTime,
      maxHeight: null,
      range: null,
      equationsUsed: equations,
      trajectory,
      frictionForce: 0,
      frictionAcceleration: 0,
      timeToStop: undefined,
      isConstantVelocity: true,
    };
  }

  const aFric = -μ * gMag;
  const timeToStop = u > 0 ? u / (μ * gMag) : 0.1;
  const distance = u > 0 ? (u * u) / (2 * μ * gMag) : 0;

  const steps = 200;
  const trajectory: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * timeToStop;
    const x = u * t + 0.5 * aFric * t * t;
    trajectory.push({ x: Math.max(0, x), y: 0, t });
  }

  const equations = [
    `F_f = μN = μmg = ${Ff.toFixed(2)} N`,
    `a = -μg = ${aFric.toFixed(2)} m/s²`,
    `t = u/(μg) = ${timeToStop.toFixed(2)} s`,
    `s = u²/(2μg) = ${distance.toFixed(2)} m`,
  ];

  return {
    displacement: distance,
    time: timeToStop,
    maxHeight: null,
    range: null,
    equationsUsed: equations,
    trajectory,
    frictionForce: Ff,
    frictionAcceleration: Math.abs(aFric),
    timeToStop,
  };
}

function solveInclined(params: PhysicsParams): SimulationResult {
  const { mass, inclineAngle: thetaDeg, gravity: g, coefficientOfFriction: mu, initialVelocity: u0 } = params;
  const thetaDegVal = thetaDeg ?? 30;
  if (thetaDegVal <= 0) {
    const frictionParams: PhysicsParams = {
      ...params,
      motionType: "friction",
      initialVelocity: u0 ?? 0,
      coefficientOfFriction: mu ?? 0,
    };
    return solveFriction(frictionParams);
  }
  const m = Math.max(mass ?? 1, 0.1);
  const θ = (Math.min(89, Math.max(0.1, thetaDegVal)) * Math.PI) / 180;
  const gMag = Math.abs(g) || 9.8;
  const μ = Math.max(mu ?? 0, 0);
  const N = m * gMag * Math.cos(θ);
  const Ff = μ * N;
  const aDown = gMag * Math.sin(θ) - μ * gMag * Math.cos(θ);
  const a = Math.max(aDown, 0.1);
  const slopeLength = 20;
  const timeToBottom = Math.sqrt((2 * slopeLength) / a);

  const steps = 200;
  const trajectory: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * timeToBottom;
    const s = 0.5 * a * t * t;
    const x = s * Math.cos(θ);
    const y = s * Math.sin(θ);
    trajectory.push({ x, y, t });
  }

  const equations = [
    `a = g(sin θ - μ cos θ) = ${a.toFixed(2)} m/s²`,
    `N = mg cos θ = ${N.toFixed(2)} N`,
    μ > 0 ? `F_f = μN = ${Ff.toFixed(2)} N` : null,
    `t = √(2L/a) = ${timeToBottom.toFixed(2)} s`,
  ].filter(Boolean) as string[];

  return {
    displacement: slopeLength,
    time: timeToBottom,
    maxHeight: slopeLength * Math.sin(θ),
    range: null,
    equationsUsed: equations,
    trajectory,
    normalForce: N,
    netAccelerationAlongIncline: a,
    inclineFrictionForce: μ > 0 ? Ff : null,
  };
}

function solveInclinedProjectile(params: PhysicsParams): SimulationResult {
  const { initialVelocity: u, launchAngleRelativeToIncline: alphaDeg, inclineAngle: thetaDeg, gravity: g, initialHeight: h } = params;
  const θ = (Math.min(89, Math.max(1, thetaDeg ?? 30)) * Math.PI) / 180;
  const α = ((alphaDeg ?? 45) * Math.PI) / 180;
  const gMag = Math.abs(g) || 9.8;
  const v0 = Math.max(u ?? 10, 1);
  const h0 = Math.max(h ?? 0, 0);
  const angleFromHorizontal = θ + α;
  const ux = v0 * Math.cos(angleFromHorizontal);
  const uy = v0 * Math.sin(angleFromHorizontal);

  const discriminant = uy * uy + 2 * gMag * h0;
  const T = (uy + Math.sqrt(Math.max(discriminant, 0))) / gMag;
  const totalTime = Math.max(T, 0.5);
  const range = ux * totalTime;
  const maxHeight = h0 + (uy * uy) / (2 * gMag);

  const steps = 200;
  const trajectory: { x: number; y: number; t: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * totalTime;
    const x = ux * t;
    const y = h0 + uy * t - 0.5 * gMag * t * t;
    if (y < 0 && i > 0) break;
    trajectory.push({ x, y: Math.max(0, y), t });
  }

  const equations = [
    `x = ${ux.toFixed(1)}t`,
    `y = ${h0.toFixed(1)} + ${uy.toFixed(1)}t - ½gt²`,
    `Effective launch angle = θ + α = ${((angleFromHorizontal * 180) / Math.PI).toFixed(1)}°`,
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
