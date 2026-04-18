import { useSimStore } from "@/store/simStore";

export default function SimulationResultsPanel() {
  const simulationSummary = useSimStore((s) => s.simulationSummary);
  const nodes = useSimStore((s) => s.nodes);
  const simulationRunning = useSimStore((s) => s.simulationRunning);
  const activeSimulationRunId = useSimStore((s) => s.activeSimulationRunId);
  const setActiveSimulationRunId = useSimStore((s) => s.setActiveSimulationRunId);

  if (!simulationSummary && !simulationRunning) {
    return (
      <div className="panel p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Simulation Results</h2>
          <span className="font-mono text-[10px] text-bio-cyan/70">REPORT</span>
        </div>
        <p className="text-sm text-foreground/65 leading-relaxed">
          Run the stress matrix to see separate crash reports, failover timing, and how dummy users are shifted to the backup server while real users stay on the main server.
        </p>
      </div>
    );
  }

  const likelyCrashNode = nodes.find((node) => node.id === simulationSummary?.likelyCrashNodeId);

  return (
    <div className="panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Simulation Results</h2>
        <span className="font-mono text-[10px] text-bio-cyan/70">
          {simulationRunning ? "RUNNING" : "REPORT"}
        </span>
      </div>

      {simulationSummary && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <SummaryMetric label="Scenarios" value={`${simulationSummary.totalRuns}`} />
            <SummaryMetric label="Crashes" value={`${simulationSummary.crashedRuns}`} />
            <SummaryMetric
              label="Crash Result"
              value={simulationSummary.crashThresholdTraffic ? "Crash Predicted" : "No Crash"}
            />
            <SummaryMetric
              label="Crash At"
              value={
                simulationSummary.crashThresholdTraffic
                  ? `${simulationSummary.crashThresholdTraffic} req`
                  : "Stable"
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <SummaryMetric label="Resilience" value={`${simulationSummary.averageResilience}/100`} />
            <SummaryMetric
              label="Crash Stress"
              value={
                simulationSummary.crashThresholdStressLevel
                  ? `${simulationSummary.crashThresholdStressLevel}%`
                  : "No crash"
              }
            />
          </div>

          <div className="rounded-xl border border-white/5 bg-surface-2 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-foreground/85">Global Verdict</span>
              <span className="font-mono text-[10px] text-bio-amber">
                {likelyCrashNode ? likelyCrashNode.label : "Watching all tiers"}
              </span>
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-foreground/70">
              {simulationSummary.recommendation}
            </div>
          </div>

          <div className="grid gap-3">
            {simulationSummary.runs.map((run) => (
              <button
                key={run.id}
                onClick={() => setActiveSimulationRunId(run.id)}
                className={`rounded-xl border bg-surface-2 p-3 text-left transition-colors ${
                  activeSimulationRunId === run.id
                    ? "border-bio-cyan/40 shadow-[0_0_0_1px_rgba(0,240,255,0.25)]"
                    : "border-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-foreground/85">{run.scenarioTitle}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      run.predictedCrash
                        ? "text-bio-coral"
                        : run.recoverable
                        ? "text-bio-green"
                        : "text-bio-amber"
                    }`}
                  >
                    {run.predictedCrash ? "CRASH RISK" : run.recoverable ? "RECOVERABLE" : "AT RISK"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <SummaryMetric label="Stress" value={`${run.intensity}%`} compact />
                  <SummaryMetric
                    label="Crash Result"
                    value={run.predictedCrash ? "Crash" : run.recoverable ? "Recoverable" : "No hard crash"}
                    compact
                  />
                  <SummaryMetric
                    label="ML Crash"
                    value={run.crashProbability !== undefined ? `${Math.round(run.crashProbability * 100)}%` : "n/a"}
                    compact
                  />
                  <SummaryMetric
                    label="Crash Point"
                    value={run.predictedCrash ? `${run.predictedFailureStressLevel ?? run.intensity}% / ${run.predictedFailureRequestCount ?? "n/a"} req` : "No crash"}
                    compact
                  />
                </div>

                <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <SummaryMetric
                    label="Crash Stress"
                    value={run.predictedCrash ? `${run.predictedFailureStressLevel ?? run.intensity}%` : "None"}
                    compact
                  />
                  <SummaryMetric
                    label="Failover"
                    value={run.failoverTriggeredAt ? `${run.failoverTriggeredAt} req` : "Not needed"}
                    compact
                  />
                  <SummaryMetric
                    label="Real Users"
                    value={`${run.realUsersKeptOnPrimary ?? 0}`}
                    compact
                  />
                  <SummaryMetric
                    label="Dummy Users"
                    value={`${run.dummyUsersShiftedToBackup ?? 0} to backup`}
                    compact
                  />
                  <SummaryMetric
                    label="Real Ratio"
                    value={run.realUserRatio !== undefined ? `${Math.round(run.realUserRatio * 100)}%` : "n/a"}
                    compact
                  />
                  <SummaryMetric
                    label="Dummy Ratio"
                    value={run.dummyUserRatio !== undefined ? `${Math.round(run.dummyUserRatio * 100)}%` : "n/a"}
                    compact
                  />
                  <SummaryMetric
                    label="Primary Share"
                    value={run.primaryTrafficShare !== undefined ? `${Math.round(run.primaryTrafficShare * 100)}%` : "n/a"}
                    compact
                  />
                  <SummaryMetric
                    label="Backup Share"
                    value={run.backupTrafficShare !== undefined ? `${Math.round(run.backupTrafficShare * 100)}%` : "n/a"}
                    compact
                  />
                </div>

                <div className="mt-3 text-[11px] leading-relaxed text-foreground/70">{run.summary}</div>
                {run.rerouteFix && (
                  <div className="mt-2 text-[11px] leading-relaxed text-bio-cyan/80">
                    Fix: {run.rerouteFix}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-4 text-[10px] font-mono text-foreground/55">
                  <span>Backup: {run.backupServerUrl ?? "n/a"}</span>
                  <span>Dropped Dummy: {run.droppedDummyUsers ?? 0}</span>
                  <span>Real to Backup: {run.realUsersShiftedToBackup ?? 0}</span>
                  <span>Throughput After: {run.throughputAfter}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-white/5 bg-black/10 ${compact ? "p-2" : "p-3"}`}>
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-foreground/85 ${compact ? "text-xs" : "text-sm"}`}>{value}</div>
    </div>
  );
}
