import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Pause, RotateCcw, Lightbulb } from "lucide-react";
import SimulationCanvas from "@/components/SimulationCanvas";
import ParameterSliders from "@/components/ParameterSliders";
import ResultsPanel from "@/components/ResultsPanel";
import EquationsPanel from "@/components/EquationsPanel";
import {
  PhysicsParams,
  SimulationResult,
  getDefaultParams,
  parsePhysicsProblem,
  solveSimulation,
} from "@/lib/physicsEngine";

const examples = [
  "Car moving at 20 m/s decelerates at 5 m/s²",
  "Ball thrown up at 10 m/s",
  "Stone projected at 20 m/s at 30 degrees",
  "Object dropped from 15 meters",
  "Bike accelerates from rest at 2 m/s² for 5 seconds",
  "Rocket launched at 40 m/s at 60 degrees",
];

export default function Index() {
  const [problemText, setProblemText] = useState("");
  const [params, setParams] = useState<PhysicsParams>(getDefaultParams());
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateSimulation = useCallback((p: PhysicsParams) => {
    const r = solveSimulation(p);
    setResult(r);
    setCurrentStep(0);
    setIsPlaying(false);
    setHasGenerated(true);
  }, []);

  const handleGenerate = () => {
    if (!problemText.trim()) return;
    const parsed = parsePhysicsProblem(problemText);
    const newParams: PhysicsParams = {
      ...getDefaultParams(),
      ...parsed,
      time: parsed.time ?? 5,
    };
    setParams(newParams);
    generateSimulation(newParams);
  };

  const handleParamChange = (key: string, value: number) => {
    const newParams = { ...params, [key]: value };
    setParams(newParams);
    generateSimulation(newParams);
  };

  const handleExample = (text: string) => {
    setProblemText(text);
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !result || result.trajectory.length === 0) return;

    const totalSteps = result.trajectory.length;
    const durationMs = result.time * 300; // speed factor
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
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, result]);

  const handlePlayPause = () => {
    if (!result) return;
    if (currentStep >= result.trajectory.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">PhyVerse</h1>
            <p className="text-sm text-muted-foreground">Interactive motion simulations</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Input Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={18} className="text-warning" />
            <h2 className="font-semibold text-foreground">Describe Your Physics Problem</h2>
          </div>
          <textarea
            value={problemText}
            onChange={e => setProblemText(e.target.value)}
            placeholder="Enter a physics problem... e.g., 'A ball is thrown upward at 15 m/s from a height of 2 meters'"
            className="w-full h-24 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Try:</span>
              {examples.slice(0, 3).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(ex)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
                >
                  Example {i + 1}
                </button>
              ))}
            </div>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles size={16} />
              Generate Simulation
            </Button>
          </div>
        </div>

        {/* Simulation + Controls */}
        {hasGenerated && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas */}
            <div className="lg:col-span-2 bg-card rounded-lg border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Simulation</h3>
                  <p className="text-sm text-muted-foreground">
                    {params.motionType === "projectile" ? "Projectile Motion" : params.isVerticalMotion ? "Vertical Motion" : "Linear Motion"} • {params.objectName}
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
              <div className="w-full h-[400px] rounded-lg bg-background border border-border">
                <SimulationCanvas
                  trajectory={result.trajectory}
                  currentStep={currentStep}
                  objectName={params.objectName}
                  isProjectile={params.motionType === "projectile"}
                />
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              <ParameterSliders
                initialVelocity={params.initialVelocity}
                angle={params.angle}
                acceleration={params.acceleration}
                gravity={params.gravity}
                initialHeight={params.initialHeight}
                isProjectile={params.motionType === "projectile"}
                onChange={handleParamChange}
              />
              <ResultsPanel
                displacement={result.displacement}
                time={result.time}
                maxHeight={result.maxHeight}
                range={result.range}
              />
              <EquationsPanel
                equations={result.equationsUsed}
                isProjectile={params.motionType === "projectile"}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasGenerated && (
          <div className="bg-card rounded-lg border border-border p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Play size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Simulate</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a physics problem above and click "Generate Simulation" to see the motion visualized in real time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
