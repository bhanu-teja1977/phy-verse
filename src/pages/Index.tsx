import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Pause, RotateCcw, Lightbulb, Zap, Droplets, Sun } from "lucide-react";
import SimulationCanvas from "@/components/SimulationCanvas";
import ParameterSliders from "@/components/ParameterSliders";
import ResultsPanel from "@/components/ResultsPanel";
import EquationsPanel from "@/components/EquationsPanel";
import FluidCanvas from "@/components/FluidCanvas";
import WaveOpticsCanvas from "@/components/WaveOpticsCanvas";
import FluidParameterPanel from "@/components/FluidParameterPanel";
import WaveOpticsParameterPanel from "@/components/WaveOpticsParameterPanel";
import FluidResultsPanel from "@/components/FluidResultsPanel";
import WaveOpticsResultsPanel from "@/components/WaveOpticsResultsPanel";
import {
  PhysicsParams,
  SimulationResult,
  getDefaultParams,
  parsePhysicsProblem,
  solveSimulation,
} from "@/lib/physicsEngine";
import {
  FluidParams,
  FluidResult,
  getDefaultFluidParams,
  parseFluidProblem,
  solveFluid,
  isSimulationFriendlyFluid,
} from "@/lib/fluidEngine";
import {
  WaveOpticsParams,
  WaveOpticsResult,
  getDefaultWaveOpticsParams,
  parseWaveOpticsProblem,
  solveWaveOptics,
  isSimulationFriendlyType,
} from "@/lib/waveOpticsEngine";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type AppSection = "kinematics" | "fluid" | "waveOptics";

const kinematicsExamples = [
  "A car moving at 20 m/s decelerates at 5 m/s²",
  "A ball is thrown at 20 m/s at 30 degrees",
  "A car moves in a circular track of radius 50 m at a speed of 10 m/s",
  "A block slides down a 25 degree incline",
  "A ball is projected from a slope at 20 m/s",
  "A block slides on a rough surface with friction coefficient 0.3",
  "A bike accelerates from rest at 2 m/s² for 5 seconds",
  "An object is dropped from 15 meters",
  "A block moves on a surface with coefficient of friction 0",
  "A ball of mass 2 kg moves in a circle of radius 1.5 m at a speed of 6 m/s",
  "A particle is moving in a circle of radius 4 m and completes one revolution in 8 seconds",
  "An object moves in a circular path of radius 0 m at 5 m/s",
  "A 4 kg block slides down a 25 degree incline with friction coefficient 0.2",
  "A block slides on a rough inclined plane of 30 degrees with friction coefficient 0.2",
  "A ball is projected up an inclined plane of 30 degrees with speed 20 m/s",
];

const fluidSimExamples = [
  "A wooden block of density 600 kg/m³ floats in water. Show the fraction submerged.",
  "Water flows through a pipe of area 0.05 m² at 3 m/s and enters a section of area 0.02 m². Show the change in speed.",
  "Water flows out of a hole at the bottom of a tank. The water level is 8 meters above the hole. Show the jet motion.",
  "A hydraulic press has a small piston of area 0.02 m² and a large piston of area 0.5 m². A force is applied to the small piston. Show the motion of the large piston.",
  "Water exits a hole at 6 m/s horizontally from a height of 2 meters. Show the path of the water jet.",
];

const fluidCalcExamples = [
  "Find the pressure at a depth of 5 meters in water.",
  "Find the buoyant force on a fully submerged block of volume 0.02 m³.",
  "Water flows through a pipe where pressure changes between two points. Use Bernoulli's equation to find the pressure.",
  "Find the Reynolds number for water flowing in a pipe.",
];

const waveOpticsSimExamples = [
  "A wave has wavelength 2 meters and frequency 4 Hz. Show the wave motion.",
  "Light of wavelength 600 nm passes through a double slit. Show the interference pattern.",
  "Light of wavelength 500 nm passes through a single slit. Show the diffraction pattern.",
  "Light enters glass from air at an angle of 30 degrees. Show the refracted ray.",
  "A light ray strikes a mirror at 40 degrees. Show the reflected ray.",
];

const waveOpticsCalcExamples = [
  "Find the fringe spacing in a double-slit experiment.",
  "Find the angle of refraction using Snell's law.",
  "Find the speed of a wave with wavelength 3 meters and frequency 10 Hz.",
  "Find the critical angle for glass-air boundary.",
];

