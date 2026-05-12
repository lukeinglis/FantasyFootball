"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// Breakaway: A Subway-Surfer-style football mini game
// Canvas-based, 3-lane top-down runner
// ============================================================

// --- Constants ---

const FIELD_GREEN = "#2d5a27";
const FIELD_GREEN_ALT = "#2a5224";
const YARD_LINE_COLOR = "rgba(255,255,255,0.45)";
const YARD_NUM_COLOR = "rgba(255,255,255,0.22)";
const HASH_COLOR = "rgba(255,255,255,0.2)";
const PLAYER_COLOR = "#DD550C";
const PLAYER_GLOW = "rgba(221,85,12,0.5)";
const TACKLER_COLOR = "#0C2340";
const TACKLER_OUTLINE = "#1a3a5c";
const POWERUP_COLOR = "#FFD700";
const ENDZONE_COLOR = "#DD550C";
const SIDELINE_COLOR = "rgba(255,255,255,0.35)";

const CANVAS_W = 400;
const CANVAS_H = 600;
const LANE_COUNT = 3;
const SIDELINE_W = 30;
const FIELD_W = CANVAS_W - SIDELINE_W * 2;
const LANE_W = FIELD_W / LANE_COUNT;

const PLAYER_W = 28;
const PLAYER_H = 36;
const PLAYER_Y = CANVAS_H - 100;

const TACKLER_W = 30;
const TACKLER_H = 34;
const TACKLER_W_WIDE = LANE_W * 2 - 10;

const POWERUP_SIZE = 22;
const POWERUP_DURATION = 3000; // ms of invincibility

const INITIAL_SPEED = 3;
const MAX_SPEED = 10;
const SPEED_RAMP = 0.0003; // per frame
const TACKLER_SPAWN_INTERVAL_INIT = 60; // frames
const TACKLER_SPAWN_INTERVAL_MIN = 18;

const PARTICLE_COUNT_PER_FRAME = 1;
const MAX_PARTICLES = 40;

const YARD_LINE_SPACING = 60; // pixels per 10 yards of field

// --- Types ---

interface Tackler {
  lane: number;
  y: number;
  wide: boolean; // spans 2 lanes
  jersey: number; // fixed jersey number assigned at spawn
}

interface Powerup {
  lane: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  alpha: number;
}

interface LeaderboardEntry {
  name: string;
  yards: number;
  date: string;
}

type GameState = "menu" | "playing" | "gameover";

// --- Helpers ---

