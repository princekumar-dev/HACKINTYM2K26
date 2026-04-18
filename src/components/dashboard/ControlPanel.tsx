import { useSimStore } from "@/store/simStore";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function ControlPanel() {
  const trafficLevel = useSimStore((s) => s.trafficLevel);
  const setTraffic = useSimStore((s) => s.setTraffic);
  const nodes = useSimStore((s) => s.nodes);
  const inject = useSimStore((s) => s.injectFailure);
  const triggerRandom = useSimStore((s) => s.triggerRandomFailure);
  const failureScenarios = useSimStore((s) => s.failureScenarios);
  const runScenario = useSimStore((s) => s.runScenario);
  const routingStrategy = useSimStore((s) => s.routingStrategy);
  const simulationRunning = useSimStore((s) => s.simulationRunning);
  const runStressSimulation = useSimStore((s) => s.runStressSimulation);

  return (
    <div className="panel p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Tactical Directives</h2>
        <span className="font-mono text-[10px] text-bio-coral/70">CTRL</span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Traffic Injection</span>
          <span className="font-mono text-xs text-bio-cyan tabular-nums">{trafficLevel}%</span>
        </div>
        <Slider
          value={[trafficLevel]}
          onValueChange={(v) => setTraffic(v[0])}
          min={0}
          max={100}
          step={1}
          className="[&_[role=slider]]:bg-bio-cyan [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-[0_0_12px_hsl(var(--bio-cyan))]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Failure Injection</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const t = nodes.find((n) => n.role !== "gateway" && n.status !== "critical");
              if (t) inject("kill", t.id);
            }}
            className="font-mono text-[10px] uppercase border-bio-coral/30 text-bio-coral hover:bg-bio-coral/10 hover:text-bio-coral hover:border-bio-coral/60 bg-transparent"
          >
            Kill
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const t = nodes.find((n) => n.role !== "gateway" && n.status === "healthy");
              if (t) inject("slow", t.id);
            }}
            className="font-mono text-[10px] uppercase border-bio-amber/30 text-bio-amber hover:bg-bio-amber/10 hover:text-bio-amber hover:border-bio-amber/60 bg-transparent"
          >
            Slow
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const t = nodes.find((n) => n.status === "healthy");
              if (t) inject("overload", t.id);
            }}
            className="font-mono text-[10px] uppercase border-bio-cyan/30 text-bio-cyan hover:bg-bio-cyan/10 hover:text-bio-cyan hover:border-bio-cyan/60 bg-transparent"
          >
            Overload
          </Button>
        </div>
        <Button
          onClick={triggerRandom}
          variant="outline"
          className="font-mono text-[10px] uppercase border-white/10 text-foreground/80 hover:bg-surface-2 bg-transparent mt-1"
        >
          Random Chaos
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scenario Injection</span>
        <div className="flex flex-col gap-2">
          {failureScenarios.slice(0, 5).map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => runScenario(scenario.id)}
              className="rounded-xl border border-white/8 bg-surface-2 px-3 py-2 text-left transition-colors hover:border-bio-cyan/40 hover:bg-bio-cyan/5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-foreground/85">{scenario.title}</span>
                <span className="font-mono text-[10px] text-bio-amber">{scenario.failureProbability}%</span>
              </div>
              <div className="mt-1 text-[10px] text-foreground/55 leading-relaxed">{scenario.outcome}</div>
            </button>
          ))}
        </div>
        <Button
          onClick={() => void runStressSimulation()}
          variant="outline"
          className="font-mono text-[10px] uppercase border-bio-cyan/30 text-bio-cyan hover:bg-bio-cyan/10 hover:text-bio-cyan bg-transparent"
        >
          {simulationRunning ? "Running..." : "Run Stress Matrix"}
        </Button>
      </div>

      {routingStrategy && (
        <div className="rounded-xl border border-white/5 bg-surface-2 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Routing Logic</div>
          <div className="mt-2 text-[11px] leading-relaxed text-foreground/70">{routingStrategy}</div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 pt-2 border-t border-white/5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Node Roster</span>
        <div className="grid grid-cols-2 gap-1">
          {nodes.map((n) => (
            <div key={n.id} className="flex items-center gap-2 font-mono text-[10px] py-0.5">
              <div
                className={`size-1.5 rounded-full ${
                  n.status === "critical"
                    ? "bg-bio-coral animate-pulse"
                    : n.status === "warning"
                    ? "bg-bio-amber"
                    : n.status === "healing"
                    ? "bg-bio-cyan animate-pulse"
                    : "bg-bio-green"
                }`}
              />
              <span className="text-foreground/70">{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
