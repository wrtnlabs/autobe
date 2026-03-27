"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";

/* ═══════════════════════════════════════════════════════
   AutoBE Benchmark Leaderboard
   Design ref: LiveBench heatmap + Artificial Analysis clean layout
   ═══════════════════════════════════════════════════════ */

const FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/* ── Grade & Score helpers ── */

const GRADE_CONFIG = {
  A: { bg: "#dcfce7", fg: "#15803d" },
  B: { bg: "#dbeafe", fg: "#1d4ed8" },
  C: { bg: "#fef9c3", fg: "#a16207" },
  D: { bg: "#ffedd5", fg: "#c2410c" },
  F: { bg: "#fee2e2", fg: "#b91c1c" },
};

function getGrade(s) {
  if (s >= 90) return "A";
  if (s >= 80) return "B";
  if (s >= 70) return "C";
  if (s >= 60) return "D";
  return "F";
}

/** LiveBench-style heatmap: continuous color based on score 0-100 */
function heatmap(score) {
  if (score == null) return { bg: "transparent", fg: "#475569" };
  if (score >= 85) return { bg: "rgba(22,163,74,0.22)", fg: "#4ade80" };
  if (score >= 75) return { bg: "rgba(34,197,94,0.15)", fg: "#86efac" };
  if (score >= 65) return { bg: "rgba(234,179,8,0.15)", fg: "#fde047" };
  if (score >= 55) return { bg: "rgba(249,115,22,0.14)", fg: "#fdba74" };
  if (score >= 40) return { bg: "rgba(239,68,68,0.12)", fg: "#fca5a5" };
  return { bg: "rgba(239,68,68,0.18)", fg: "#f87171" };
}

const PHASE_META = [
  { key: "documentQuality",      label: "Documentation",  w: 5  },
  { key: "requirementsCoverage",  label: "Requirements",   w: 25 },
  { key: "testCoverage",          label: "Test Coverage",  w: 25 },
  { key: "logicCompleteness",     label: "Logic",          w: 35 },
  { key: "apiCompleteness",       label: "API",            w: 10 },
];

/* ── Tiny components ── */

function GradePill({ grade, large }) {
  const c = GRADE_CONFIG[grade] || GRADE_CONFIG.F;
  return (
    <span
      style={{
        display: "inline-block",
        padding: large ? "3px 10px" : "1px 7px",
        borderRadius: "4px",
        fontSize: large ? "14px" : "11px",
        fontWeight: 700,
        lineHeight: large ? "22px" : "18px",
        background: c.bg,
        color: c.fg,
        fontFamily: FONT,
        letterSpacing: "0.3px",
      }}
    >
      {grade}
    </span>
  );
}

function Rank({ n }) {
  return (
    <span style={{ fontSize: "13px", fontWeight: 600, color: "#94a3b8", fontVariantNumeric: "tabular-nums", fontFamily: FONT }}>
      {n}
    </span>
  );
}

/* ── Helpers ── */

function fmtDuration(ms) {
  if (ms == null || ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontFamily: FONT }}>
      {children}
    </div>
  );
}

/* ── Expanded Detail Row (inline under table row) ── */

