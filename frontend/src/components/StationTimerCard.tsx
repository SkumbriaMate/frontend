"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, X, Volume2, StopCircle } from "lucide-react";

export interface Session {
  id: string;
  resource_id: string;
  resource_name?: string;
  start_at?: string;
  created_at?: string;
  duration_seconds?: number;
  duration_minutes?: number;
  total_price?: number;
  mode?: string;
}

interface StationTimerCardProps {
  id: string;
  name: string;
  code?: string;
  pricePerHour: number;
  price1v1?: number;
  price2v2?: number;
  pricingMode?: string;
  status?: string;
  initialSession?: Session | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  onStart?: (session: Session) => void;
  onFinish?: (session: Session) => void;
  onOverride?: () => void;
}

type TimerPreset = 0.083 | 30 | 60 | 120 | 180 | "ongoing";

const durationOptions: { label: string; value: TimerPreset }[] = [
  { label: "5წმ", value: 0.083 },
  { label: "30წთ", value: 30 },
  { label: "1სთ", value: 60 },
  { label: "2სთ", value: 120 },
  { label: "3სთ", value: 180 },
  { label: "LIVE", value: "ongoing" },
];

function formatTime(secs: number) {
  if (!isFinite(secs) || secs < 0) secs = 0;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function elapsedFromSession(session: Session): number {
  const timestamp = session.start_at || session.created_at;
  if (!timestamp) return 0;
  const ts = new Date(timestamp).getTime();
  if (isNaN(ts)) return 0;
  return Math.max(0, Math.floor((Date.now() - ts) / 1000));
}

export default function StationTimerCard({
  id, name, code, pricePerHour, price1v1, price2v2,
  pricingMode = "hourly", status = "available",
  initialSession = null, isAdmin = false,
  onStart, onFinish,
}: StationTimerCardProps) {
  const defaultMode = (): "1v1" | "2v2" | "standard" => {
    if (initialSession?.mode === "1v1" || initialSession?.mode === "2v2") return initialSession.mode;
    return pricingMode === "ps_mode" ? "1v1" : "standard";
  };

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => initialSession ? elapsedFromSession(initialSession) : 0);
  const [isRunning, setIsRunning] = useState(() => !!initialSession);
  const [isActive, setIsActive] = useState(() => !!initialSession);
  const [isFinished, setIsFinished] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => initialSession?.id ?? null);
  const [mode, setMode] = useState<"1v1" | "2v2" | "standard">(defaultMode);
  const [selectedDuration, setSelectedDuration] = useState<TimerPreset>(() => {
    if (initialSession) {
      if (initialSession.duration_minutes === null || initialSession.duration_minutes === undefined) return "ongoing";
      return (initialSession.duration_minutes === 0 ? 0.083 : initialSession.duration_minutes) as TimerPreset;
    }
    return "ongoing";
  });

  const activeSessionIdRef = useRef<string | null>(initialSession?.id ?? null);
  const sessionStartAtRef = useRef<string>((initialSession?.start_at || initialSession?.created_at) ?? "");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedElapsedRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedDurationRef = useRef<TimerPreset>(selectedDuration);
  const trackedSessionIdRef = useRef<string | null>(initialSession?.id ?? null);

  useEffect(() => { selectedDurationRef.current = selectedDuration; }, [selectedDuration]);

  const ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3";

  const playAlarm = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(ALARM_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 1;
    }
    audioRef.current.play().catch(() => {});
  }, []);

  const preloadAlarm = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(ALARM_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 1;
    }
    audioRef.current.load();
  }, []);

  const stopAlarm = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);

  useEffect(() => () => { stopAlarm(); }, [stopAlarm]);

  useEffect(() => {
    if (!activeSessionIdRef.current && initialSession?.id) {
      const sid = initialSession.id;
      const startTime = initialSession.start_at || initialSession.created_at;
      activeSessionIdRef.current = sid;
      // Only use server time when loading existing session (e.g. page refresh); if we just created
      // this session, keep our local start time to avoid the timer briefly "starting over"
      const weJustCreatedThis = trackedSessionIdRef.current === sid;
      if (!weJustCreatedThis) {
        sessionStartAtRef.current = startTime || "";
        setElapsedSeconds(elapsedFromSession(initialSession));
      }
      setSessionId(sid);
      setMode((initialSession.mode as "1v1" | "2v2" | "standard" | undefined) ?? (pricingMode === "ps_mode" ? "1v1" : "standard"));
      setIsActive(true); setIsRunning(true); setIsFinished(false); setIsConfiguring(false); setShowEndConfirm(false);
      trackedSessionIdRef.current = sid;
    }
    if (initialSession?.id) {
      if (initialSession.duration_minutes === null || initialSession.duration_minutes === undefined) setSelectedDuration("ongoing");
      else setSelectedDuration((initialSession.duration_minutes === 0 ? 0.083 : initialSession.duration_minutes) as TimerPreset);
    }
    if (activeSessionIdRef.current && !initialSession?.id) {
      activeSessionIdRef.current = null; sessionStartAtRef.current = "";
      stopAlarm(); trackedSessionIdRef.current = null;
      setIsActive(false); setIsRunning(false); setIsFinished(false); setElapsedSeconds(0); setSessionId(null); setShowEndConfirm(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- initialSession refs used for sync only
  }, [initialSession?.id, initialSession?.duration_minutes, initialSession?.mode, pricingMode]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    if (!sessionStartAtRef.current) return;
    const tick = () => {
      if (!sessionStartAtRef.current || isPausedRef.current) return;
      const elapsed = elapsedFromSession({ start_at: sessionStartAtRef.current } as Session);
      setElapsedSeconds(elapsed);
      const d = selectedDurationRef.current;
      if (d !== "ongoing") {
        const targetSecs = Math.round((d as number) * 60);
        if (elapsed >= targetSecs) {
          isPausedRef.current = true;
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          const frozenElapsed = Math.min(elapsed, targetSecs);
          pausedElapsedRef.current = frozenElapsed;
          setElapsedSeconds(frozenElapsed);
          setIsRunning(false);
          setIsFinished(true);
          setShowEndConfirm(false);
          playAlarm();
        }
      }
    };
    tick(); // Fire immediately
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, playAlarm]);

  const currentRate = mode === "1v1" ? (price1v1 ?? 0) : mode === "2v2" ? (price2v2 ?? 0) : pricePerHour;
  const currentCost = Math.round(((elapsedSeconds / 3600) * currentRate + Number.EPSILON) * 100) / 100;
  const displayName = code ? `${name} #${code}` : name;

  const handleStartSession = async () => {
    if (sessionId) return;
    preloadAlarm();
    isPausedRef.current = false;
    const now = new Date();
    sessionStartAtRef.current = now.toISOString();
    setIsConfiguring(false); setIsActive(true); setIsRunning(true); setIsFinished(false);
    setElapsedSeconds(elapsedFromSession({ start_at: sessionStartAtRef.current } as Session));
    const token = localStorage.getItem("admin_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!token) return;
    try {
      const resp = await fetch(`${apiUrl}/api/admin/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            resource_id: id,
            resource_name: displayName,
            mode,
            // DB expects integer; 0.083 (5 sec dev option) rounds to 0
            duration_minutes: selectedDuration === "ongoing" ? null : (typeof selectedDuration === "number" ? Math.round(selectedDuration) : null),
        }),
      });
      if (resp.ok) {
        const { session } = await resp.json() as { session: Session };
        // Keep our local start time for accurate countdown; don't overwrite with server timestamp
        trackedSessionIdRef.current = session.id;
        setSessionId(session.id);
        onStart?.(session);
      } else {
        trackedSessionIdRef.current = null; sessionStartAtRef.current = "";
        setIsActive(false); setIsRunning(false); setElapsedSeconds(0);
      }
    } catch { trackedSessionIdRef.current = null; sessionStartAtRef.current = ""; setIsActive(false); setIsRunning(false); setElapsedSeconds(0); }
  };

  const handleFinish = async () => {
    if (isSaving) return;
    stopAlarm(); setShowEndConfirm(false);
    const finishedId = sessionId;
    const finalElapsed = elapsedSeconds;
    const finalCost = Math.round(((finalElapsed / 3600) * currentRate + Number.EPSILON) * 100) / 100;
    trackedSessionIdRef.current = null;
    setIsActive(false); setIsRunning(false); setIsFinished(false); setElapsedSeconds(0); setSessionId(null);
    if (!finishedId || finalElapsed === 0) return;
    setIsSaving(true);
    const token = localStorage.getItem("admin_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const resp = await fetch(`${apiUrl}/api/admin/sessions/${finishedId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ duration_seconds: finalElapsed, total_price: finalCost }),
      });
      if (resp.ok) { const { session } = await resp.json() as { session: Session }; onFinish?.(session); }
    } catch { console.error("Failed to complete session"); } finally { setIsSaving(false); }
  };

  const handleAddTime = () => {
    stopAlarm();
    isPausedRef.current = false;
    const frozen = pausedElapsedRef.current;
    const newStartAt = new Date(Date.now() - frozen * 1000).toISOString();
    sessionStartAtRef.current = newStartAt;
    setElapsedSeconds(frozen);
    setSelectedDuration("ongoing");
    setIsFinished(false);
    setIsRunning(true);
  };

  const progressPct = selectedDuration !== "ongoing" ? Math.min(100, (elapsedSeconds / ((selectedDuration as number) * 60)) * 100) : 0;
  const displayTime = selectedDuration === "ongoing" ? formatTime(elapsedSeconds) : isAdmin ? formatTime(Math.max(0, Math.round((selectedDuration as number) * 60) - elapsedSeconds)) : formatTime(elapsedSeconds);

  // ── Idle ──
  if (!isActive && !isConfiguring && !isFinished) {
    if (status !== "available") return (
      <div style={cardStyle("#16161a", "#252529")}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 10 }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.4)", borderRadius: "50%", animation: "tc-spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2" }}>{displayName}</span>
          <span style={{ fontSize: 11, color: "#4a4a55" }}>იტვირთება...</span>
        </div>
      </div>
    );
    return (
      <div style={cardStyle("#16161a", "#252529", true)} className="tc-idle-card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2", marginBottom: 4 }}>{displayName}</div>
          <div style={{ fontSize: 11, color: "#4a4a55", fontFamily: "'DM Mono', monospace" }}>₾{pricePerHour}/სთ</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => setIsConfiguring(true)} style={playBtnStyle} className="tc-play-btn">
            <Play size={20} fill="currentColor" />
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#3a3a42", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 12 }}>თავისუფალია</div>
      </div>
    );
  }

  // ── Configure ──
  if (isConfiguring) {
    const targetSecs = selectedDuration === "ongoing" ? 0 : Math.round((selectedDuration as number) * 60);
    const targetCost = Math.round(((targetSecs / 3600) * currentRate + Number.EPSILON) * 100) / 100;
    return (
      <div style={cardStyle("#16161a", "#3a3a42")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2" }}>{displayName}</span>
          <button onClick={() => setIsConfiguring(false)} style={{ background: "none", border: "none", color: "#4a4a55", cursor: "pointer", padding: 2, display: "flex" }}>
            <X size={16} />
          </button>
        </div>
        {pricingMode === "ps_mode" && (
          <div style={{ display: "flex", gap: 6, padding: "4px", background: "#0e0e10", borderRadius: 10, marginBottom: 14 }}>
            {(["1v1", "2v2"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px 4px", borderRadius: 7, border: "none", fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", cursor: "pointer", background: mode === m ? "#f0f0f2" : "transparent", color: mode === m ? "#0e0e10" : "#4a4a55", transition: "all 0.15s" }}>
                {m}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 16 }}>
          {durationOptions.map((opt) => (
            <button key={opt.label} onClick={() => setSelectedDuration(opt.value)} style={{ padding: "9px 4px", borderRadius: 8, border: `1px solid ${selectedDuration === opt.value ? "#f0f0f2" : "#252529"}`, background: selectedDuration === opt.value ? "rgba(240,240,242,0.08)" : "#0e0e10", color: selectedDuration === opt.value ? "#f0f0f2" : "#4a4a55", fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "all 0.15s" }}>
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 12, borderTop: "1px solid #252529" }}>
          <div>
            <div style={{ fontSize: 10, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>ჯამი</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0f0f2" }}>
              {selectedDuration === "ongoing" ? "LIVE" : `₾${targetCost.toFixed(2)}`}
            </div>
          </div>
          <button onClick={handleStartSession} style={{ padding: "10px 20px", background: "#f0f0f2", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#0e0e10", cursor: "pointer", transition: "all 0.15s" }}>
            დაწყება
          </button>
        </div>
      </div>
    );
  }

  // ── Finished ──
  if (isFinished) {
    return (
      <div style={{ ...cardStyle("#1a1412", "#5a3a2a"), boxShadow: "0 0 0 1px #5a3a2a, 0 4px 24px rgba(180,80,20,0.1)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(200,100,40,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Volume2 size={20} color="#c87028" style={{ animation: "tc-pulse 0.8s ease-in-out infinite" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2", marginBottom: 3 }}>{displayName}</div>
            <div style={{ fontSize: 10, color: "#c87028", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>სესია დასრულდა</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
            <div style={summaryBox}>
              <div style={summaryLabel}>დრო</div>
              <div style={summaryValue}>{formatTime(elapsedSeconds)}</div>
            </div>
            <div style={summaryBox}>
              <div style={summaryLabel}>ჯამი</div>
              <div style={{ ...summaryValue, color: "#c87028" }}>₾{currentCost.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <button onClick={handleFinish} disabled={isSaving} style={{ flex: 1, padding: "11px 8px", background: "#f0f0f2", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#0e0e10", cursor: "pointer", opacity: isSaving ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {isSaving ? <div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "#0e0e10", borderRadius: "50%", animation: "tc-spin 0.7s linear infinite" }} /> : "გადახდილია"}
            </button>
            <button onClick={handleAddTime} disabled={isSaving} style={{ flex: 1, padding: "11px 8px", background: "rgba(200,100,40,0.15)", border: "1px solid rgba(200,100,40,0.3)", borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#c87028", cursor: "pointer" }}>
              +დრო
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Running ──
  return (
    <div style={{ ...cardStyle("#16161a", "#3a3a42"), borderTopColor: isRunning ? "#e8e8ea" : "#5a5a65", borderTopWidth: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2", marginBottom: 4 }}>{displayName}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", padding: "2px 7px", borderRadius: 5, background: "rgba(240,240,242,0.08)", color: "#9a9aa5", border: "1px solid #252529" }}>
              {mode === "standard" ? "STD" : mode}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", padding: "2px 7px", borderRadius: 5, background: "rgba(240,240,242,0.08)", color: "#9a9aa5", border: "1px solid #252529" }}>
              {selectedDuration === "ongoing" ? "LIVE" : `${selectedDuration}m`}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: isRunning ? "rgba(80,200,80,0.08)" : "rgba(200,200,80,0.08)", border: `1px solid ${isRunning ? "rgba(80,200,80,0.2)" : "rgba(200,200,80,0.2)"}` }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: isRunning ? "#60c860" : "#c8c840", animation: "tc-pulse 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: isRunning ? "#60c860" : "#c8c840", fontFamily: "'DM Mono', monospace" }}>{isRunning ? "RUN" : "PAU"}</span>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "18px 12px", background: "#0e0e10", borderRadius: 12, border: "1px solid #252529", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        {selectedDuration !== "ongoing" && (
          <div style={{ position: "absolute", bottom: 0, left: 0, height: 2, background: isRunning ? "#e8e8ea" : "#5a5a65", width: `${progressPct}%`, transition: "width 1s linear" }} />
        )}
        <span style={{ fontSize: 32, fontWeight: 400, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em", color: "#f0f0f2" }}>
          {displayTime}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>ხარჯი</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0f0f2" }}>₾{currentCost.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showEndConfirm ? "1fr 1fr" : isRunning ? "1fr" : "1fr 1fr", gap: 8 }}>
        {showEndConfirm ? (
          <>
            <button onClick={() => {
              isPausedRef.current = true;
              const elapsed = elapsedFromSession({ start_at: sessionStartAtRef.current } as Session);
              pausedElapsedRef.current = elapsed;
              setElapsedSeconds(elapsed);
              setIsRunning(false);
              setIsFinished(true);
              setShowEndConfirm(false);
            }} style={confirmBtnStyle("#e07070", "rgba(220,60,60,0.08)", "rgba(220,60,60,0.2)")}>
              დიახ
            </button>
            <button onClick={() => setShowEndConfirm(false)} style={confirmBtnStyle("#9a9aa5", "rgba(255,255,255,0.03)", "#252529")}>
              არა
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setShowEndConfirm(true)} style={confirmBtnStyle("#e07070", "rgba(220,60,60,0.06)", "rgba(220,60,60,0.15)")}>
              <StopCircle size={13} /> დასრულება
            </button>
            {!isRunning && (
              <button onClick={() => {
                isPausedRef.current = true;
                const elapsed = elapsedFromSession({ start_at: sessionStartAtRef.current } as Session);
                pausedElapsedRef.current = elapsed;
                setElapsedSeconds(elapsed);
                setIsRunning(false);
                setIsFinished(true);
              }} style={confirmBtnStyle("#9a9aa5", "rgba(255,255,255,0.03)", "#252529")}>
                დეტალები
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Style helpers ──
const cardStyle = (bg: string, border: string, interactive = false): React.CSSProperties => ({
  background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: 16,
  display: "flex", flexDirection: "column", minHeight: 200, boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
  transition: interactive ? "border-color 0.2s" : undefined,
});

const playBtnStyle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: "50%", background: "rgba(240,240,242,0.06)",
  border: "1px solid rgba(240,240,242,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
  color: "#9a9aa5", cursor: "pointer", transition: "all 0.2s",
};

const summaryBox: React.CSSProperties = {
  padding: "10px 8px", background: "#0e0e10", borderRadius: 10, border: "1px solid #252529",
};
const summaryLabel: React.CSSProperties = { fontSize: 9, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontWeight: 700 };
const summaryValue: React.CSSProperties = { fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0f0f2" };

const confirmBtnStyle = (color: string, bg: string, border: string): React.CSSProperties => ({
  padding: "11px 8px", background: bg, border: `1px solid ${border}`, borderRadius: 10,
  fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color, cursor: "pointer",
  transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
});