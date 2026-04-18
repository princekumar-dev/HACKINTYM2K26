import { useEffect } from "react";
import Header from "@/components/dashboard/Header";
import NetworkGraph3D from "@/components/dashboard/NetworkGraph3D";
import MetricsPanel from "@/components/dashboard/MetricsPanel";
import ControlPanel from "@/components/dashboard/ControlPanel";
import LogsPanel from "@/components/dashboard/LogsPanel";
import MonitorPanel from "@/components/dashboard/MonitorPanel";
import { useSimStore } from "@/store/simStore";

const Index = () => {
  const tick = useSimStore((s) => s.tick);
  const monitor = useSimStore((s) => s.monitor);
  const checkMonitor = useSimStore((s) => s.checkMonitor);

  useEffect(() => {
    const i = setInterval(tick, 1200);
    return () => clearInterval(i);
  }, [tick]);

  useEffect(() => {
    if (!monitor) return;
    const i = setInterval(() => void checkMonitor(), 8000);
    return () => clearInterval(i);
  }, [monitor, checkMonitor]);

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-bio-cyan/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <aside className="col-span-3 flex flex-col gap-4 min-h-0 overflow-y-auto">
          <MonitorPanel />
          <MetricsPanel />
        </aside>

        <section className="col-span-6 panel relative overflow-hidden flex flex-col">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-bio-cyan animate-pulse" />
            <span className="font-mono text-[10px] text-bio-cyan uppercase tracking-widest">Topology Matrix</span>
          </div>
          <div className="absolute top-4 right-4 z-10 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            Drag / Scroll / Click nodes
          </div>
          <div className="flex-1">
            <NetworkGraph3D />
          </div>
        </section>

        <aside className="col-span-3 flex flex-col gap-4 min-h-0">
          <ControlPanel />
          <LogsPanel />
        </aside>
      </main>
    </div>
  );
};

export default Index;