const clampAngleValue = (value: number) => Math.max(-90, Math.min(90, value));

export default function Index() {
  const [section, setSection] = useState<AppSection>("kinematics");
  const [problemText, setProblemText] = useState("");

  // Kinematics state
  const [params, setParams] = useState<PhysicsParams>(getDefaultParams());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Fluid state
  const [fluidParams, setFluidParams] = useState<FluidParams>(getDefaultFluidParams());
  const [fluidResult, setFluidResult] = useState<FluidResult | null>(null);
  const [fluidHasGenerated, setFluidHasGenerated] = useState(false);

  // Wave optics state
  const [waveParams, setWaveParams] = useState<WaveOpticsParams>(getDefaultWaveOpticsParams());
  const [waveResult, setWaveResult] = useState<WaveOpticsResult | null>(null);
  const [waveHasGenerated, setWaveHasGenerated] = useState(false);

  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const examples = section === "kinematics" ? kinematicsExamples : section === "fluid" ? [...fluidSimExamples, ...fluidCalcExamples] : [...waveOpticsSimExamples, ...waveOpticsCalcExamples];
  const placeholder =
    section === "kinematics"
      ? "Enter a physics problem... e.g., 'A ball is thrown upward at 15 m/s from a height of 2 meters'"
      : section === "fluid"
        ? "Enter a fluid problem... e.g., 'A block of volume 0.02 m³ is placed in water. Will it float?'"
        : "Enter a wave/optics problem... e.g., 'Light of wavelength 600 nm passes through a double slit'";

  const handleSectionChange = (value: string) => {
    const s = value as AppSection;
    setSection(s);
    setProblemText("");
    if (s === "kinematics") setHasGenerated(false);
    if (s === "fluid") setFluidHasGenerated(false);
    if (s === "waveOptics") setWaveHasGenerated(false);
  };

  const generateSimulation = useCallback((p: PhysicsParams) => {
    const r = solveSimulation(p);
    setResult(r);
    setCurrentStep(0);
    setIsPlaying(false);
    setHasGenerated(true);
  }, []);

  const handleGenerate = (overrideText?: string) => {
    const text = (overrideText ?? problemText).trim();
    if (!text) return;

    if (section === "kinematics") {
      const parsed = parsePhysicsProblem(text);
      const defaults = getDefaultParams();
      let motionType = parsed.motionType ?? defaults.motionType;
      const inclineAngle = parsed.inclineAngle ?? defaults.inclineAngle;
      if (motionType === "inclined" && inclineAngle === 0) motionType = "friction";
      const angleForMotion =
        motionType === "projectile"
          ? clampAngleValue(parsed.angle ?? 90)
          : clampAngleValue(parsed.angle ?? defaults.angle);
      let initialVelocity = parsed.initialVelocity ?? defaults.initialVelocity;
      if (motionType === "friction" && parsed.motionType === "inclined" && parsed.initialVelocity === undefined) {
        initialVelocity = 0;
      }
      const newParams: PhysicsParams = {
        ...defaults,
        ...parsed,
        motionType,
        initialVelocity,
        angle: angleForMotion,
        time: parsed.time ?? 5,
        radius: parsed.radius ?? defaults.radius,
        angularVelocity: parsed.angularVelocity ?? defaults.angularVelocity,
        mass: parsed.mass ?? defaults.mass,
        coefficientOfFriction: parsed.coefficientOfFriction ?? defaults.coefficientOfFriction,
        inclineAngle: parsed.inclineAngle ?? defaults.inclineAngle,
        launchAngleRelativeToIncline: parsed.launchAngleRelativeToIncline ?? defaults.launchAngleRelativeToIncline,
      };
      setParams(newParams);
      generateSimulation(newParams);
    } else if (section === "fluid") {
      const parsed = parseFluidProblem(text);
      const { isCalculationOnly, ...parsedParams } = parsed;
      const newParams: FluidParams = { ...getDefaultFluidParams(), ...parsedParams } as FluidParams;
      if (!newParams.problemType) newParams.problemType = "floatingBody";
      setFluidParams(newParams);
      const r = solveFluid(newParams, isCalculationOnly ?? !isSimulationFriendlyFluid(newParams.problemType));
      setFluidResult(r);
      setFluidHasGenerated(true);
    } else if (section === "waveOptics") {
      const parsed = parseWaveOpticsProblem(text);
      const { isCalculationOnly, ...parsedParams } = parsed;
      const newParams: WaveOpticsParams = { ...getDefaultWaveOpticsParams(), ...parsedParams } as WaveOpticsParams;
      if (!newParams.problemType) newParams.problemType = "wavePropagation";
      setWaveParams(newParams);
      const r = solveWaveOptics(newParams, isCalculationOnly ?? !isSimulationFriendlyType(newParams.problemType));
      setWaveResult(r);
      setWaveHasGenerated(true);
    }
  };

  const handleParamChange = (key: string, value: number) => {
    let nextValue: number | null = value;
    if (key === "angle") nextValue = Number.isFinite(value) ? clampAngleValue(value) : 90;
    if (key === "launchAngleRelativeToIncline") nextValue = Number.isFinite(value) ? clampAngleValue(value) : 45;
    if (key === "inclineAngle") nextValue = Number.isFinite(value) ? Math.max(0, Math.min(90, value)) : 30;
    if (key === "mass") nextValue = value > 0 ? value : null;
    let newParams = { ...params, [key]: nextValue } as PhysicsParams;
    if (key === "inclineAngle" && params.motionType === "inclined" && nextValue === 0) {
      newParams = { ...newParams, motionType: "friction", initialVelocity: params.initialVelocity ?? 0 };
    }
    setParams(newParams);
    generateSimulation(newParams);
  };

  const handleFluidParamChange = (key: keyof FluidParams, value: number) => {
    const newParams = { ...fluidParams, [key]: value };
    setFluidParams(newParams);
    const forceCalcOnly = fluidResult ? !fluidResult.isSimulationFriendly : undefined;
    setFluidResult(solveFluid(newParams, forceCalcOnly));
  };

  const handleWaveParamChange = (key: keyof WaveOpticsParams, value: number) => {
    const newParams = { ...waveParams, [key]: value };
    setWaveParams(newParams);
    const forceCalcOnly = waveResult ? !waveResult.isSimulationFriendly : undefined;
    const r = solveWaveOptics(newParams, forceCalcOnly);
    setWaveResult(r);
  };

  const handleExample = (text: string) => {
    setProblemText(text);
    if (section === "fluid" || section === "waveOptics") {
      handleGenerate(text);
    }
  };

  useEffect(() => {
    if (!isPlaying || !result || result.trajectory.length === 0) return;
    const totalSteps = result.trajectory.length;
    const durationMs = result.time * 300;
    const stepDuration = durationMs / totalSteps;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const elapsed = timestamp - lastTimeRef.current;
      if (elapsed > stepDuration) {
        lastTimeRef.current = timestamp;
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return totalSteps - 1;
          }
          return prev + 1;
        });
      }
      animRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, result]);

  const handlePlayPause = () => {
    if (!result) return;
    if (currentStep >= result.trajectory.length - 1) setCurrentStep(0);
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const showKinematicsSim = section === "kinematics" && hasGenerated && result;
  const showFluidResults = section === "fluid" && fluidHasGenerated && fluidResult;
  const showFluidSim = showFluidResults && fluidResult?.isSimulationFriendly;
  const showWaveResults = section === "waveOptics" && waveHasGenerated && waveResult;
  const showWaveSim = showWaveResults && waveResult?.isSimulationFriendly;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-border bg-card px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">PhyVerse</h1>
              <p className="text-sm text-muted-foreground">Interactive physics simulations</p>
            </div>
          </div>

          <Tabs value={section} onValueChange={handleSectionChange}>
            <TabsList className="grid w-full min-w-0 grid-cols-3">
              <TabsTrigger value="kinematics" className="gap-1.5">
                <Zap size={14} />
                Kinematics
              </TabsTrigger>
              <TabsTrigger value="fluid" className="gap-1.5">
                <Droplets size={14} />
                Fluid Dynamics
              </TabsTrigger>
              <TabsTrigger value="waveOptics" className="gap-1.5">
                <Sun size={14} />
                Wave Optics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full min-w-0">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-warning" />
            <h2 className="font-semibold text-foreground">Describe Your Physics Problem</h2>
          </div>
          <textarea
            value={problemText}
            onChange={e => setProblemText(e.target.value)}
            placeholder={placeholder}
            className="w-full h-24 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <div className="flex flex-col gap-2">
              {section === "fluid" ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">Simulation-Friendly:</span>
                    {fluidSimExamples.map((ex, i) => (
                      <button
                        key={`fsim-${i}`}
                        onClick={() => handleExample(ex)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                      >
                        Sim {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">Calculation-Only:</span>
                    {fluidCalcExamples.map((ex, i) => (
                      <button
                        key={`fcalc-${i}`}
                        onClick={() => handleExample(ex)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                      >
                        Calc {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              ) : section === "waveOptics" ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">Simulation-Friendly:</span>
                    {waveOpticsSimExamples.map((ex, i) => (
                      <button
                        key={`sim-${i}`}
                        onClick={() => handleExample(ex)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                      >
                        Sim {i + 1}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">Calculation-Only:</span>
                    {waveOpticsCalcExamples.map((ex, i) => (
                      <button
                        key={`calc-${i}`}
                        onClick={() => handleExample(ex)}
                        className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                      >
                        Calc {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Try:</span>
                  {examples.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => handleExample(ex)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                    >
                      Example {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => handleGenerate()} className="gap-2 shrink-0">
              <Sparkles size={16} />
              Generate Simulation
            </Button>
          </div>
        </div>

        {/* Kinematics simulation */}
        {showKinematicsSim && (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
            {result.error && (
              <div className="lg:col-span-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-destructive text-sm">
                {result.error.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}
            <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Simulation</h3>
                  <p className="text-sm text-muted-foreground">
                    {params.motionType === "circular"
                      ? "Circular Motion"
                      : params.motionType === "inclinedProjectile"
                        ? "Inclined Projectile"
                        : params.motionType === "inclined"
                          ? "Inclined Plane"
                          : params.motionType === "friction"
                            ? "Friction Motion"
                            : params.motionType === "projectile"
                              ? "Projectile Motion"
                              : params.isVerticalMotion
                                ? "Vertical Motion"
                                : "Linear Motion"}{" "}
                    • {params.objectName}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleReset}>
                    <RotateCcw size={14} />
                  </Button>
                  <Button size="sm" onClick={handlePlayPause} className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    {isPlaying ? "Pause" : "Start"}
                  </Button>
                </div>
              </div>
              <div className="w-full min-h-[280px] h-[400px] max-h-[50vh] rounded-lg bg-background border border-border overflow-hidden">
                <SimulationCanvas
                  trajectory={result.trajectory}
                  currentStep={currentStep}
                  objectName={params.objectName}
                  isProjectile={params.motionType === "projectile" || params.motionType === "inclinedProjectile"}
                  isCircular={params.motionType === "circular"}
                  isInclined={params.motionType === "inclined"}
                  isInclinedProjectile={params.motionType === "inclinedProjectile"}
                  inclineAngle={params.inclineAngle}
                />
              </div>
            </div>
            <div className="space-y-6">
              <ParameterSliders
                initialVelocity={params.initialVelocity}
                angle={params.angle}
                acceleration={params.acceleration}
                gravity={params.gravity}
                initialHeight={params.initialHeight}
                isProjectile={params.motionType === "projectile"}
                isCircular={params.motionType === "circular"}
                isVerticalMotion={params.isVerticalMotion}
                isFriction={params.motionType === "friction"}
                isInclined={params.motionType === "inclined"}
                isInclinedProjectile={params.motionType === "inclinedProjectile"}
                radius={params.radius}
                angularVelocity={params.angularVelocity}
                mass={params.mass}
                coefficientOfFriction={params.coefficientOfFriction}
                inclineAngle={params.inclineAngle}
                launchAngleRelativeToIncline={params.launchAngleRelativeToIncline}
                onChange={handleParamChange}
              />
              <ResultsPanel
                displacement={result.displacement}
                time={result.time}
                maxHeight={result.maxHeight}
                range={result.range}
                angularVelocity={result.angularVelocity}
                centripetalAcceleration={result.centripetalAcceleration}
                centripetalForce={result.centripetalForce}
                isCircular={params.motionType === "circular"}
                frictionForce={result.frictionForce}
                frictionAcceleration={result.frictionAcceleration}
                timeToStop={result.timeToStop}
                isFriction={params.motionType === "friction"}
                normalForce={result.normalForce}
                netAccelerationAlongIncline={result.netAccelerationAlongIncline}
                inclineFrictionForce={result.inclineFrictionForce}
                isInclined={params.motionType === "inclined"}
                isConstantVelocity={result.isConstantVelocity}
              />
              <EquationsPanel
                equations={result.equationsUsed}
                isProjectile={params.motionType === "projectile"}
                isCircular={params.motionType === "circular"}
                isFriction={params.motionType === "friction"}
                isInclined={params.motionType === "inclined"}
                isInclinedProjectile={params.motionType === "inclinedProjectile"}
              />
            </div>
          </div>
        )}

        {/* Fluid: simulation or calculation-only */}
        {showFluidResults && (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
            {showFluidSim ? (
              <>
                <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5 w-full overflow-hidden">
                  <h3 className="font-semibold text-foreground text-lg mb-2">Simulation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {fluidParams.problemType === "floatingBody"
                      ? "Floating Body"
                      : fluidParams.problemType === "continuity"
                        ? "Continuity (Pipe Flow)"
                        : fluidParams.problemType === "effluxTank"
                          ? "Efflux from Tank"
                          : fluidParams.problemType === "hydraulicLift"
                            ? "Hydraulic Lift"
                            : "Water Jet Projectile"}
                  </p>
                  <div className="w-full min-h-[280px] h-[400px] max-h-[50vh] rounded-lg bg-background border border-border overflow-hidden">
                    <FluidCanvas params={fluidParams} result={fluidResult} />
                  </div>
                </div>
                <div className="space-y-6">
                  <FluidParameterPanel params={fluidParams} onChange={handleFluidParamChange} />
                  <FluidResultsPanel result={fluidResult} />
                  <EquationsPanel equations={fluidResult.equationsUsed} isProjectile={false} />
                </div>
              </>
            ) : (
              <div className="lg:col-span-3 flex flex-col md:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-semibold text-foreground text-lg mb-2">Calculation Results</h3>
                    <p className="text-sm text-muted-foreground mb-4">No simulation — numeric result only.</p>
                  </div>
                </div>
                <div className="space-y-6 w-full md:max-w-sm">
                  <FluidParameterPanel params={fluidParams} onChange={handleFluidParamChange} />
                  <FluidResultsPanel result={fluidResult} />
                  <EquationsPanel equations={fluidResult.equationsUsed} isProjectile={false} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wave optics: simulation or calculation-only */}
        {showWaveResults && (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
            {showWaveSim ? (
              <>
                <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5 w-full overflow-hidden">
                  <h3 className="font-semibold text-foreground text-lg mb-2">Simulation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {waveParams.problemType === "wavePropagation"
                      ? "Wave Propagation"
                      : waveParams.problemType === "doubleSlit"
                        ? "Double-Slit Interference"
                        : waveParams.problemType === "singleSlitDiffraction"
                          ? "Single-Slit Diffraction"
                          : waveParams.problemType === "reflection"
                            ? "Reflection from Mirror"
                            : "Refraction at Boundary"}
                  </p>
                  <div className="w-full min-h-[280px] h-[400px] max-h-[50vh] rounded-lg bg-background border border-border overflow-hidden">
                    <WaveOpticsCanvas params={waveParams} result={waveResult} />
                  </div>
                </div>
                <div className="space-y-6">
                  <WaveOpticsParameterPanel params={waveParams} onChange={handleWaveParamChange} />
                  <WaveOpticsResultsPanel result={waveResult} />
                  <EquationsPanel equations={waveResult.equationsUsed} isProjectile={false} />
                </div>
              </>
            ) : (
              <div className="lg:col-span-3 flex flex-col md:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <div className="bg-card rounded-lg border border-border p-5">
                    <h3 className="font-semibold text-foreground text-lg mb-2">Calculation Results</h3>
                    <p className="text-sm text-muted-foreground mb-4">No simulation — numeric result only.</p>
                  </div>
                </div>
                <div className="space-y-6 w-full md:max-w-sm">
                  <WaveOpticsParameterPanel params={waveParams} onChange={handleWaveParamChange} />
                  <WaveOpticsResultsPanel result={waveResult} />
                  <EquationsPanel equations={waveResult.equationsUsed} isProjectile={false} />
                </div>
              </div>
            )}
          </div>
        )}

        {!showKinematicsSim && !showFluidResults && !showWaveResults && (
          <div className="bg-card rounded-lg border border-border p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Play size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Simulate</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {section === "kinematics"
                ? "Enter a kinematics problem above and click \"Generate Simulation\" to see the motion visualized."
                : section === "fluid"
                  ? "Enter a fluid dynamics problem above and click \"Generate Simulation\" to see the simulation."
                  : "Enter a wave optics problem above and click \"Generate Simulation\" to see the visualization."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
