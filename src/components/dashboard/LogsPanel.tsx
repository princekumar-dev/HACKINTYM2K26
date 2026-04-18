
import { useEffect, useRef } from "react";
import { useSimStore, type LogLevel } from "@/store/simStore";

const LEVEL_STYLE: Record<LogLevel, { color: string; bg?: string }> = {
  info: { color: "text-foreground/60" },
  warn: { color: "text-bio-amber" },
  alert: { color: "text-bio-coral", bg: "bg-bio-coral/5 border-bio-coral/20" },
  heal: { color: "text-bio-cyan", bg: "bg-bio-cyan/5 border-bio-cyan/20" },
  ok: { color: "text-bio-green" },
};

const fmt = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0").slice(0, 1)}`;
};

export default function LogsPanel() {
  const logs = useSimStore((s) => s.logs);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [logs]);

  return (
    <div className="panel p-5 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Autonomic Decision Log</h2>
        <div className="px-2 py-0.5 rounded bg-bio-cyan/10 text-bio-cyan font-mono text-[10px] border border-bio-cyan/20">
          AI · LIVE
        </div>
      </div>

      <div ref={ref} className="flex-1 overflow-y-auto pr-2 scroll-fade-mask">
        <div className="flex flex-col gap-2 font-mono text-[11px] leading-relaxed pb-1">
          {logs.map((l) => {
            const s = LEVEL_STYLE[l.level];
            const decorated = s.bg ? `${s.color} ${s.bg} border-l-2 px-2 py-1 rounded` : s.color;
            return (
              <div key={l.id} className={`flex gap-3 animate-log-in ${decorated}`}>
                <span className="text-muted-foreground/60 shrink-0">{fmt(l.ts)}</span>
                <div className="flex flex-col">
                  <span>{l.message}</span>
                  {l.reason && <span className="text-foreground/40 text-[10px] mt-0.5">↳ {l.reason}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
