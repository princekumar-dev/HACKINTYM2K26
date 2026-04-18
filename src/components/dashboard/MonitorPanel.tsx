import { useState } from "react";
import { useSimStore } from "@/store/simStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MonitorPanel() {
  const monitor = useSimStore((s) => s.monitor);
  const analyzeDeployment = useSimStore((s) => s.analyzeDeployment);
  const checkMonitor = useSimStore((s) => s.checkMonitor);
  const healingDecisions = useSimStore((s) => s.healingDecisions);
  const [host, setHost] = useState("localhost");
  const [frontendPort, setFrontendPort] = useState("8000");
  const [backendPort, setBackendPort] = useState("8001");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const frontend = Number(frontendPort);
    const backend = Number(backendPort);
    if (Number.isNaN(frontend) || Number.isNaN(backend)) return;
    void analyzeDeployment({ host, frontendPort: frontend, backendPort: backend });
  };

  const statusColor =
    monitor?.status === "ok"
      ? "text-bio-green"
      : monitor?.status === "slow"
      ? "text-bio-amber"
      : monitor?.status === "down"
      ? "text-bio-coral"
      : "text-muted-foreground";
  const modeLabel = monitor?.mode === "offline" ? "offline" : "live";

  return (
    <div className="panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">App Twin Scanner</h2>
        <span className="font-mono text-[10px] text-bio-cyan/70">PORT MAP</span>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <Input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="localhost"
          className="bg-surface-2 border-white/5 font-mono text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={frontendPort}
            onChange={(e) => setFrontendPort(e.target.value)}
            placeholder="Frontend port"
            className="bg-surface-2 border-white/5 font-mono text-xs"
          />
          <Input
            value={backendPort}
            onChange={(e) => setBackendPort(e.target.value)}
            placeholder="Backend port"
            className="bg-surface-2 border-white/5 font-mono text-xs"
          />
        </div>
        <Button type="submit" variant="secondary" className="font-mono text-xs">
          Scan Deployment
        </Button>
      </form>

      {monitor && (
        <div className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] text-foreground/80 truncate">{monitor.frontendUrl}</span>
            <span className={`font-mono text-[11px] uppercase ${statusColor}`}>{monitor.status}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>{modeLabel} scan</span>
            <span>auto re-scan: 8s</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Overall" value={`${monitor.overallScore}`} accent="text-bio-cyan" />
            <MetricCard label="Frontend" value={`${monitor.frontendScore}`} accent="text-bio-green" />
            <MetricCard label="Backend" value={`${monitor.backendScore}`} accent="text-bio-amber" />
          </div>

          <div className="bg-surface-2 rounded-lg p-3 border border-white/5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">AI Summary</div>
            <p className="text-xs text-foreground/80 mt-2 leading-relaxed">{monitor.summary}</p>
            <div className={`mt-2 font-mono text-[10px] ${monitor.mode === "offline" ? "text-bio-coral/90" : "text-bio-cyan/80"}`}>
              Risk window: {monitor.predictedFailureWindow ?? "watching"}
            </div>
          </div>

          <div className="bg-surface-2 rounded-lg p-3 border border-white/5">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Explainable Decisions</div>
            <div className="mt-2 flex flex-col gap-2">
              {healingDecisions.slice(0, 3).map((decision) => (
                <div key={decision} className="text-[11px] text-foreground/75 leading-relaxed">
                  {decision}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => void checkMonitor()}
            variant="ghost"
            className="font-mono text-[10px] uppercase tracking-widest text-bio-cyan hover:text-bio-cyan hover:bg-bio-cyan/5"
          >
            Re-scan
          </Button>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-surface-2 rounded-lg p-2.5 border border-white/5">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-mono text-lg mt-1 ${accent}`}>{value}</div>
    </div>
  );
}
