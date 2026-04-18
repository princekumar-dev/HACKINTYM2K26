import { useEffect, useState } from "react";
import { useSimStore } from "@/store/simStore";

export default function Header() {
  const nodes = useSimStore((s) => s.nodes);
  const monitor = useSimStore((s) => s.monitor);
  const [time, setTime] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const critical = nodes.filter((n) => n.status === "critical").length;
  const warning = nodes.filter((n) => n.status === "warning").length;
  const state =
    critical > 0
      ? { label: "DEGRADED", color: "text-bio-coral", dot: "bg-bio-coral" }
      : warning > 0
      ? { label: "ADAPTING", color: "text-bio-amber", dot: "bg-bio-amber" }
      : { label: "HOMEOSTASIS", color: "text-bio-green", dot: "bg-bio-green" };

  return (
    <header className="flex-none h-14 border-b border-white/5 flex items-center justify-between px-6 bg-surface-1/40 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className={`size-2 rounded-full ${state.dot} shadow-[0_0_10px_currentColor] ${state.color}`} />
        <h1 className="text-sm font-medium tracking-widest uppercase text-foreground/90">
          Nereus <span className="text-muted-foreground">// Self-Healing App Twin</span>
        </h1>
      </div>
      <div className="flex items-center gap-6 text-xs font-mono text-muted-foreground">
        {monitor && (
          <>
            <div className="flex gap-2 items-center">
              <span className="text-bio-cyan/50">TARGET</span>
              <span>{monitor.host}:{monitor.frontendPort}/{monitor.backendPort}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
          </>
        )}
        <div className="flex gap-2 items-center">
          <span className="text-bio-cyan/50">GLOBAL_STATE</span>
          <span className={state.color}>{state.label}</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div>EPOCH: {Math.floor(time / 1000)}</div>
      </div>
    </header>
  );
}