function ExpandedDetail({ entries, projects, onSelectEntry }) {
  const cols = projects.filter((p) => entries.find((e) => e.project === p));

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, gap: "12px", padding: "20px 24px", fontFamily: FONT }}>
      {cols.map((p) => {
        const entry = entries.find((e) => e.project === p);
        if (!entry) return null;
        const phases = entry.phases || {};
        const meta = entry.meta || {};
        const h = heatmap(entry.totalScore);

        return (
          <div key={p} style={{ background: "#0f172a", borderRadius: "8px", border: "1px solid #334155", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
            onClick={() => onSelectEntry && onSelectEntry(entry)}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#475569"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; }}
          >
            {/* Project header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.5px" }}>{entry.project}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: h.fg, fontVariantNumeric: "tabular-nums" }}>{entry.totalScore}</span>
                <GradePill grade={entry.grade} />
              </div>
            </div>

            {/* Meta info bar */}
            {(meta.totalDurationMs || meta.evaluatedFiles) && (
              <div style={{ display: "flex", gap: "16px", padding: "8px 16px", fontSize: "11px", color: "#64748b", borderBottom: "1px solid #1e293b", background: "#0d1425" }}>
                {meta.totalDurationMs != null && (
                  <span>Eval time: <span style={{ color: "#94a3b8", fontWeight: 600 }}>{fmtDuration(meta.totalDurationMs)}</span></span>
                )}
                {meta.evaluatedFiles != null && (
                  <span>Files: <span style={{ color: "#94a3b8", fontWeight: 600 }}>{meta.evaluatedFiles}</span></span>
                )}
                {meta.evaluatedAt && (
                  <span>{new Date(meta.evaluatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
              </div>
            )}

            {/* Gate */}
            {phases.gate && (
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b", background: phases.gate.passed ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                  <span style={{ color: "#94a3b8" }}>Compilation Gate</span>
                  <span style={{ fontWeight: 700, color: phases.gate.passed ? "#4ade80" : "#f87171" }}>
                    {phases.gate.passed ? "PASS" : "FAIL"}
                    <span style={{ fontWeight: 500, color: "#64748b", marginLeft: "4px" }}>{phases.gate.score}/{phases.gate.maxScore}</span>
                  </span>
                </div>
                {/* Gate metrics */}
                {phases.gate.metrics && (
                  <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "10px", color: "#64748b", flexWrap: "wrap" }}>
                    {phases.gate.metrics.totalFiles != null && <span>Files: {phases.gate.metrics.totalFiles}</span>}
                    {phases.gate.metrics.filesWithErrors != null && (
                      <span style={{ color: phases.gate.metrics.filesWithErrors > 0 ? "#fdba74" : "#64748b" }}>
                        Errors: {phases.gate.metrics.filesWithErrors}
                      </span>
                    )}
                    {phases.gate.typeErrorCount != null && phases.gate.typeErrorCount > 0 && (
                      <span style={{ color: "#f87171" }}>TS Errors: {phases.gate.typeErrorCount}</span>
                    )}
                    {phases.gate.typeWarningCount != null && phases.gate.typeWarningCount > 0 && (
                      <span style={{ color: "#fdba74" }}>Warnings: {phases.gate.typeWarningCount}</span>
                    )}
                    {phases.gate.durationMs != null && <span>Duration: {fmtDuration(phases.gate.durationMs)}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Phase scores with duration */}
            <div style={{ padding: "12px 16px" }}>
              <SectionLabel>Evaluation Phases</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {PHASE_META.map(({ key, label, w }) => {
                  const phase = phases[key];
                  if (!phase) return null;
                  const pct = phase.maxScore > 0 ? (phase.score / phase.maxScore) * 100 : 0;
                  const ph = heatmap(phase.score);
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "85px", fontSize: "11px", color: "#94a3b8", fontWeight: 500, flexShrink: 0 }}>
                        {label}
                      </div>
                      <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "#1e293b" }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "2px", background: ph.fg, opacity: 0.7, transition: "width 0.3s" }} />
                      </div>
                      <span style={{ width: "28px", textAlign: "right", fontSize: "12px", fontWeight: 700, color: ph.fg, fontVariantNumeric: "tabular-nums" }}>
                        {phase.score}
                      </span>
                      <span style={{ width: "40px", textAlign: "right", fontSize: "10px", color: "#475569", fontVariantNumeric: "tabular-nums" }}>
                        {fmtDuration(phase.durationMs)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pipeline phases (waterfall timeline) */}
            {entry.pipeline?.phases && (() => {
              const pp = entry.pipeline.phases;
              const phaseNames = ["analyze", "database", "interface", "test", "realize"];
              const phaseColors = { analyze: "#818cf8", database: "#34d399", interface: "#fbbf24", test: "#f472b6", realize: "#60a5fa" };
              const maxDur = Math.max(...phaseNames.map(n => pp[n]?.durationMs || 0), 1);
              const totalDur = phaseNames.reduce((s, n) => s + (pp[n]?.durationMs || 0), 0);
              const hasAny = phaseNames.some(n => pp[n]?.completed);
              if (!hasAny) return null;
              return (
                <div style={{ padding: "10px 16px", borderTop: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <SectionLabel>Pipeline Phases</SectionLabel>
                    <span style={{ fontSize: "10px", color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                      Total: {fmtDuration(totalDur)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {phaseNames.map(name => {
                      const p = pp[name];
                      if (!p) return null;
                      const dur = p.durationMs || 0;
                      const pct = maxDur > 0 ? (dur / maxDur) * 100 : 0;
                      const color = phaseColors[name];
                      const detail = p.detail;
                      let detailText = "";
                      if (name === "analyze" && detail) {
                        detailText = `${(detail.actors || []).length} actors, ${(detail.documents || []).length} docs`;
                      } else if (name === "database" && detail) {
                        detailText = `${detail.totalModels || 0} models, ${detail.totalEnums || 0} enums`;
                      } else if (name === "interface" && detail) {
                        detailText = `${(detail.operations || []).length} APIs`;
                      } else if (name === "test" && detail) {
                        detailText = `${(detail.functions || []).length} tests`;
                      } else if (name === "realize" && detail) {
                        detailText = `${(detail.functions || []).length} impls`;
                        if (detail.compileResult) {
                          detailText += detail.compileResult.success ? " ✓" : ` ✗ ${(detail.compileResult.errors || []).length} errors`;
                        }
                      }
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "60px", fontSize: "10px", color: color, fontWeight: 600, textTransform: "capitalize", flexShrink: 0 }}>
                            {name}
                          </div>
                          <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#1e293b", position: "relative" }}>
                            <div style={{ width: `${Math.max(pct, 2)}%`, height: "100%", borderRadius: "3px", background: color, opacity: p.completed ? 0.7 : 0.2, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ width: "50px", textAlign: "right", fontSize: "10px", color: "#94a3b8", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                            {fmtDuration(dur)}
                          </span>
                          {detailText && (
                            <span style={{ width: "110px", textAlign: "right", fontSize: "9px", color: "#64748b", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {detailText}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Penalties */}
            {entry.penalties && (entry.penalties.duplication || entry.penalties.jsdoc) && (
              <div style={{ padding: "8px 16px", borderTop: "1px solid #1e293b", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {entry.penalties.duplication && (
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(251,146,60,0.12)", color: "#fdba74", fontWeight: 600 }}>
                    −{entry.penalties.duplication.amount}pt dup ({entry.penalties.duplication.blocks} blocks)
                  </span>
                )}
                {entry.penalties.jsdoc && (
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(251,146,60,0.12)", color: "#fdba74", fontWeight: 600 }}>
                    −{entry.penalties.jsdoc.amount}pt JSDoc ({entry.penalties.jsdoc.ratio})
                  </span>
                )}
              </div>
            )}

            {/* Gate issue breakdown (top 5) */}
            {phases.gate?.issuesByCode?.length > 0 && (
              <div style={{ padding: "8px 16px", borderTop: "1px solid #1e293b" }}>
                <SectionLabel>Compiler Issues</SectionLabel>
                {phases.gate.issuesByCode.slice(0, 5).map((issue, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 0", fontSize: "11px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: issue.severity === "critical" ? "#f87171" : issue.severity === "warning" ? "#fdba74" : "#475569",
                        flexShrink: 0,
                      }} />
                      <span style={{ color: "#cbd5e1", fontWeight: 600, fontFamily: "monospace", fontSize: "10px" }}>
                        {issue.code}
                      </span>
                    </div>
                    <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>×{issue.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {entry.summary && (
              <div style={{ padding: "8px 16px", borderTop: "1px solid #1e293b", display: "flex", gap: "12px", fontSize: "10px", color: "#64748b" }}>
                {entry.summary.criticalCount > 0 && <span style={{ color: "#f87171" }}>{entry.summary.criticalCount} critical</span>}
                {entry.summary.warningCount > 0 && <span style={{ color: "#fdba74" }}>{entry.summary.warningCount} warnings</span>}
                {entry.summary.suggestionCount > 0 && <span>{entry.summary.suggestionCount} suggestions</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Score Detail Modal ── */

const METRIC_LABELS = {
  hasDocsFolder: "Docs Folder", hasReadme: "README", docFileCount: "Doc Files", totalDocLength: "Total Doc Length",
  controllerCount: "Controllers", providerCount: "Providers", structureCount: "Structures",
  requirementsDocCount: "Req Docs", hasRequirementsDocs: "Has Req Docs",
  mappedControllers: "Mapped Controllers", unmappedControllers: "Unmapped Controllers", mappingRatio: "Mapping Ratio",
  testCount: "Tests", totalRoutes: "Total Routes", coveredRoutes: "Covered Routes",
  routeCoveragePercent: "Route Coverage %", stubTests: "Stub Tests", assertionTests: "Assertion Tests",
  controllersAnalyzed: "Controllers Analyzed", runtimeVerified: "Runtime Verified",
  definedMethods: "Defined Methods", testedMethods: "Tested Methods", routeAnalysis: "Route Analysis",
  totalIncomplete: "Incomplete", criticalCount: "Critical", warningCount: "Warnings",
  todoCount: "TODOs", fixmeCount: "FIXMEs", emptyMethods: "Empty Methods", emptyCatch: "Empty Catch",
  totalEndpoints: "Endpoints", emptyEndpoints: "Empty", stubEndpoints: "Stubs",
  implementedEndpoints: "Implemented", noProviderEndpoints: "No Provider",
  passthroughEndpoints: "Passthrough", completionRate: "Completion %", implementationRate: "Implementation %",
  totalFiles: "Total Files", filesWithErrors: "Files w/ Errors", errorRatio: "Error Ratio",
  penalty: "Penalty", typeCriticalCount: "TS Critical", typeWarningCount: "TS Warnings",
  prismaCriticalCount: "Prisma Critical", prismaWarningCount: "Prisma Warnings", softPass: "Soft Pass",
  failedAt: "Failed At", reason: "Reason",
};

function formatMetricValue(key, val) {
  if (val === true) return "Yes";
  if (val === false) return "No";
  if (key === "mappingRatio" || key === "errorRatio") return `${(val * 100).toFixed(1)}%`;
  if (key === "totalDocLength" && typeof val === "number") return `${(val / 1024).toFixed(0)}KB`;
  if (typeof val === "number" && val > 1000) return val.toLocaleString();
  return String(val);
}

function ScoreDetailModal({ entry, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const phases = entry.phases || {};
  const meta = entry.meta || {};
  const h = heatmap(entry.totalScore);

  const sectionStyle = { padding: "16px 20px", borderBottom: "1px solid #1e293b" };
  const metricRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: "12px" };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", fontFamily: FONT }}
      onClick={onClose}
    >
      <div
        style={{ width: "min(640px, 92vw)", maxHeight: "88vh", overflowY: "auto", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", background: "#1e293b", borderBottom: "1px solid #334155", borderRadius: "12px 12px 0 0" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{entry.project}</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginTop: "2px" }}>{entry.model}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "32px", fontWeight: 800, color: h.fg, fontVariantNumeric: "tabular-nums" }}>{entry.totalScore}</span>
            <GradePill grade={entry.grade} large />
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: "20px", cursor: "pointer", padding: "4px 8px", marginLeft: "8px" }}>✕</button>
          </div>
        </div>

        {/* Meta bar */}
        <div style={{ display: "flex", gap: "16px", padding: "10px 24px", fontSize: "11px", color: "#64748b", background: "#0d1425", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
          {meta.evaluatedFiles != null && <span>Files: <b style={{ color: "#94a3b8" }}>{meta.evaluatedFiles}</b></span>}
          {meta.totalDurationMs != null && <span>Eval time: <b style={{ color: "#94a3b8" }}>{fmtDuration(meta.totalDurationMs)}</b></span>}
          {meta.evaluatedAt && <span>{new Date(meta.evaluatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
          {entry.summary && (
            <>
              {entry.summary.criticalCount > 0 && <span style={{ color: "#f87171" }}><b>{entry.summary.criticalCount}</b> critical</span>}
              {entry.summary.warningCount > 0 && <span style={{ color: "#fdba74" }}><b>{entry.summary.warningCount}</b> warnings</span>}
              {entry.summary.suggestionCount > 0 && <span><b>{entry.summary.suggestionCount}</b> suggestions</span>}
            </>
          )}
        </div>

        {/* Pipeline Phases Detail */}
        {entry.pipeline?.phases && (() => {
          const pp = entry.pipeline.phases;
          const phaseNames = ["analyze", "database", "interface", "test", "realize"];
          const phaseLabels = { analyze: "Analyze", database: "Database", interface: "Interface", test: "Test", realize: "Realize" };
          const phaseColors = { analyze: "#818cf8", database: "#34d399", interface: "#fbbf24", test: "#f472b6", realize: "#60a5fa" };
          const phaseIcons = { analyze: "🔍", database: "🗄️", interface: "🔌", test: "🧪", realize: "⚙️" };
          const maxDur = Math.max(...phaseNames.map(n => pp[n]?.durationMs || 0), 1);
          const totalDur = phaseNames.reduce((s, n) => s + (pp[n]?.durationMs || 0), 0);
          const totalTokens = entry.pipeline.totalTokens || 0;
          const hasAny = phaseNames.some(n => pp[n]?.completed);
          if (!hasAny) return null;
          return (
            <div style={sectionStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <SectionLabel>Pipeline Phases</SectionLabel>
                <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                  {totalTokens > 0 && <span style={{ color: "#64748b" }}>Tokens: <b style={{ color: "#94a3b8" }}>{totalTokens >= 1e6 ? `${(totalTokens / 1e6).toFixed(1)}M` : totalTokens >= 1e3 ? `${(totalTokens / 1e3).toFixed(0)}K` : totalTokens}</b></span>}
                  <span style={{ color: "#64748b" }}>Total: <b style={{ color: "#94a3b8" }}>{fmtDuration(totalDur)}</b></span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {phaseNames.map(name => {
                  const p = pp[name];
                  if (!p) return null;
                  const dur = p.durationMs || 0;
                  const pct = maxDur > 0 ? (dur / maxDur) * 100 : 0;
                  const color = phaseColors[name];
                  const detail = p.detail;

                  // Build detail items
                  const detailItems = [];
                  if (name === "analyze" && detail) {
                    if (detail.prefix) detailItems.push({ label: "Prefix", value: detail.prefix });
                    detailItems.push({ label: "Actors", value: `${(detail.actors || []).length}` });
                    detailItems.push({ label: "Documents", value: `${(detail.documents || []).length}` });
                  } else if (name === "database" && detail) {
                    detailItems.push({ label: "Models", value: `${detail.totalModels || 0}` });
                    detailItems.push({ label: "Enums", value: `${detail.totalEnums || 0}` });
                    detailItems.push({ label: "Schemas", value: `${(detail.schemas || []).length} files` });
                    detailItems.push({ label: "Compiled", value: detail.compiled ? "✓" : "✗" });
                  } else if (name === "interface" && detail) {
                    detailItems.push({ label: "APIs", value: `${(detail.operations || []).length}` });
                    detailItems.push({ label: "Auth", value: `${(detail.authorizations || []).length}` });
                    if ((detail.missed || []).length > 0) detailItems.push({ label: "Missed", value: `${detail.missed.length}` });
                  } else if (name === "test" && detail) {
                    detailItems.push({ label: "Tests", value: `${(detail.functions || []).length}` });
                    detailItems.push({ label: "Compiled", value: detail.compiled ? "✓" : "✗" });
                  } else if (name === "realize" && detail) {
                    detailItems.push({ label: "Impls", value: `${(detail.functions || []).length}` });
                    if (detail.compileResult) {
                      detailItems.push({ label: "Compiled", value: detail.compileResult.success ? "✓" : `✗ ${(detail.compileResult.errors || []).length}` });
                    }
                  }

                  // Agent metrics
                  const agentMetrics = detail?.agentMetrics;

                  return (
                    <div key={name} style={{ background: "#131b2e", borderRadius: "8px", padding: "10px 14px", border: `1px solid ${color}22` }}>
                      {/* Phase header row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "13px" }}>{phaseIcons[name]}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color, flex: 1 }}>{phaseLabels[name]}</span>
                        <span style={{ fontSize: "11px", color: p.completed ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                          {p.completed ? "Done" : "Failed"}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                          {fmtDuration(dur)}
                        </span>
                      </div>
                      {/* Duration bar */}
                      <div style={{ height: "6px", borderRadius: "3px", background: "#1e293b", marginBottom: detailItems.length > 0 ? "8px" : "0" }}>
                        <div style={{ width: `${Math.max(pct, 2)}%`, height: "100%", borderRadius: "3px", background: color, opacity: 0.6, transition: "width 0.3s" }} />
                      </div>
                      {/* Detail metrics */}
                      {detailItems.length > 0 && (
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: agentMetrics ? "6px" : "0" }}>
                          {detailItems.map((d, i) => (
                            <span key={i} style={{ fontSize: "11px", color: "#64748b" }}>
                              {d.label}: <b style={{ color: d.value === "✗" || d.value.startsWith("✗") ? "#f87171" : d.value === "✓" ? "#4ade80" : "#cbd5e1" }}>{d.value}</b>
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Agent metrics */}
                      {agentMetrics && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px", borderTop: "1px solid #1e293b" }}>
                          {Object.entries(agentMetrics).map(([agentName, m]) => (
                            <span key={agentName} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "#1e293b" }}>
                              <span style={{ color: "#94a3b8" }}>{agentName}</span>
                              <span style={{ color: "#4ade80", marginLeft: "4px" }}>{m.success}</span>
                              {m.failure > 0 && <span style={{ color: "#f87171", marginLeft: "2px" }}>/{m.failure}</span>}
                              <span style={{ color: "#475569", marginLeft: "2px" }}>({m.attempt})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Gate Section */}
        {phases.gate && (
          <div style={{ ...sectionStyle, background: phases.gate.passed ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <SectionLabel>Compilation Gate</SectionLabel>
              <span style={{ fontWeight: 700, fontSize: "13px", color: phases.gate.passed ? "#4ade80" : "#f87171" }}>
                {phases.gate.passed ? "PASS" : "FAIL"} <span style={{ color: "#64748b", fontWeight: 500 }}>{phases.gate.score}/{phases.gate.maxScore}</span>
              </span>
            </div>
            {/* Gate metrics grid */}
            {phases.gate.metrics && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "4px 16px", marginBottom: "10px" }}>
                {Object.entries(phases.gate.metrics).filter(([k]) => k !== "softPass" && k !== "failedAt" && k !== "reason").map(([k, v]) => (
                  <div key={k} style={metricRowStyle}>
                    <span style={{ color: "#64748b" }}>{METRIC_LABELS[k] || k}</span>
                    <span style={{ color: v > 0 && (k.includes("Critical") || k.includes("Error") || k === "filesWithErrors") ? "#f87171" : v > 0 && k.includes("Warning") ? "#fdba74" : "#cbd5e1", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                      {formatMetricValue(k, v)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Gate failed reason */}
            {phases.gate.metrics?.failedAt && (
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "rgba(239,68,68,0.08)", marginBottom: "10px", fontSize: "12px" }}>
                <span style={{ color: "#f87171", fontWeight: 600 }}>Failed at: </span>
                <span style={{ color: "#fca5a5" }}>{phases.gate.metrics.failedAt}</span>
                {phases.gate.metrics.reason && <div style={{ color: "#94a3b8", marginTop: "4px" }}>{phases.gate.metrics.reason}</div>}
              </div>
            )}
            {/* All gate issues */}
            {phases.gate.issuesByCode?.length > 0 && (
              <div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Compiler Issues ({phases.gate.issuesByCode.reduce((s, i) => s + i.count, 0)} total)
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {phases.gate.issuesByCode.map((issue, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "4px 0", fontSize: "11px", borderBottom: "1px solid #0f172a" }}>
                      <span style={{
                        display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", marginTop: "4px", flexShrink: 0,
                        background: issue.severity === "critical" ? "#f87171" : issue.severity === "warning" ? "#fdba74" : "#475569",
                      }} />
                      <span style={{ color: "#cbd5e1", fontWeight: 700, fontFamily: "monospace", fontSize: "10px", minWidth: "60px", flexShrink: 0 }}>{issue.code}</span>
                      <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>x{issue.count}</span>
                      <span style={{ color: "#94a3b8", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scoring Phases */}
        <div style={sectionStyle}>
          <SectionLabel>Scoring Phases</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {PHASE_META.map(({ key, label, w }) => {
              const phase = phases[key];
              if (!phase) return null;
              const pct = phase.maxScore > 0 ? (phase.score / phase.maxScore) * 100 : 0;
              const ph = heatmap(phase.score);
              const metrics = phase.metrics || {};
              const visibleMetrics = Object.entries(metrics).filter(([k]) => k !== "cached" && k !== "originalDurationMs");
              return (
                <div key={key} style={{ background: "#131b2e", borderRadius: "8px", padding: "12px 14px", border: "1px solid #1e293b" }}>
                  {/* Phase header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1", flex: 1 }}>{label}</span>
                    <span style={{ fontSize: "10px", color: "#64748b" }}>w:{w}%</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: ph.fg, fontVariantNumeric: "tabular-nums" }}>{phase.score}</span>
                    <span style={{ fontSize: "10px", color: "#475569" }}>/{phase.maxScore}</span>
                    {phase.durationMs > 0 && <span style={{ fontSize: "10px", color: "#475569" }}>{fmtDuration(phase.durationMs)}</span>}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: "4px", borderRadius: "2px", background: "#1e293b", marginBottom: visibleMetrics.length > 0 ? "10px" : "0" }}>
                    <div style={{ width: `${pct}%`, height: "100%", borderRadius: "2px", background: ph.fg, opacity: 0.7 }} />
                  </div>
                  {/* Metrics */}
                  {visibleMetrics.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "2px 16px" }}>
                      {visibleMetrics.map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
                          <span style={{ color: "#64748b" }}>{METRIC_LABELS[k] || k}</span>
                          <span style={{ color: (k === "criticalCount" || k === "totalIncomplete") && v > 0 ? "#f87171" : k === "warningCount" && v > 0 ? "#fdba74" : "#cbd5e1", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                            {formatMetricValue(k, v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Explanation */}
                  {phase.explanation?.reasons?.length > 0 && (
                    <div style={{ marginTop: "8px", padding: "8px 10px", borderRadius: "6px", background: "rgba(239,68,68,0.06)" }}>
                      {phase.explanation.reasons.map((r, i) => (
                        <div key={i} style={{ fontSize: "11px", color: "#fca5a5", padding: "1px 0" }}>{r}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Penalties */}
        {entry.penalties && (entry.penalties.duplication || entry.penalties.jsdoc) && (
          <div style={sectionStyle}>
            <SectionLabel>Penalties</SectionLabel>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {entry.penalties.duplication && (
                <div style={{ padding: "8px 14px", borderRadius: "6px", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fdba74" }}>-{entry.penalties.duplication.amount}pt</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>Duplication ({entry.penalties.duplication.blocks} blocks)</div>
                </div>
              )}
              {entry.penalties.jsdoc && (
                <div style={{ padding: "8px 14px", borderRadius: "6px", background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.15)" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#fdba74" }}>-{entry.penalties.jsdoc.amount}pt</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>JSDoc ({entry.penalties.jsdoc.missing} missing, {entry.penalties.jsdoc.ratio} coverage)</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reference Data */}
        {entry.reference && (
          <div style={{ ...sectionStyle, borderBottom: "none" }}>
            <SectionLabel>Reference Data</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "4px 16px" }}>
              {entry.reference.complexity && (
                <>
                  <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Functions</span><span style={{ color: "#cbd5e1", fontWeight: 600 }}>{entry.reference.complexity.totalFunctions}</span></div>
                  <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Complex Fns</span><span style={{ color: entry.reference.complexity.complexFunctions > 0 ? "#fdba74" : "#cbd5e1", fontWeight: 600 }}>{entry.reference.complexity.complexFunctions}</span></div>
                  <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Max Complexity</span><span style={{ color: "#cbd5e1", fontWeight: 600 }}>{entry.reference.complexity.maxComplexity}</span></div>
                </>
              )}
              {entry.reference.duplication && (
                <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Dup Blocks</span><span style={{ color: entry.reference.duplication.totalBlocks > 50 ? "#fdba74" : "#cbd5e1", fontWeight: 600 }}>{entry.reference.duplication.totalBlocks}</span></div>
              )}
              {entry.reference.naming && (
                <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Naming Issues</span><span style={{ color: entry.reference.naming.totalIssues > 0 ? "#fdba74" : "#cbd5e1", fontWeight: 600 }}>{entry.reference.naming.totalIssues}</span></div>
              )}
              {entry.reference.jsdoc && (
                <div style={metricRowStyle}><span style={{ color: "#64748b" }}>JSDoc Missing</span><span style={{ color: "#cbd5e1", fontWeight: 600 }}>{entry.reference.jsdoc.totalMissing}</span></div>
              )}
              {entry.reference.schemaSync && (
                <>
                  <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Schema Types</span><span style={{ color: "#cbd5e1", fontWeight: 600 }}>{entry.reference.schemaSync.totalTypes}</span></div>
                  <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Empty Types</span><span style={{ color: entry.reference.schemaSync.emptyTypes > 0 ? "#f87171" : "#cbd5e1", fontWeight: 600 }}>{entry.reference.schemaSync.emptyTypes}</span></div>
                  <div style={metricRowStyle}><span style={{ color: "#64748b" }}>Mismatched Props</span><span style={{ color: entry.reference.schemaSync.mismatchedProperties > 0 ? "#fdba74" : "#cbd5e1", fontWeight: 600 }}>{entry.reference.schemaSync.mismatchedProperties}</span></div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Leaderboard Table ── */

function LeaderboardTable({ entries, models, projects, allEntries }) {
  const [expanded, setExpanded] = useState(new Set());
  const [modalEntry, setModalEntry] = useState(null);

  const lookup = {};
  for (const e of entries) {
    if (!lookup[e.model]) lookup[e.model] = {};
    lookup[e.model][e.project] = e;
  }
  const rows = models.filter((m) => projects.some((p) => lookup[m]?.[p]));

  /* Also build a full lookup for expanded detail (unfiltered by project) */
  const fullLookup = {};
  for (const e of allEntries) {
    if (!fullLookup[e.model]) fullLookup[e.model] = {};
    fullLookup[e.model][e.project] = e;
  }

  const thBase = {
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: "#1e293b",
    padding: "14px 18px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.6px",
    textTransform: "uppercase",
    borderBottom: "2px solid #334155",
    fontFamily: FONT,
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ borderRadius: "10px", border: "1px solid #334155", overflow: "hidden", background: "#0f172a" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "480px" }}>
          <thead>
            <tr>
              <th style={{ ...thBase, width: "40px", textAlign: "center", paddingLeft: "10px", paddingRight: "4px" }}>#</th>
              <th style={{ ...thBase, textAlign: "left", minWidth: "120px" }}>Model</th>
              {projects.map((p) => (
                <th key={p} style={{ ...thBase, textAlign: "center", minWidth: "70px" }}>{p}</th>
              ))}
              <th
                style={{
                  ...thBase,
                  textAlign: "center",
                  minWidth: "70px",
                  borderLeft: "2px solid #334155",
                  background: "#172033",
                  color: "#cbd5e1",
                }}
              >
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((model, i) => {
              const scores = projects.map((p) => lookup[model]?.[p]?.totalScore).filter((s) => s != null);
              const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
              const stripe = i % 2 === 0 ? "#0f172a" : "#131b2e";
              const isExpanded = expanded.has(model);

              const modelEntries = projects.map((p) => fullLookup[model]?.[p]).filter(Boolean);

              return (
                <Fragment key={model}>
                  <tr
                    style={{ background: isExpanded ? "#1e293b" : stripe, transition: "background 0.1s", cursor: "pointer" }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "#1e293b"; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = stripe; }}
                    onClick={() => setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(model)) next.delete(model);
                      else next.add(model);
                      return next;
                    })}
                  >
                    {/* Rank */}
                    <td style={{ padding: "16px 8px 16px 16px", textAlign: "center", borderBottom: "1px solid #1e293b" }}>
                      <Rank n={i + 1} />
                    </td>

                    {/* Model name + expand indicator */}
                    <td style={{ padding: "16px 18px", borderBottom: "1px solid #1e293b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#64748b", transition: "transform 0.2s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", fontFamily: FONT }}>{model}</span>
                      </div>
                    </td>

                    {/* Project scores — heatmap cells */}
                    {projects.map((p) => {
                      const entry = lookup[model]?.[p];
                      const h = entry ? heatmap(entry.totalScore) : { bg: "transparent", fg: "#334155" };
                      return (
                        <td
                          key={p}
                          style={{
                            textAlign: "center",
                            padding: "16px 12px",
                            borderBottom: "1px solid #1e293b",
                            background: h.bg,
                          }}
                        >
                          {entry ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 700, color: h.fg, fontVariantNumeric: "tabular-nums", fontFamily: FONT }}>
                                {entry.totalScore}
                              </span>
                              <GradePill grade={entry.grade} />
                            </div>
                          ) : (
                            <span style={{ color: "#334155", fontSize: "14px" }}>—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Average */}
                    {(() => {
                      const h = avg != null ? heatmap(avg) : { bg: "transparent", fg: "#334155" };
                      return (
                        <td
                          style={{
                            textAlign: "center",
                            padding: "16px 12px",
                            borderBottom: "1px solid #1e293b",
                            borderLeft: "2px solid #1e293b",
                            background: h.bg,
                          }}
                        >
                          {avg != null ? (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "15px", fontWeight: 700, color: h.fg, fontVariantNumeric: "tabular-nums", fontFamily: FONT }}>
                                {avg}
                              </span>
                              <GradePill grade={getGrade(avg)} />
                            </div>
                          ) : (
                            <span style={{ color: "#334155" }}>—</span>
                          )}
                        </td>
                      );
                    })()}
                  </tr>

                  {/* Expanded detail row */}
                  {isExpanded && modelEntries.length > 0 && (
                    <tr>
                      <td colSpan={projects.length + 3} style={{ padding: 0, borderBottom: "2px solid #334155", background: "#0c1322" }}>
                        <ExpandedDetail entries={modelEntries} projects={projects} onSelectEntry={setModalEntry} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {modalEntry && <ScoreDetailModal entry={modalEntry} onClose={() => setModalEntry(null)} />}
    </div>
  );
}

/* ── Detail Card ── */

function DetailCard({ entry }) {
  const phases = entry.phases || {};
  const gc = GRADE_CONFIG[entry.grade] || GRADE_CONFIG.F;
  const h = heatmap(entry.totalScore);

  return (
    <div style={{ background: "#0f172a", borderRadius: "10px", border: "1px solid #334155", overflow: "hidden", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>{entry.model}</div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{entry.project}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "28px", fontWeight: 800, color: h.fg, fontVariantNumeric: "tabular-nums" }}>{entry.totalScore}</span>
          <GradePill grade={entry.grade} large />
        </div>
      </div>

      {/* Gate */}
      {phases.gate && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", fontSize: "13px", borderBottom: "1px solid #1e293b", background: phases.gate.passed ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)" }}>
          <span style={{ color: "#94a3b8", fontWeight: 500 }}>Compilation Gate</span>
          <span style={{ fontWeight: 700, color: phases.gate.passed ? "#4ade80" : "#f87171" }}>
            {phases.gate.passed ? "PASS" : "FAIL"}
            <span style={{ fontWeight: 500, color: "#64748b", marginLeft: "6px" }}>{phases.gate.score}/{phases.gate.maxScore}</span>
          </span>
        </div>
      )}

      {/* Phase bars */}
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {PHASE_META.map(({ key, label, w }) => {
          const phase = phases[key];
          if (!phase) return null;
          const pct = phase.maxScore > 0 ? (phase.score / phase.maxScore) * 100 : 0;
          const ph = heatmap(phase.score);
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "110px", fontSize: "12px", color: "#94a3b8", fontWeight: 500, flexShrink: 0 }}>
                {label} <span style={{ color: "#475569" }}>{w}%</span>
              </div>
              <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#1e293b" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: ph.fg, opacity: 0.7, transition: "width 0.3s" }} />
              </div>
              <span style={{ width: "30px", textAlign: "right", fontSize: "13px", fontWeight: 700, color: ph.fg, fontVariantNumeric: "tabular-nums" }}>
                {phase.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Penalties */}
      {entry.penalties && (entry.penalties.duplication || entry.penalties.jsdoc) && (
        <div style={{ padding: "10px 20px", borderTop: "1px solid #1e293b", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {entry.penalties.duplication && (
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(251,146,60,0.12)", color: "#fdba74", fontWeight: 600 }}>
              −{entry.penalties.duplication.amount}pt duplication
            </span>
          )}
          {entry.penalties.jsdoc && (
            <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", background: "rgba(251,146,60,0.12)", color: "#fdba74", fontWeight: 600 }}>
              −{entry.penalties.jsdoc.amount}pt JSDoc
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main ── */

export function BenchmarkDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("leaderboard");
  const [filters, setFilters] = useState({ model: "", project: "", grade: "" });
  const lastJson = useRef("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/benchmark/benchmark-summary.json?t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      if (text !== lastJson.current) {
        lastJson.current = text;
        setData(JSON.parse(text));
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: FONT }}>
        <span style={{ color: "#64748b", fontSize: "14px" }}>Loading benchmark data…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "12px", fontFamily: FONT }}>
        <span style={{ color: "#f87171", fontSize: "14px" }}>Failed to load benchmark data: {error}</span>
        <button onClick={load} style={{ padding: "8px 20px", borderRadius: "6px", border: "1px solid #334155", background: "#1e293b", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#cbd5e1", fontFamily: FONT }}>Retry</button>
      </div>
    );
  }

  const filtered = data.entries.filter((e) => {
    if (filters.model && e.model !== filters.model) return false;
    if (filters.project && e.project !== filters.project) return false;
    if (filters.grade && e.grade !== filters.grade) return false;
    return true;
  });

  const modelAvgs = {};
  for (const e of data.entries) {
    if (!modelAvgs[e.model]) modelAvgs[e.model] = { sum: 0, count: 0 };
    modelAvgs[e.model].sum += e.totalScore;
    modelAvgs[e.model].count += 1;
  }
  const sortedModels = [...data.models].sort((a, b) => {
    const aa = modelAvgs[a] ? modelAvgs[a].sum / modelAvgs[a].count : 0;
    const bb = modelAvgs[b] ? modelAvgs[b].sum / modelAvgs[b].count : 0;
    return bb - aa;
  });

  const allScores = data.entries.map((e) => e.totalScore).filter((s) => s != null);
  const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const best = allScores.length ? Math.max(...allScores) : 0;
  const pass = data.entries.length ? Math.round((data.entries.filter((e) => e.grade !== "F").length / data.entries.length) * 100) : 0;

  /* Tab button style */
  const tabBtn = (active) => ({
    padding: "8px 20px",
    border: "none",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: FONT,
    cursor: "pointer",
    background: active ? "#3b82f6" : "#1e293b",
    color: active ? "#fff" : "#94a3b8",
    transition: "all 0.15s",
  });

  const selectStyle = {
    padding: "7px 12px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#1e293b",
    fontSize: "13px",
    fontWeight: 500,
    color: "#cbd5e1",
    cursor: "pointer",
    outline: "none",
    fontFamily: FONT,
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px 80px", fontFamily: FONT, color: "#e2e8f0", lineHeight: 1.5 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "32px", paddingBottom: "24px", borderBottom: "1px solid #334155" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "#f8fafc", letterSpacing: "-0.3px" }}>
            Benchmark Leaderboard
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: "6px 0 0" }}>
            Multi-model evaluation across {data.projects.length} projects · Updated{" "}
            {new Date(data.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
          {[
            { v: data.entries.length, l: "Runs" },
            { v: avg, l: "Avg Score" },
            { v: best, l: "Best", color: "#4ade80" },
            { v: `${pass}%`, l: "Pass Rate" },
          ].map((k) => (
            <div key={k.l} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <span style={{ fontSize: "22px", fontWeight: 700, color: k.color || "#f1f5f9", fontVariantNumeric: "tabular-nums" }}>{k.v}</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "inline-flex", borderRadius: "8px", overflow: "hidden", border: "1px solid #334155" }}>
          <button style={tabBtn(view === "leaderboard")} onClick={() => setView("leaderboard")}>Leaderboard</button>
          <button style={tabBtn(view === "detail")} onClick={() => setView("detail")}>Detail Cards</button>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select value={filters.model} onChange={(e) => setFilters((f) => ({ ...f, model: e.target.value }))} style={selectStyle}>
            <option value="">All Models</option>
            {data.models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filters.project} onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))} style={selectStyle}>
            <option value="">All Projects</option>
            {data.projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.grade} onChange={(e) => setFilters((f) => ({ ...f, grade: e.target.value }))} style={selectStyle}>
            <option value="">All Grades</option>
            {["A", "B", "C", "D", "F"].map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div style={{ background: "#0f172a", borderRadius: "10px", border: "1px solid #334155", padding: "48px", textAlign: "center" }}>
          <span style={{ color: "#64748b", fontSize: "14px" }}>No results match the current filters.</span>
        </div>
      ) : view === "leaderboard" ? (
        <LeaderboardTable
          entries={filtered}
          allEntries={data.entries}
          models={filters.model ? [filters.model] : sortedModels}
          projects={filters.project ? [filters.project] : data.projects}
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "14px" }}>
          {filtered.sort((a, b) => b.totalScore - a.totalScore).map((e) => (
            <DetailCard key={`${e.model}-${e.project}`} entry={e} />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: "40px", paddingTop: "16px", borderTop: "1px solid #1e293b", fontSize: "12px", color: "#475569", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", fontFamily: FONT }}>
        <span>Scoring: Doc 5% · Req 25% · Test 25% · Logic 35% · API 10%</span>
        <span>Auto-refreshes every 30s</span>
      </div>
    </div>
  );
}
