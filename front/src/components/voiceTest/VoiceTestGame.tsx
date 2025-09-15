/**
PitchPilot Demo (React + TypeScript)

How to run:
1. Create a Vite React + TS project:
   npm create vite@latest pitch-pilot -- --template react-ts
   cd pitch-pilot
   npm install
2. Replace src/App.tsx with this file's contents. Also copy any CSS below into src/index.css or keep Tailwind off.
3. npm run dev

This is a minimal playable demo that:
- Immediately requests microphone access on load
- Detects pitch via autocorrelation
- Converts Hz -> nearest note name between C2..B6
- Moves the plane up/down based on detected note
- Spawns asteroids that move left
- Auto-fires when the detected note matches the asteroid's note (with tolerance in cents)

This file is intentionally self-contained and does not rely on external libraries.
*/

import React, { useEffect, useRef, useState } from "react";

// ---------- Helpers: Pitch detection (autocorrelation) and note conversion ----------

function autoCorrelate(buf: Float32Array, sampleRate: number): number | null {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null;

  let r1 = 0,
    r2 = SIZE - 1,
    thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }
  buf = buf.slice(r1, r2);
  const newSize = buf.length;
  if (newSize < 2) return null;

  const maxSamples = Math.floor(newSize / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  for (let offset = 0; offset < maxSamples; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i++) {
      correlation += Math.abs(buf[i] - buf[i + offset]);
    }
    correlation = 1 - correlation / maxSamples;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }
  if (bestCorrelation > 0.01 && bestOffset > 0) {
    const frequency = sampleRate / bestOffset;
    if (frequency >= 16 && frequency <= 20000) return frequency;
  }
  return null;
}

function hzToMidi(hz: number) {
  return 69 + 12 * Math.log2(hz / 440);
}

const SEMITONE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteName(midi: number) {
  const m = Math.round(midi);
  const note = SEMITONE_NAMES[m % 12];
  const octave = Math.floor(m / 12) - 1;
  return `${note}${octave}`;
}