function laneX(lane: number): number {
  return SIDELINE_W + lane * LANE_W + LANE_W / 2;
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// --- Component ---

export default function BreakawayGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game state refs (mutable for animation loop)
  const stateRef = useRef<GameState>("menu");
  const laneRef = useRef(1); // 0, 1, 2
  const yardsRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const fieldOffsetRef = useRef(0);
  const tacklersRef = useRef<Tackler[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const speedLinesRef = useRef<SpeedLine[]>([]);
  const invincibleUntilRef = useRef(0);
  const spawnCounterRef = useRef(0);
  const frameCountRef = useRef(0);
  const shakeRef = useRef(0);
  const firstDownFlashRef = useRef(0);
  const lastFirstDownRef = useRef(0);
  const animFrameRef = useRef(0);
  const scaleRef = useRef(1);

  // React state for UI overlay
  const [gameState, setGameState] = useState<GameState>("menu");
  const [yards, setYards] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreRank, setScoreRank] = useState<number | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Fetch leaderboard on mount
  useEffect(() => {
    fetch("/api/game")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {});

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setIsSignedIn(!!d.user))
      .catch(() => {});
  }, []);

  // --- Game logic ---

  const resetGame = useCallback(() => {
    laneRef.current = 1;
    yardsRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    fieldOffsetRef.current = 0;
    tacklersRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    speedLinesRef.current = [];
    invincibleUntilRef.current = 0;
    spawnCounterRef.current = 0;
    frameCountRef.current = 0;
    shakeRef.current = 0;
    firstDownFlashRef.current = 0;
    lastFirstDownRef.current = 0;
    setYards(0);
    setScoreSaved(false);
    setScoreRank(null);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    stateRef.current = "playing";
    setGameState("playing");
  }, [resetGame]);

  const endGame = useCallback(() => {
    stateRef.current = "gameover";
    setGameState("gameover");
    shakeRef.current = 12;

    const finalYards = Math.floor(yardsRef.current);
    setYards(finalYards);

    // Save score if signed in
    if (finalYards > 0) {
      fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yards: finalYards }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.leaderboard) {
            setLeaderboard(d.leaderboard);
            setScoreSaved(true);
            setScoreRank(d.rank ?? null);
          }
        })
        .catch(() => {});
    }
  }, []);

  const moveLane = useCallback((dir: -1 | 1) => {
    if (stateRef.current !== "playing") return;
    const next = laneRef.current + dir;
    if (next >= 0 && next < LANE_COUNT) {
      laneRef.current = next;
    }
  }, []);

  // --- Input handlers ---

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault();
        moveLane(-1);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault();
        moveLane(1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (stateRef.current === "menu" || stateRef.current === "gameover") {
          startGame();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveLane, startGame]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let touchStartX = 0;
    let touchStartY = 0;

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;

      if (stateRef.current === "menu" || stateRef.current === "gameover") {
        startGame();
      }
    }

    function onTouchEnd(e: TouchEvent) {
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      // Only register horizontal swipes (not taps)
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        moveLane(dx > 0 ? 1 : -1);
      } else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
        // Tap: left half = left, right half = right
        const rect = canvas!.getBoundingClientRect();
        const tapX = t.clientX - rect.left;
        if (tapX < rect.width / 2) {
          moveLane(-1);
        } else {
          moveLane(1);
        }
      }
    }

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [moveLane, startGame]);

  // --- Resize handler ---

  useEffect(() => {
    function resize() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const maxW = container.clientWidth;
      const maxH = Math.min(600, window.innerHeight * 0.7);
      const scaleW = maxW / CANVAS_W;
      const scaleH = maxH / CANVAS_H;
      const scale = Math.min(scaleW, scaleH, 1);
      scaleRef.current = scale;

      canvas.style.width = `${CANVAS_W * scale}px`;
      canvas.style.height = `${CANVAS_H * scale}px`;
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // --- Main game loop ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function spawnTackler() {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      const wide = Math.random() < 0.15 && speedRef.current > 4;
      const jersey = 20 + Math.floor(Math.random() * 79);
      tacklersRef.current.push({ lane, y: -TACKLER_H, wide, jersey });
    }

    function spawnPowerup() {
      const lane = Math.floor(Math.random() * LANE_COUNT);
      powerupsRef.current.push({ lane, y: -POWERUP_SIZE });
    }

    function addParticle(x: number, y: number) {
      if (particlesRef.current.length >= MAX_PARTICLES) return;
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 1.5 + 0.5),
        life: 1,
        maxLife: 20 + Math.random() * 15,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? "#4a8c3e" : "#3d7534",
      });
    }

    function addSpeedLine() {
      speedLinesRef.current.push({
        x: SIDELINE_W + Math.random() * FIELD_W,
        y: -10,
        length: 20 + Math.random() * 40,
        alpha: 0.1 + Math.random() * 0.15,
      });
    }

    function gameLoop() {
      if (!ctx) return;
      const state = stateRef.current;
      const frame = frameCountRef.current++;

      // --- Update ---
      if (state === "playing") {
        const speed = speedRef.current;

        // Ramp difficulty
        speedRef.current = Math.min(speed + SPEED_RAMP, MAX_SPEED);

        // Field scroll
        fieldOffsetRef.current += speed;

        // Yards
        yardsRef.current += speed * 0.1;
        const currentYards = Math.floor(yardsRef.current);
        if (frame % 5 === 0) setYards(currentYards);

        // First down flash
        const currentFirstDown = Math.floor(currentYards / 100);
        if (currentFirstDown > lastFirstDownRef.current && currentYards > 0) {
          firstDownFlashRef.current = 60;
          lastFirstDownRef.current = currentFirstDown;
        }
        if (firstDownFlashRef.current > 0) firstDownFlashRef.current--;

        // Spawn tacklers
        const spawnInterval = Math.max(
          TACKLER_SPAWN_INTERVAL_MIN,
          TACKLER_SPAWN_INTERVAL_INIT - frame * 0.02
        );
        spawnCounterRef.current++;
        if (spawnCounterRef.current >= spawnInterval) {
          spawnTackler();
          spawnCounterRef.current = 0;
          // Occasionally spawn double
          if (Math.random() < 0.3 && speed > 5) {
            spawnTackler();
          }
        }

        // Spawn powerups
        if (frame % 400 === 200) {
          spawnPowerup();
        }

        // Move tacklers
        tacklersRef.current = tacklersRef.current.filter((t) => {
          t.y += speed * 1.1;
          return t.y < CANVAS_H + 50;
        });

        // Move powerups
        powerupsRef.current = powerupsRef.current.filter((p) => {
          p.y += speed;
          return p.y < CANVAS_H + 50;
        });

        // Player collision rect
        const px = laneX(laneRef.current) - PLAYER_W / 2;
        const py = PLAYER_Y - PLAYER_H / 2;
        const now = Date.now();
        const invincible = now < invincibleUntilRef.current;

        // Check powerup pickup
        powerupsRef.current = powerupsRef.current.filter((p) => {
          const ppx = laneX(p.lane) - POWERUP_SIZE / 2;
          const ppy = p.y - POWERUP_SIZE / 2;
          if (rectsOverlap(px, py, PLAYER_W, PLAYER_H, ppx, ppy, POWERUP_SIZE, POWERUP_SIZE)) {
            invincibleUntilRef.current = now + POWERUP_DURATION;
            return false;
          }
          return true;
        });

        // Check tackler collision
        if (!invincible) {
          for (const t of tacklersRef.current) {
            const tw = t.wide ? TACKLER_W_WIDE : TACKLER_W;
            const tlane = t.wide
              ? Math.min(t.lane, LANE_COUNT - 2)
              : t.lane;
            const tx = t.wide
              ? SIDELINE_W + tlane * LANE_W + (LANE_W * 2 - tw) / 2
              : laneX(t.lane) - tw / 2;
            const ty = t.y - TACKLER_H / 2;
            if (rectsOverlap(px, py, PLAYER_W, PLAYER_H, tx, ty, tw, TACKLER_H)) {
              endGame();
              break;
            }
          }
        }

        // Particles from runner
        if (frame % 2 === 0) {
          for (let i = 0; i < PARTICLE_COUNT_PER_FRAME; i++) {
            addParticle(
              laneX(laneRef.current) + (Math.random() - 0.5) * 10,
              PLAYER_Y + PLAYER_H / 2
            );
          }
        }

        // Speed lines at high speed
        if (speed > 5 && frame % 3 === 0) {
          addSpeedLine();
        }

        // Update particles
        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx;
          p.y += p.vy + speed * 0.3;
          p.life += 1;
          return p.life < p.maxLife;
        });

        // Update speed lines
        speedLinesRef.current = speedLinesRef.current.filter((s) => {
          s.y += speed * 2;
          return s.y < CANVAS_H + 50;
        });
      }

      // Shake decay
      if (shakeRef.current > 0) shakeRef.current *= 0.85;
      if (shakeRef.current < 0.5) shakeRef.current = 0;

      // --- Draw ---
      ctx.save();

      // Screen shake
      if (shakeRef.current > 0) {
        const sx = (Math.random() - 0.5) * shakeRef.current * 2;
        const sy = (Math.random() - 0.5) * shakeRef.current * 2;
        ctx.translate(sx, sy);
      }

      // Field background (alternating strips)
      const offset = fieldOffsetRef.current % (YARD_LINE_SPACING * 2);
      for (let y = -YARD_LINE_SPACING * 2; y < CANVAS_H + YARD_LINE_SPACING; y += YARD_LINE_SPACING) {
        const fy = y + offset;
        const stripIndex = Math.floor((y + YARD_LINE_SPACING * 4) / YARD_LINE_SPACING);
        ctx.fillStyle = stripIndex % 2 === 0 ? FIELD_GREEN : FIELD_GREEN_ALT;
        ctx.fillRect(SIDELINE_W, fy, FIELD_W, YARD_LINE_SPACING);
      }

      // Sidelines
      ctx.fillStyle = "#1a4a15";
      ctx.fillRect(0, 0, SIDELINE_W, CANVAS_H);
      ctx.fillRect(CANVAS_W - SIDELINE_W, 0, SIDELINE_W, CANVAS_H);

      // Sideline stripes
      ctx.strokeStyle = SIDELINE_COLOR;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(SIDELINE_W, 0);
      ctx.lineTo(SIDELINE_W, CANVAS_H);
      ctx.moveTo(CANVAS_W - SIDELINE_W, 0);
      ctx.lineTo(CANVAS_W - SIDELINE_W, CANVAS_H);
      ctx.stroke();

      // Yard lines + numbers
      const yardOffset = fieldOffsetRef.current % YARD_LINE_SPACING;
      for (let y = -YARD_LINE_SPACING; y < CANVAS_H + YARD_LINE_SPACING; y += YARD_LINE_SPACING) {
        const ly = y + yardOffset;
        if (ly < -10 || ly > CANVAS_H + 10) continue;

        // Yard line
        ctx.strokeStyle = YARD_LINE_COLOR;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(SIDELINE_W, ly);
        ctx.lineTo(CANVAS_W - SIDELINE_W, ly);
        ctx.stroke();

        // Hash marks
        ctx.strokeStyle = HASH_COLOR;
        ctx.lineWidth = 1;
        const hashPositions = [
          SIDELINE_W + FIELD_W * 0.33,
          SIDELINE_W + FIELD_W * 0.67,
        ];
        for (const hx of hashPositions) {
          ctx.beginPath();
          ctx.moveTo(hx - 4, ly);
          ctx.lineTo(hx + 4, ly);
          ctx.stroke();
        }

        // Yard numbers
        const totalYardLines = Math.floor(fieldOffsetRef.current / YARD_LINE_SPACING);
        const lineIndex = Math.floor((y + YARD_LINE_SPACING) / YARD_LINE_SPACING);
        const yardNum = ((totalYardLines - lineIndex + 100) % 100);
        // Show yard numbers (10, 20, ..., 50, 40, 30, ...)
        const displayNum = yardNum % 100;
        const fieldYard = displayNum <= 50 ? displayNum : 100 - displayNum;

        if (fieldYard > 0 && fieldYard % 10 === 0) {
          ctx.save();
          ctx.font = "bold 18px sans-serif";
          ctx.fillStyle = YARD_NUM_COLOR;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Left number
          ctx.save();
          ctx.translate(SIDELINE_W + 16, ly);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(fieldYard), 0, 0);
          ctx.restore();

          // Right number
          ctx.save();
          ctx.translate(CANVAS_W - SIDELINE_W - 16, ly);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(String(fieldYard), 0, 0);
          ctx.restore();

          ctx.restore();
        }
      }

      // Endzone detection (every 100 yards)
      const currentYds = yardsRef.current;
      const nextEndzone = Math.ceil(currentYds / 100) * 100;
      if (nextEndzone - currentYds < 80 && nextEndzone > 0) {
        const endzoneDist = nextEndzone - currentYds;
        const endzoneY = PLAYER_Y - (endzoneDist / 80) * CANVAS_H;
        if (endzoneY > -60 && endzoneY < CANVAS_H) {
          ctx.fillStyle = ENDZONE_COLOR;
          ctx.globalAlpha = 0.25;
          ctx.fillRect(SIDELINE_W, endzoneY - 40, FIELD_W, 40);
          ctx.globalAlpha = 1;

          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("AUBURN", CANVAS_W / 2, endzoneY - 20);
        }
      }

      // Speed lines
      for (const s of speedLinesRef.current) {
        ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.length);
        ctx.stroke();
      }

      // Particles
      for (const p of particlesRef.current) {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Powerups
      for (const p of powerupsRef.current) {
        const px = laneX(p.lane);
        const py = p.y;

        // Glow
        ctx.save();
        ctx.shadowColor = POWERUP_COLOR;
        ctx.shadowBlur = 12;

        // Football shape
        ctx.fillStyle = POWERUP_COLOR;
        ctx.beginPath();
        ctx.ellipse(px, py, POWERUP_SIZE / 2, POWERUP_SIZE / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Laces
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py - POWERUP_SIZE / 3 + 3);
        ctx.lineTo(px, py + POWERUP_SIZE / 3 - 3);
        ctx.stroke();
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(px - 3, py + i * 4);
          ctx.lineTo(px + 3, py + i * 4);
          ctx.stroke();
        }

        ctx.restore();
      }

      // --- Draw a top-down football player ---
      function drawFootballer(
        cx: number, cy: number,
        jerseyColor: string, helmetColor: string,
        number: string, scale: number, facingUp: boolean,
        glow?: string,
      ) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(cx, cy);
        if (!facingUp) ctx.rotate(Math.PI);
        const s = scale;

        // Shadow on the ground
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.beginPath();
        ctx.ellipse(0, 2 * s, 11 * s, 5 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        if (glow) {
          ctx.shadowColor = glow;
          ctx.shadowBlur = 16;
        }

        // Legs (two small ovals below body, animated with frame count)
        const legPhase = (frameCountRef.current * 0.2) % (Math.PI * 2);
        const legSpread = Math.sin(legPhase) * 3 * s;
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.ellipse(-4 * s, 14 * s + legSpread, 3 * s, 5 * s, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4 * s, 14 * s - legSpread, 3 * s, 5 * s, 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Shoes
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.ellipse(-4 * s, 18 * s + legSpread, 3 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4 * s, 18 * s - legSpread, 3 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jersey / torso
        ctx.fillStyle = jerseyColor;
        ctx.beginPath();
        ctx.ellipse(0, 4 * s, 10 * s, 12 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder pads (wider ellipse)
        ctx.fillStyle = jerseyColor;
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, -2 * s, 13 * s, 6 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Arms (two small ovals to the sides, animated)
        const armSwing = Math.sin(legPhase + Math.PI) * 2 * s;
        ctx.fillStyle = jerseyColor;
        ctx.beginPath();
        ctx.ellipse(-12 * s, 2 * s + armSwing, 3.5 * s, 6 * s, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(12 * s, 2 * s - armSwing, 3.5 * s, 6 * s, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Hands
        ctx.fillStyle = "#d4a574";
        ctx.beginPath();
        ctx.arc(-12 * s, 8 * s + armSwing, 2.5 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12 * s, 8 * s - armSwing, 2.5 * s, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = helmetColor;
        ctx.beginPath();
        ctx.arc(0, -10 * s, 8 * s, 0, Math.PI * 2);
        ctx.fill();

        // Facemask
        ctx.strokeStyle = "rgba(200,200,200,0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -12 * s, 4 * s, 0.3, Math.PI - 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-3 * s, -13 * s);
        ctx.lineTo(3 * s, -13 * s);
        ctx.stroke();

        // Helmet stripe
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -18 * s);
        ctx.lineTo(0, -3 * s);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Jersey number on back
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = `bold ${Math.round(9 * s)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(number, 0, 4 * s);

        ctx.restore();
      }

      // Tacklers
      for (const t of tacklersRef.current) {
        const tw = t.wide ? TACKLER_W_WIDE : TACKLER_W;
        const tlane = t.wide ? Math.min(t.lane, LANE_COUNT - 2) : t.lane;
        const tcx = t.wide
          ? SIDELINE_W + tlane * LANE_W + LANE_W
          : laneX(t.lane);
        const num = String(t.jersey);
        const tacklerScale = t.wide ? 1.15 : 1.0;
        drawFootballer(tcx, t.y, TACKLER_COLOR, "#1a3a5c", num, tacklerScale, true);
      }

      // Player
      const now = Date.now();
      const invincible = now < invincibleUntilRef.current;
      const playerX = laneX(laneRef.current);

      const playerGlow = invincible ? POWERUP_COLOR : PLAYER_GLOW;
      const jerseyCol = invincible ? POWERUP_COLOR : PLAYER_COLOR;
      const helmetCol = invincible ? "#fff8dc" : "#c44a0a";
      drawFootballer(playerX, PLAYER_Y, jerseyCol, helmetCol, "7", 1.1, false, playerGlow);

      // Football in hand (for ball carrier)
      if (!invincible) {
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.ellipse(playerX + 10, PLAYER_Y + 2, 5, 3, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(playerX + 8, PLAYER_Y + 1);
        ctx.lineTo(playerX + 12, PLAYER_Y + 3);
        ctx.stroke();
      }

      // First down flash
      if (firstDownFlashRef.current > 0) {
        const flashAlpha = firstDownFlashRef.current / 60;
        ctx.fillStyle = `rgba(221, 85, 12, ${flashAlpha * 0.15})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FIRST DOWN!", CANVAS_W / 2, CANVAS_H / 2 - 40);
      }

      // HUD: yards counter
      if (state === "playing") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(CANVAS_W / 2 - 50, 8, 100, 30);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(CANVAS_W / 2 - 50, 8, 100, 30);

        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${Math.floor(yardsRef.current)} YDS`, CANVAS_W / 2, 23);

        // Invincibility timer
        if (invincible) {
          const remaining = invincibleUntilRef.current - now;
          const barWidth = (remaining / POWERUP_DURATION) * 80;
          ctx.fillStyle = "rgba(0,0,0,0.4)";
          ctx.fillRect(CANVAS_W / 2 - 40, 42, 80, 6);
          ctx.fillStyle = POWERUP_COLOR;
          ctx.fillRect(CANVAS_W / 2 - 40, 42, barWidth, 6);
        }
      }

      // Menu overlay
      if (state === "menu") {
        ctx.fillStyle = "rgba(12, 35, 64, 0.85)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.font = "bold 42px sans-serif";
        ctx.fillStyle = PLAYER_COLOR;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("BREAKAWAY", CANVAS_W / 2, CANVAS_H / 2 - 80);

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "white";
        ctx.fillText("Dodge tacklers. Run for glory.", CANVAS_W / 2, CANVAS_H / 2 - 35);

        // Draw football icon
        ctx.fillStyle = PLAYER_COLOR;
        ctx.beginPath();
        ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2 + 20, 25, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2, CANVAS_H / 2 + 20 - 14);
        ctx.lineTo(CANVAS_W / 2, CANVAS_H / 2 + 20 + 14);
        ctx.stroke();
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(CANVAS_W / 2 - 5, CANVAS_H / 2 + 20 + i * 5);
          ctx.lineTo(CANVAS_W / 2 + 5, CANVAS_H / 2 + 20 + i * 5);
          ctx.stroke();
        }

        // Play prompt
        const blink = Math.sin(Date.now() * 0.004) > 0;
        if (blink) {
          ctx.font = "bold 16px sans-serif";
          ctx.fillStyle = PLAYER_COLOR;
          ctx.fillText("TAP or PRESS SPACE", CANVAS_W / 2, CANVAS_H / 2 + 80);
        }

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("Arrow keys / Swipe to move", CANVAS_W / 2, CANVAS_H / 2 + 110);
      }

      // Game over overlay
      if (state === "gameover") {
        ctx.fillStyle = "rgba(12, 35, 64, 0.88)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = "#ff4444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FUMBLE!", CANVAS_W / 2, CANVAS_H / 2 - 70);

        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = PLAYER_COLOR;
        ctx.fillText(`${Math.floor(yardsRef.current)} YDS`, CANVAS_W / 2, CANVAS_H / 2 - 20);

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const firstDowns = Math.floor(yardsRef.current / 100);
        ctx.fillText(
          firstDowns > 0
            ? `${firstDowns} first down${firstDowns > 1 ? "s" : ""} earned`
            : "No first downs",
          CANVAS_W / 2,
          CANVAS_H / 2 + 20
        );

        const blink = Math.sin(Date.now() * 0.004) > 0;
        if (blink) {
          ctx.font = "bold 16px sans-serif";
          ctx.fillStyle = PLAYER_COLOR;
          ctx.fillText("TAP or PRESS SPACE", CANVAS_W / 2, CANVAS_H / 2 + 70);
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [endGame]);

  // --- Render ---

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      {/* Game canvas */}
      <div ref={containerRef} className="flex-1 flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-xl border-2 border-white/10 shadow-2xl shadow-black/50 cursor-pointer touch-none"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Leaderboard */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="rounded-xl border border-white/10 bg-[#112d4e] overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3">
            <h3 className="font-[family-name:var(--font-heading)] text-sm font-semibold uppercase tracking-wide text-[#DD550C]">
              Leaderboard
            </h3>
          </div>
          {leaderboard.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No scores yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {leaderboard.map((entry, i) => (
                <div
                  key={`${entry.name}-${entry.yards}-${i}`}
                  className={`flex items-center gap-3 px-4 py-2.5 ${
                    scoreRank === i + 1 && scoreSaved
                      ? "bg-[#DD550C]/10"
                      : "hover:bg-white/5"
                  } transition-colors`}
                >
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      i === 0
                        ? "bg-[#DD550C] text-white"
                        : i < 3
                        ? "bg-[#DD550C]/50 text-white"
                        : "bg-white/10 text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {entry.name}
                    </p>
                  </div>
                  <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-[#DD550C]">
                    {entry.yards.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          {gameState === "gameover" && !isSignedIn && (
            <div className="border-t border-white/10 px-4 py-3">
              <a
                href="/api/auth/yahoo"
                className="block text-center text-xs font-semibold text-[#DD550C] hover:underline"
              >
                Sign in to save your score
              </a>
            </div>
          )}
          {gameState === "gameover" && scoreSaved && scoreRank && (
            <div className="border-t border-white/10 px-4 py-3 text-center">
              <p className="text-xs text-gray-400">
                You placed <span className="font-bold text-[#DD550C]">#{scoreRank}</span>!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
