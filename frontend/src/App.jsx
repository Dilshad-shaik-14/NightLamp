import { useState, useEffect, useMemo } from "react";
import "./index.css";
import LineWaves from './LineWaves';
import Shuffle from './Shuffle';

const SCAN_MESSAGES = [
  "INITIALIZING SECURE LINK...",
  "PINGING TARGET ENDPOINT...",
  "FETCHING REPOSITORY METADATA...",
  "PARSING LOG SIGNATURES...",
  "RUNNING GEMINI NEURAL DIAGNOSTICS...",
  "GENERATING FINAL HEALTH REPORT...",
];

const STATUS_MAP = {
  green: { color: "var(--status-healthy)", label: "CONFIRMED HEALTHY" },
  yellow: { color: "var(--status-warning)", label: "PREDICTED FAILURE (30D)" },
  red: { color: "var(--status-critical)", label: "ACTIVE FAILURE" },
};

function LandingPage({ onStart }) {
  return (
    <div style={{
      height: '100vh', width: '100vw', position: 'relative',
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000'
    }}>
      <LineWaves
        speed={0.3}
        innerLineCount={32}
        outerLineCount={36}
        warpIntensity={1}
        rotation={-45}
        edgeFadeWidth={0}
        colorCycleSpeed={1}
        brightness={0.2}
        color1="#ffffff"
        color2="#ffffff"
        color3="#ffffff"
        enableMouseInteraction
        mouseInfluence={2}
      />

      <div className="animate-fade-in" style={{ 
        position: 'relative', zIndex: 1, textAlign: 'center',
        padding: 'var(--space-xl)', maxWidth: '1200px', width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        {/* Pixel Art Container Border */}
        <div style={{
          position: 'relative', padding: 'var(--space-xl)'
        }}>
          <div style={{ marginBottom: "var(--space-md)", width: '100%', overflow: 'hidden' }}>
            <Shuffle
              text="NIGHTLAMP"
              shuffleDirection="right"
              duration={1.2}
              animationMode="evenodd"
              shuffleTimes={4}
              ease="steps(4)"
              stagger={0.08}
              textAlign="center"
              className="brand-shuffle"
              colorFrom="var(--accent-nightlamp)"
              colorTo="var(--accent-nightlamp)"
              style={{
                fontFamily: "'Jersey 25', sans-serif",
                fontSize: "clamp(60px, 15vw, 180px)",
                letterSpacing: "0.05em",
                fontWeight: 400,
                lineHeight: 0.9,
                whiteSpace: 'nowrap',
              }}
            />
          </div>

          <div style={{
            fontFamily: "var(--font-terminal)",
            fontSize: "20px",
            color: "#fff", // High visibility white
            margin: "0 0 var(--space-xl)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            letterSpacing: "6px",
            textTransform: "uppercase",
            textShadow: "0 0 10px rgba(255,255,255,0.2)"
          }}>
            <span style={{ color: "var(--accent-nightlamp)" }}>--</span>
            <span className="cursor-blink">SHINING LIGHT ON SILENT FAILURES</span>
            <span style={{ color: "var(--accent-nightlamp)" }}>--</span>
          </div>

          <button
            onClick={onStart}
            className="premium-button"
          >
            INITIATE_DIAGNOSTICS
          </button>
        </div>
      </div>
    </div>
  );
}

function TerminalLoading({ message }) {
  return (
    <div className="animate-fade-in" style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh",
      background: "var(--bg-primary)", position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: "var(--accent-nightlamp)", boxShadow: "0 0 20px var(--accent-nightlamp)",
        animation: "scanner-line 3s linear infinite", opacity: 0.3, zIndex: 10
      }} />

      <div className="glass-panel" style={{
        padding: "var(--space-xl)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center",
        maxWidth: "500px", width: "90%",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 20px var(--accent-nightlamp-dim)"
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "var(--space-lg)", color: "var(--accent-nightlamp)", opacity: 0.8 }}>
          Nightlamp Neural Core
        </div>

        <div className="cursor-blink" style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--text-primary)", letterSpacing: "1px", marginBottom: "var(--space-xl)" }}>
          {message}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-sm)" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              width: "20px", height: "6px",
              background: "var(--accent-nightlamp)",
              borderRadius: "2px",
              opacity: 0.2,
              animation: `blink 0.8s ${i * 0.1}s infinite alternate`
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="glass-panel" style={{ color: "var(--status-critical)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-md)", background: "var(--status-critical-bg)", padding: "var(--space-md)" }}>
      <div style={{ fontWeight: "bold", fontFamily: "var(--font-display)", fontSize: "12px" }}>SYSTEM_ERROR</div>
      <div style={{ fontSize: "13px" }}>{error}</div>
      <button onClick={onRetry} style={{ background: "transparent", color: "var(--status-critical)", border: "1px solid var(--status-critical)", marginTop: "10px", padding: "4px 8px", cursor: "pointer" }}>RETRY</button>
    </div>
  );
}