function midiToFreq(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function clampNoteToRange(noteMidi: number) {
  const c2Midi = 36;
  const b6Midi = 95;
  return Math.max(c2Midi, Math.min(b6Midi, Math.round(noteMidi)));
}

function centsBetween(freq: number, refFreq: number) {
  return 1200 * Math.log2(freq / refFreq);
}

// ---------- React component ----------

export default function PitchPilotDemo(): JSX.Element {
  const [micAllowed, setMicAllowed] = useState(false);
  const [hz, setHz] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [cents, setCents] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);

  const [planeY, setPlaneY] = useState(0.5);
  const planeYRef = useRef(0.5);
  planeYRef.current = planeY;
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const [asteroidX, setAsteroidX] = useState(0.95);
  const [asteroidNote, setAsteroidNote] = useState("A4");
  const asteroidXRef = useRef(asteroidX);
  asteroidXRef.current = asteroidX;

  const ASTEROID_SPEED = 0.0008;
  const FIRE_TOLERANCE_CENTS = 40;
  const HOLD_TIME_MS = 120;
  const holdStartRef = useRef<number | null>(null);

  function spawnAsteroid() {
    const midi = Math.floor(Math.random() * (95 - 36 + 1)) + 36;
    const noteName = midiToNoteName(midi);
    setAsteroidNote(noteName);
    setAsteroidX(0.98);
  }

  useEffect(() => {
    spawnAsteroid();
    startAudio();
    return () => stopAudio();
  }, []);

  async function startAudio() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicAllowed(true);
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      dataRef.current = new Float32Array(analyser.fftSize);

      function tick() {
        const analyser = analyserRef.current;
        const audioCtx = audioCtxRef.current;
        if (!analyser || !audioCtx) return;
        const buf = dataRef.current!;
        analyser.getFloatTimeDomainData(buf);
        const f = autoCorrelate(buf, audioCtx.sampleRate);
        if (f) {
          setHz(f);
          const midiFloat = hzToMidi(f);
          const clamped = clampNoteToRange(midiFloat);
          const noteName = midiToNoteName(clamped);
          setNote(noteName);
          const refFreq = midiToFreq(clamped);
          setCents(centsBetween(f, refFreq));
        } else {
          setHz(null);
          setNote(null);
          setCents(null);
        }
        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.error("Mic error:", e);
      setMicAllowed(false);
    }
  }

  function stopAudio() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    dataRef.current = null;
    setMicAllowed(false);
    setHz(null);
    setNote(null);
    setCents(null);
  }

  useEffect(() => {
    let rafId: number;
    let last = performance.now();

    function loop(now: number) {
      const dt = now - last;
      last = now;

      setAsteroidX((x) => {
        const nx = x - ASTEROID_SPEED * dt;
        if (nx <= 0.03) {
          setGameOver(true);
          return 0.02;
        }
        return nx;
      });

      if (note) {
        const semitone = noteNameToMidi(note);
        if (semitone != null) {
          const c2Midi = 36;
          const b6Midi = 95;
          const norm = (semitone - c2Midi) / (b6Midi - c2Midi);
          setPlaneY((py) => py + (norm - py) * 0.12);
        }
      } else {
        setPlaneY((py) => py + (0.5 - py) * 0.06);
      }

      if (note && asteroidNote && hz) {
        const targetMidi = noteNameToMidi(asteroidNote) as number;
        const targetFreq = midiToFreq(targetMidi);
        const c = Math.abs(centsBetween(hz, targetFreq));
        if (c <= FIRE_TOLERANCE_CENTS) {
          if (!holdStartRef.current) holdStartRef.current = performance.now();
          else if (performance.now() - holdStartRef.current >= HOLD_TIME_MS) {
            const planeSemitone = note ? noteNameToMidi(note) : null;
            const planeNorm = planeYRef.current;
            const asteroidNorm = (targetMidi - 36) / (95 - 36);
            const dist = Math.abs(planeNorm - asteroidNorm);
            if (dist < 0.12) {
              setScore((s) => s + 100);
              spawnAsteroid();
            }
            holdStartRef.current = null;
          }
        } else holdStartRef.current = null;
      } else holdStartRef.current = null;

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [note, hz, asteroidNote]);

  function noteNameToMidi(noteName: string | null) {
    if (!noteName) return null;
    const m = noteName.match(/^([A-G]#?)(-?\d+)$/);
    if (!m) return null;
    const [_, name, octStr] = m;
    const semitone = SEMITONE_NAMES.indexOf(name);
    if (semitone < 0) return null;
    const octave = parseInt(octStr, 10);
    return (octave + 1) * 12 + semitone;
  }

  function resetGame() {
    setScore(0);
    setGameOver(false);
    spawnAsteroid();
    setPlaneY(0.5);
  }

  return (
    <div style={{ fontFamily: "Inter, Arial, sans-serif", padding: 16 }}>
      <h1>Pitch Pilot — Demo</h1>
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div style={{ width: 720, height: 360, background: "#0b1220", borderRadius: 12, position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 32,
              transform: "translateY(-50%)",
              top: `${planeY * 100}%`,
              transition: "top 60ms linear",
              width: 80,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 80, height: 40, background: "#4dd0e1", borderRadius: 8, boxShadow: "0 6px 12px rgba(0,0,0,0.4)" }}>
              <div style={{ textAlign: "center", fontWeight: 700 }}>✈️</div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: `${(1 - asteroidX) * 680}px`,
              top: `${((noteNameToMidi(asteroidNote as string) as number) - 36) / (95 - 36) * 100}%`,
              transform: "translateY(-50%)",
              width: 64,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#b07b47",
              borderRadius: 32,
              color: "white",
              fontWeight: 700,
              boxShadow: "0 6px 14px rgba(0,0,0,0.5)",
            }}
          >
            {asteroidNote}
          </div>

          <div style={{ position: "absolute", left: 12, bottom: 12, color: "white" }}>
            <div>Score: {score}</div>
            <div>Note: {note ?? "—"} {hz ? `(${hz.toFixed(0)} Hz)` : ""}</div>
            <div>Cents: {cents ? cents.toFixed(0) : "—"}</div>
          </div>

          {gameOver && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", color: "white", flexDirection: "column" }}>
              <h2>Game Over</h2>
              <div>Final Score: {score}</div>
              <button onClick={resetGame} style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8 }}>Restart</button>
            </div>
          )}
        </div>

        <div style={{ width: 320 }}>
          <div style={{ background: "#f4f4f4", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 700 }}>Pitch Meter</div>
            <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 8, height: 120, background: "#ddd", borderRadius: 6, position: "relative" }}>
                <div style={{ position: "absolute", bottom: `${(cents ?? 0) * 0.05 + 50}%`, left: 0, right: 0, height: 6, background: cents && Math.abs(cents) <= FIRE_TOLERANCE_CENTS ? "#4caf50" : "#ef5350", borderRadius: 3 }} />
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div>Detected Hz: {hz ? hz.toFixed(1) : "—"}</div>
              <div>Detected Note: {note ?? "—"}</div>
              <div>Asteroid Note: {asteroidNote}</div>
              <div>Tolerance: ±{FIRE_TOLERANCE_CENTS} cents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
