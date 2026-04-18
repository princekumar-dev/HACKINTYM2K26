import { useSimStore } from "@/store/simStore";

export default function MetricsPanel() {
  const nodes = useSimStore((s) => s.nodes);
  const totalRps = useSimStore((s) => s.totalRps);
  const selectedId = useSimStore((s) => s.selectedNodeId);
  const monitor = useSimStore((s) => s.monitor);
  const predictedFailureId = useSimStore((s) => s.predictedFailureId);
  const simulationSummary = useSimStore((s) => s.simulationSummary);
  const selected = nodes.find((n) => n.id === selectedId);
  const predicted = nodes.find((n) => n.id === predictedFailureId);
  const likelyCrashNode = nodes.find((n) => n.id === simulationSummary?.likelyCrashNodeId);

  const avgLatency = nodes.reduce((s, n) => s + n.latency, 0) / nodes.length;
  const healthy = nodes.filter((n) => n.status === "healthy").length;
  const warning = nodes.filter((n) => n.status === "warning").length;
  const critical = nodes.filter((n) => n.status === "critical").length;
  const healing = nodes.filter((n) => n.status === "healing").length;

  return (
    <div className="panel p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Vital Signs</h2>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-bio-green animate-pulse" />
          <span className="font-mono text-[10px] text-bio-green">LIVE</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Synaptic Latency (avg)</div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-light tabular-nums">{avgLatency.toFixed(1)}</span>
          <span className="text-bio-cyan/70 text-xs font-mono">ms</span>
        </div>
        <div className="mt-3 h-8 flex items-end gap-[3px]">
          {nodes.map((n, i) => {
            const h = Math.min(100, (n.latency / 300) * 100);
            const c = n.status === "critical" ? "bg-bio-coral" : n.status === "warning" ? "bg-bio-amber" : n.status === "healing" ? "bg-bio-cyan" : "bg-bio-green";
            return <div key={i} className={`flex-1 ${c} rounded-t-sm transition-all`} style={{ height: `${Math.max(8, h)}%` }} />;
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Throughput</div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-light tabular-nums">{totalRps.toLocaleString()}</span>
          <span className="text-muted-foreground text-xs font-mono">req/s</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat color="bio-green" label="OK" value={healthy} />
        <Stat color="bio-amber" label="WARN" value={warning} />
        <Stat color="bio-coral" label="CRIT" value={critical} />
        <Stat color="bio-cyan" label="HEAL" value={healing} />
      </div>

      {monitor && (
        <div className="bg-surface-2 rounded-lg p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Prediction</span>
            <span className="font-mono text-[10px] text-bio-cyan">{monitor.predictedFailureWindow}</span>
          </div>
          <div className="mt-2 text-sm text-foreground/85">
            {predicted ? `${predicted.label} is the current highest-risk node.` : monitor.summary}
          </div>
          {simulationSummary && (
            <div className="mt-2 text-[11px] text-foreground/65 leading-relaxed">
              {likelyCrashNode
                ? `Stress simulator says ${likelyCrashNode.label} is the most likely crash point.`
                : simulationSummary.recommendation}
            </div>
          )}
        </div>
      )}

      {simulationSummary && (
        <div className="bg-surface-2 rounded-lg p-3 border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Crash Readiness</span>
            <span className="font-mono text-[10px] text-bio-amber">
              {simulationSummary.averageResilience}/100
            </span>
          </div>
          <div className="mt-2 text-sm text-foreground/85">
            {simulationSummary.crashThresholdTraffic
              ? `Predicted first crash near ${simulationSummary.crashThresholdTraffic} concurrent-request pressure in the multi-case simulation.`
              : "No crash predicted in the current multi-case matrix."}
          </div>
        </div>
      )}

      {selected && (
        <div className="bg-surface-2 rounded-lg p-3 border border-white/5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs">{selected.label}</span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{selected.role}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <Mini label="CPU" value={`${selected.cpu.toFixed(0)}%`} />
            <Mini label="Lat" value={`${selected.latency.toFixed(0)}ms`} />
            <Mini label="Load" value={`${selected.load.toFixed(0)}%`} />
            <Mini label="Err" value={`${selected.errors}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="bg-surface-2 rounded-lg p-2 border border-white/5 text-center">
      <div className={`font-mono text-lg tabular-nums text-${color}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/90">{value}</span>
    </div>
  );
}