function IssueCard({ module, index }) {
  const [expanded, setExpanded] = useState(module.status !== "green");
  const [copied, setCopied] = useState(false);
  const status = STATUS_MAP[module.status] || STATUS_MAP.green;

  const copyFix = (e) => {
    e.stopPropagation();
    const text = (module.fix_steps || []).join("\n") + (module.code_patch ? "\n\n" + module.code_patch : "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="animate-slide-up"
      style={{
        animationDelay: `${index * 0.1}s`,
        marginBottom: "var(--space-md)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "4px 4px 0px #000, -1px -1px 0px rgba(255,255,255,0.1)",
        overflow: "hidden",
        borderLeft: `4px solid ${status.color}`
      }}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "var(--space-lg)", cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
          <div style={{ 
            fontFamily: "var(--font-terminal)", fontSize: "14px", 
            color: status.color, border: `1px solid ${status.color}`,
            padding: "2px 8px", textTransform: "uppercase"
          }}>
            {status.label}
          </div>
          <div>
            <div style={{ fontFamily: "'Jersey 10', sans-serif", fontSize: "24px", color: "var(--text-primary)" }}>
              {module.name}
            </div>
          </div>
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--font-terminal)" }}>
          {expanded ? "[ COLLAPSE ]" : "[ EXPAND ]"}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 var(--space-lg) var(--space-lg)", animation: "fade-in 0.3s ease" }}>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", marginBottom: "var(--space-lg)" }} />
          
          <div style={{ marginBottom: "var(--space-xl)" }}>
            <h4 style={{ margin: "0 0 var(--space-sm)", color: "var(--accent-nightlamp)", fontSize: "16px", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "1px" }}>{">"} {module.headline}</h4>
            <p style={{ color: "var(--text-primary)", fontSize: "15px", fontFamily: "var(--font-mono)", lineHeight: 1.6, margin: 0, opacity: 0.9 }}>
              {module.explanation}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-xl)" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "var(--space-md)", textTransform: "uppercase", letterSpacing: "2px" }}>
                RESOLUTION_PROTOCOL
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {(module.fix_steps || []).map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "var(--space-md)", fontSize: "14px", color: "var(--text-primary)", fontFamily: "var(--font-mono)", background: "rgba(255,255,255,0.03)", padding: "10px", borderLeft: "2px solid rgba(255,255,255,0.1)" }}>
                    <span style={{ color: "var(--accent-nightlamp)", opacity: 0.5 }}>{`${i + 1}.`}</span>
                    <span style={{ lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {module.code_patch && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
                  <div style={{ fontFamily: "var(--font-terminal)", fontSize: "12px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "2px" }}>
                    Patch_Payload
                  </div>
                  <button 
                    onClick={copyFix}
                    style={{ 
                      background: "transparent", 
                      border: `1px solid ${copied ? "var(--status-healthy)" : "rgba(255,255,255,0.1)"}`, 
                      color: copied ? "var(--status-healthy)" : "var(--text-muted)", 
                      fontSize: "10px", fontFamily: "var(--font-terminal)", 
                      padding: "2px 8px", cursor: "pointer"
                    }}
                  >
                    {copied ? "COPIED" : "[ COPY ]"}
                  </button>
                </div>
                <pre style={{ 
                  margin: 0, padding: "var(--space-md)", 
                  background: "#000", border: "1px solid rgba(255,255,255,0.05)",
                  color: "#aaa", fontFamily: "var(--font-mono)", fontSize: "12px",
                  overflowX: "auto"
                }}>
                  {module.code_patch}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportDashboard({ report, onReset }) {
  const isCritical = report.overall_status === "critical";
  const overallColor = isCritical ? "var(--status-critical)" : report.overall_status === "warning" ? "var(--status-warning)" : "var(--status-healthy)";
  
  const reportId = useMemo(() => Math.random().toString(36).substr(2, 6).toUpperCase(), []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1000px", margin: "0 auto", padding: "var(--space-xl) var(--space-md)" }}>
      <header style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "flex-end", 
        marginBottom: "var(--space-xl)", borderBottom: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: "var(--space-lg)"
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-terminal)", color: "var(--accent-nightlamp)", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>
            {">"} SCAN_RESULTS_LOADED // ID_{reportId}
          </div>
          <h1 style={{ margin: 0, fontSize: "48px", fontFamily: "'Jersey 10', sans-serif", color: "var(--text-primary)", lineHeight: 1 }}>
            {report.app_name}
          </h1>
        </div>
        <button onClick={onReset} className="premium-button" style={{ padding: "10px 20px", fontSize: "12px" }}>
          NEW_SCAN
        </button>
      </header>

      <div style={{ 
        display: "flex", gap: "var(--space-xl)", marginBottom: "var(--space-xl)",
        background: "rgba(255,255,255,0.02)", padding: "var(--space-lg)",
        boxShadow: "4px 4px 0px #000"
      }}>
        <div style={{ 
          width: "60px", height: "60px", border: `2px solid ${overallColor}`, 
          display: "flex", alignItems: "center", justifyContent: "center", 
          fontSize: "24px", color: overallColor, fontFamily: "var(--font-terminal)" 
        }}>
          {isCritical ? "!!!" : report.overall_status === "warning" ? "???" : "OK"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: overallColor, textTransform: "uppercase", marginBottom: "8px", letterSpacing: "1px" }}>
            SYSTEM_INTEGRITY_STATUS: {
              report.overall_status === 'critical' ? 'ACTIVE_FAILURE' :
              report.overall_status === 'warning' ? 'PREDICTED_FAILURE_30D' :
              'CONFIRMED_HEALTHY'
            }
          </div>
          <div style={{ fontSize: "16px", color: "var(--text-primary)", fontFamily: "var(--font-mono)", lineHeight: 1.6, opacity: 0.8 }}>
            {report.summary}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        <div style={{ fontFamily: "var(--font-terminal)", fontSize: "12px", color: "rgba(255,255,255,0.2)", marginBottom: "var(--space-sm)", textTransform: "uppercase" }}>
          -- MODULE_ANALYSIS_FEED --
        </div>
        {(report.modules || []).map((module, i) => (
          <IssueCard key={i} module={module} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [url, setUrl] = useState("");
  const [repo, setRepo] = useState("");
  const [logs, setLogs] = useState("");
  const [scanMsg, setScanMsg] = useState(SCAN_MESSAGES[0]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [model, setModel] = useState("gemini-2.5-flash");

  useEffect(() => {
    setError(null);
  }, [screen]);

  useEffect(() => {
    if (screen !== "loading") return;
    const intervals = SCAN_MESSAGES.map((msg, i) =>
      setTimeout(() => setScanMsg(msg), i * 1500)
    );
    return () => intervals.forEach(clearTimeout);
  }, [screen]);

  const runDiagnostic = async () => {
    if (!url && !repo && !logs) return;
    setError(null);
    setScreen("loading");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, repo, logs, model })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ANALYSIS_FAILED");
      setReport(data);
      setScreen("report");
    } catch (err) {
      setError(err.message);
      setScreen("input");
    }
  };

  const handleStart = () => {
    setUrl("");
    setRepo("");
    setLogs("");
    setReport(null);
    setError(null);
    setScreen("input");
  };

  return (
    <div className="animate-fade-in">
      {screen === "landing" && <LandingPage onStart={handleStart} />}

      {screen === "input" && (
        <div className="container-full">
          <div className="hero-side">
            <div style={{ marginBottom: "var(--space-md)" }}>
              <Shuffle
                text="NIGHTLAMP"
                shuffleDirection="right"
                duration={0.8}
                animationMode="evenodd"
                shuffleTimes={4}
                ease="expo.out"
                stagger={0.05}
                textAlign="left"
                className="is-ready"
                colorFrom="var(--accent-nightlamp)"
                colorTo="var(--accent-nightlamp)"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "12px",
                  letterSpacing: "4px",
                  fontWeight: "bold"
                }}
              />
            </div>
            <div className="animate-slide-up">
              <h1 style={{ fontSize: "7vw", lineHeight: 0.9, margin: "var(--space-lg) 0", fontWeight: 700, letterSpacing: "-0.05em" }}>DEBUG<br /><span style={{ color: "var(--text-muted)" }}>YOUR</span><br />REALITY.</h1>
              <p style={{ fontSize: "20px", color: "var(--text-secondary)", maxWidth: "500px", lineHeight: 1.6 }}>Identify structural failures, silent crashes, and schema drifts in seconds.</p>
            </div>
            <div style={{ display: "flex", gap: "var(--space-xl)", fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "2px" }}>
              <div>[ CORE_STATUS: ONLINE ]</div>
              <div>[ ENGINE: {model.toUpperCase()} ]</div>
            </div>
          </div>

          <div className="input-side">
            <div className="glass-panel" style={{ padding: "var(--space-xl)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--accent-nightlamp)", marginBottom: "var(--space-xl)", letterSpacing: "3px", textAlign: "center" }}>ESTABLISH_CONNECTION</div>
              {error && <ErrorState error={error} onRetry={runDiagnostic} />}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>NEURAL_MODEL</label>
                  <select value={model} onChange={e => setModel(e.target.value)}>
                    <option value="gemini-2.5-flash">GEMINI 2.5 FLASH</option>
                    <option value="gemini-2.5-flash-lite">GEMINI 2.5 LITE</option>
                    <option value="gemini-2.0-flash-lite">GEMINI 2.0 LITE</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>LIVE_URL</label>
                  <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://app-endpoint.io" />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>SOURCE_REPO</label>
                  <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="github.com/org/repo" />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>ERROR_DUMP</label>
                  <textarea value={logs} onChange={e => setLogs(e.target.value)} placeholder="Paste logs..." rows={5} />
                </div>
                <button onClick={runDiagnostic} disabled={!url && !repo && !logs} style={{ background: (!url && !repo && !logs) ? "rgba(255,255,255,0.05)" : "var(--accent-nightlamp)", color: "#000", padding: "18px" }}>INITIATE_SCAN_SEQUENCE</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "loading" && <TerminalLoading message={scanMsg} />}
      {screen === "report" && report && <ReportDashboard report={report} onReset={() => setScreen("input")} />}
    </div>
  );
}
