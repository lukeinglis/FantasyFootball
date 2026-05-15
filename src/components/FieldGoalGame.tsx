"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================
// Field Goal Frenzy: A canvas-based field goal kicking mini game
// Behind-the-kicker perspective, power meter + aim mechanic
// ============================================================

// --- Colors ---
const FIELD_GREEN = "#2d5a27";
const FIELD_GREEN_ALT = "#2a5224";
const ORANGE = "#DD550C";
const NAVY = "#0C2340";
const GOALPOST_YELLOW = "#FFD700";
const SKY_TOP = "#0a1c30";
const SKY_BOTTOM = "#1a3a5c";

// --- Canvas dimensions ---
const CANVAS_W = 500;
const CANVAS_H = 500;

// --- Game constants ---
const INITIAL_DISTANCE = 20;
const DISTANCE_STEP = 5;
const MAX_MISSES = 3;
const POWER_SPEED = 0.025; // oscillation speed
const AIM_SPEED = 0.03; // aim cursor sweep speed
const BALL_FLIGHT_FRAMES = 60;

// --- Perspective constants ---
const HORIZON_Y = 160; // horizon line
const FIELD_BOTTOM_Y = CANVAS_H;
const VANISHING_X = CANVAS_W / 2;

// --- Scoring table ---
function getPointsForDistance(yards: number): number {
  if (yards >= 60) return 20;
  if (yards >= 55) return 15;
  if (yards >= 50) return 10;
  if (yards >= 45) return 7;
  if (yards >= 40) return 5;
  if (yards >= 35) return 4;
  if (yards >= 30) return 3;
  if (yards >= 25) return 2;
  return 1;
}

// --- Types ---
type GamePhase = "menu" | "power" | "aim" | "flight" | "result" | "gameover";

interface BallState {
  frame: number;
  totalFrames: number;
  startX: number;
  startY: number;
  power: number; // 0..1
  aimX: number; // -1..1 relative to goalposts
  windOffset: number;
  good: boolean;
  resultReason: string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

// --- Perspective helpers ---

// Map a world-y (0 = kicker, 1 = goalposts) to screen y
function perspY(t: number): number {
  // Non-linear perspective: objects far away compress toward horizon
  const curved = Math.pow(t, 0.7);
  return FIELD_BOTTOM_Y - curved * (FIELD_BOTTOM_Y - HORIZON_Y);
}

// Scale factor at a given depth t (0 = near, 1 = far)
function perspScale(t: number): number {
  return 1 - t * 0.85;
}

// Get goalpost dimensions for a given distance in yards
function getGoalpostParams(distance: number) {
  // Farther distance = smaller goalposts (more perspective)
  const depthT = Math.min(0.3 + (distance - 20) * 0.012, 0.9);
  const y = perspY(depthT);
  const scale = perspScale(depthT);

  const postWidth = 120 * scale; // total width between uprights
  const postHeight = 80 * scale; // upright height above crossbar
  const crossbarY = y;
  const leftX = VANISHING_X - postWidth / 2;
  const rightX = VANISHING_X + postWidth / 2;

  return { leftX, rightX, crossbarY, postHeight, postWidth, scale, depthT };
}

// --- Component ---

export default function FieldGoalGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game state refs
  const phaseRef = useRef<GamePhase>("menu");
  const distanceRef = useRef(INITIAL_DISTANCE);
  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const kicksRef = useRef(0);
  const bestScoreRef = useRef(0);

  // Power meter
  const powerRef = useRef(0); // 0..1, oscillates
  const powerDirRef = useRef(1); // 1 = up, -1 = down
  const lockedPowerRef = useRef(0);

  // Aim cursor
  const aimRef = useRef(0); // -1..1
  const aimDirRef = useRef(1);
  const lockedAimRef = useRef(0);

  // Wind
  const windRef = useRef(0); // negative = left, positive = right (mph)

  // Ball in flight
  const ballRef = useRef<BallState | null>(null);

  // Result display
  const resultTimerRef = useRef(0);
  const resultTextRef = useRef("");
  const resultGoodRef = useRef(false);

  // Animation
  const animFrameRef = useRef(0);
  const frameCountRef = useRef(0);
  const scaleRef = useRef(1);

  // React state for overlay UI
  const [gamePhase, setGamePhase] = useState<GamePhase>("menu");
  const [displayScore, setDisplayScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreRank, setScoreRank] = useState<number | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Load best score + leaderboard
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fg_best_score");
      if (saved) bestScoreRef.current = parseInt(saved, 10) || 0;
    } catch { /* noop */ }

    fetch("/api/game/fieldgoal")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {});

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setIsSignedIn(!!d.user))
      .catch(() => {});
  }, []);

  // --- Game logic ---

  const generateWind = useCallback((distance: number) => {
    if (distance < 35) {
      windRef.current = 0;
      return;
    }
    const maxWind = Math.min((distance - 30) * 0.5, 15);
    windRef.current = (Math.random() * 2 - 1) * maxWind;
    // Round to 1 decimal
    windRef.current = Math.round(windRef.current * 10) / 10;
  }, []);

  const resetGame = useCallback(() => {
    distanceRef.current = INITIAL_DISTANCE;
    scoreRef.current = 0;
    missesRef.current = 0;
    kicksRef.current = 0;
    powerRef.current = 0;
    powerDirRef.current = 1;
    aimRef.current = 0;
    aimDirRef.current = 1;
    windRef.current = 0;
    ballRef.current = null;
    resultTimerRef.current = 0;
    lockedPowerRef.current = 0;
    lockedAimRef.current = 0;
    setDisplayScore(0);
    setScoreSaved(false);
    setScoreRank(null);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    generateWind(INITIAL_DISTANCE);
    phaseRef.current = "power";
    setGamePhase("power");
  }, [resetGame, generateWind]);

  const endGame = useCallback(() => {
    phaseRef.current = "gameover";
    setGamePhase("gameover");

    const finalScore = scoreRef.current;
    setDisplayScore(finalScore);

    // Save best to localStorage
    if (finalScore > bestScoreRef.current) {
      bestScoreRef.current = finalScore;
      try {
        localStorage.setItem("fg_best_score", String(finalScore));
      } catch { /* noop */ }
    }

    // Save to server leaderboard
    if (finalScore > 0) {
      fetch("/api/game/fieldgoal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: finalScore }),
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

  const lockPower = useCallback(() => {
    if (phaseRef.current !== "power") return;
    lockedPowerRef.current = powerRef.current;
    phaseRef.current = "aim";
    setGamePhase("aim");
    aimRef.current = -1;
    aimDirRef.current = 1;
  }, []);

  const lockAim = useCallback(() => {
    if (phaseRef.current !== "aim") return;
    lockedAimRef.current = aimRef.current;

    // Calculate kick result
    const power = lockedPowerRef.current;
    const aim = lockedAimRef.current;
    const distance = distanceRef.current;
    const wind = windRef.current;

    // Power needed: scales with distance
    const requiredPower = Math.min(0.3 + (distance - 20) * 0.013, 0.95);
    const hasPower = power >= requiredPower;
    const tooMuchPower = power > requiredPower + 0.15 && distance < 50;

    // Aim: wind pushes the ball, need to be within goalposts
    const gp = getGoalpostParams(distance);
    const halfWidth = gp.postWidth / 2;
    // Aim is -1 to 1, map to pixel offset from center
    const aimPixelOffset = aim * halfWidth * 0.9;
    // Wind push: stronger at longer distances
    const windPush = wind * (distance / 60) * halfWidth * 0.06;
    const finalOffset = aimPixelOffset + windPush;
    const isOnTarget = Math.abs(finalOffset) < halfWidth * 0.85;

    let good = false;
    let reason = "";

    if (!hasPower) {
      reason = "SHORT!";
    } else if (tooMuchPower) {
      reason = "TOO LONG!";
    } else if (!isOnTarget) {
      reason = finalOffset < 0 ? "WIDE LEFT!" : "WIDE RIGHT!";
    } else {
      good = true;
      reason = "GOOD!";
    }

    // Start ball flight animation
    ballRef.current = {
      frame: 0,
      totalFrames: BALL_FLIGHT_FRAMES,
      startX: VANISHING_X,
      startY: CANVAS_H - 60,
      power,
      aimX: aim,
      windOffset: windPush / halfWidth,
      good,
      resultReason: reason,
    };

    phaseRef.current = "flight";
    setGamePhase("flight");
  }, []);

  const handleAction = useCallback(() => {
    const phase = phaseRef.current;
    if (phase === "menu" || phase === "gameover") {
      startGame();
    } else if (phase === "power") {
      lockPower();
    } else if (phase === "aim") {
      lockAim();
    }
  }, [startGame, lockPower, lockAim]);

  // --- Input handlers ---

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleAction();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAction]);

  // Mouse + touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onClick(e: MouseEvent) {
      e.preventDefault();
      handleAction();
    }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      handleAction();
    }

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => {
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
    };
  }, [handleAction]);

  // --- Resize ---

  useEffect(() => {
    function resize() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const maxW = container.clientWidth;
      const maxH = Math.min(500, window.innerHeight * 0.7);
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

    function gameLoop() {
      if (!ctx) return;
      const phase = phaseRef.current;
      frameCountRef.current++;

      // --- Update ---

      // Power meter oscillation
      if (phase === "power") {
        powerRef.current += POWER_SPEED * powerDirRef.current;
        if (powerRef.current >= 1) {
          powerRef.current = 1;
          powerDirRef.current = -1;
        } else if (powerRef.current <= 0) {
          powerRef.current = 0;
          powerDirRef.current = 1;
        }
      }

      // Aim cursor oscillation
      if (phase === "aim") {
        const speedMult = 1 + (distanceRef.current - 20) * 0.015;
        aimRef.current += AIM_SPEED * aimDirRef.current * speedMult;
        if (aimRef.current >= 1) {
          aimRef.current = 1;
          aimDirRef.current = -1;
        } else if (aimRef.current <= -1) {
          aimRef.current = -1;
          aimDirRef.current = 1;
        }
      }

      // Ball flight
      if (phase === "flight" && ballRef.current) {
        const ball = ballRef.current;
        ball.frame++;

        if (ball.frame >= ball.totalFrames) {
          // Flight complete, show result
          resultTextRef.current = ball.resultReason;
          resultGoodRef.current = ball.good;
          resultTimerRef.current = 90; // frames to show result

          if (ball.good) {
            const pts = getPointsForDistance(distanceRef.current);
            scoreRef.current += pts;
            kicksRef.current++;
            setDisplayScore(scoreRef.current);
          } else {
            missesRef.current++;
          }

          ballRef.current = null;
          phaseRef.current = "result";
          setGamePhase("result");
        }
      }

      // Result timer
      if (phase === "result") {
        resultTimerRef.current--;
        if (resultTimerRef.current <= 0) {
          if (missesRef.current >= MAX_MISSES) {
            endGame();
          } else {
            // Next kick
            if (resultGoodRef.current) {
              distanceRef.current += DISTANCE_STEP;
            }
            generateWind(distanceRef.current);
            powerRef.current = 0;
            powerDirRef.current = 1;
            aimRef.current = -1;
            aimDirRef.current = 1;
            phaseRef.current = "power";
            setGamePhase("power");
          }
        }
      }

      // --- Draw ---
      ctx.save();

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
      skyGrad.addColorStop(0, SKY_TOP);
      skyGrad.addColorStop(1, SKY_BOTTOM);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, HORIZON_Y);

      // Stars in the sky (subtle)
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      const starSeed = [23, 67, 134, 189, 245, 312, 378, 401, 56, 290];
      for (let i = 0; i < starSeed.length; i++) {
        const sx = (starSeed[i] * 1.7) % CANVAS_W;
        const sy = (starSeed[i] * 0.4) % (HORIZON_Y - 20) + 10;
        const blink = Math.sin(frameCountRef.current * 0.02 + i) * 0.5 + 0.5;
        ctx.globalAlpha = blink * 0.4;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;

      // Stadium atmosphere: side stands
      ctx.fillStyle = "#0f1a2a";
      // Left stand
      ctx.beginPath();
      ctx.moveTo(0, HORIZON_Y - 30);
      ctx.lineTo(0, CANVAS_H);
      ctx.lineTo(40, CANVAS_H);
      ctx.lineTo(20, HORIZON_Y);
      ctx.closePath();
      ctx.fill();

      // Right stand
      ctx.beginPath();
      ctx.moveTo(CANVAS_W, HORIZON_Y - 30);
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.lineTo(CANVAS_W - 40, CANVAS_H);
      ctx.lineTo(CANVAS_W - 20, HORIZON_Y);
      ctx.closePath();
      ctx.fill();

      // Crowd dots in the stands
      ctx.save();
      for (let i = 0; i < 80; i++) {
        const side = i < 40 ? "left" : "right";
        const idx = i % 40;
        const row = Math.floor(idx / 8);
        const col = idx % 8;
        const baseX = side === "left" ? 4 : CANVAS_W - 18;
        const dirX = side === "left" ? 1 : -1;
        const cx = baseX + col * 2 * dirX + row * dirX * 0.5;
        const cy = HORIZON_Y + row * 15 + col * 3 + 10;
        if (cy > CANVAS_H - 10) continue;
        const colors = ["#DD550C", "#0C2340", "#fff", "#aaa", "#DD550C"];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.4;
        ctx.fillRect(cx, cy, 2, 3);
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      // Field (perspective: wider at bottom, narrower at top)
      const fieldLeftBottom = 40;
      const fieldRightBottom = CANVAS_W - 40;
      const fieldLeftTop = VANISHING_X - 60;
      const fieldRightTop = VANISHING_X + 60;

      // Field gradient
      for (let row = 0; row < 20; row++) {
        const t0 = row / 20;
        const t1 = (row + 1) / 20;
        const y0 = HORIZON_Y + t0 * (FIELD_BOTTOM_Y - HORIZON_Y);
        const y1 = HORIZON_Y + t1 * (FIELD_BOTTOM_Y - HORIZON_Y);
        const lx0 = fieldLeftTop + t0 * (fieldLeftBottom - fieldLeftTop);
        const rx0 = fieldRightTop + t0 * (fieldRightBottom - fieldRightTop);
        const lx1 = fieldLeftTop + t1 * (fieldLeftBottom - fieldLeftTop);
        const rx1 = fieldRightTop + t1 * (fieldRightBottom - fieldRightTop);

        ctx.fillStyle = row % 2 === 0 ? FIELD_GREEN : FIELD_GREEN_ALT;
        ctx.beginPath();
        ctx.moveTo(lx0, y0);
        ctx.lineTo(rx0, y0);
        ctx.lineTo(rx1, y1);
        ctx.lineTo(lx1, y1);
        ctx.closePath();
        ctx.fill();
      }

      // Yard lines (perspective)
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 12; i++) {
        const t = i / 12;
        const y = HORIZON_Y + t * (FIELD_BOTTOM_Y - HORIZON_Y);
        const lx = fieldLeftTop + t * (fieldLeftBottom - fieldLeftTop);
        const rx = fieldRightTop + t * (fieldRightBottom - fieldRightTop);
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(rx, y);
        ctx.stroke();
      }

      // Center field line
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(VANISHING_X, HORIZON_Y);
      ctx.lineTo(VANISHING_X, CANVAS_H);
      ctx.stroke();

      // Hash marks
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      for (let i = 1; i < 12; i++) {
        const t = i / 12;
        const y = HORIZON_Y + t * (FIELD_BOTTOM_Y - HORIZON_Y);
        const lx = fieldLeftTop + t * (fieldLeftBottom - fieldLeftTop);
        const rx = fieldRightTop + t * (fieldRightBottom - fieldRightTop);
        const w = rx - lx;
        // Left hash
        ctx.beginPath();
        ctx.moveTo(lx + w * 0.35, y - 3);
        ctx.lineTo(lx + w * 0.35, y + 3);
        ctx.stroke();
        // Right hash
        ctx.beginPath();
        ctx.moveTo(lx + w * 0.65, y - 3);
        ctx.lineTo(lx + w * 0.65, y + 3);
        ctx.stroke();
      }

      // --- Goalposts ---
      const gp = getGoalpostParams(distanceRef.current);
      const { leftX, rightX, crossbarY, postHeight } = gp;

      // Goalpost shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(leftX - 1, crossbarY - postHeight - 2, rightX - leftX + 2, postHeight + 6);

      // Uprights
      ctx.strokeStyle = GOALPOST_YELLOW;
      ctx.lineWidth = Math.max(3 * gp.scale, 1.5);
      ctx.lineCap = "round";

      // Left upright
      ctx.beginPath();
      ctx.moveTo(leftX, crossbarY);
      ctx.lineTo(leftX, crossbarY - postHeight);
      ctx.stroke();

      // Right upright
      ctx.beginPath();
      ctx.moveTo(rightX, crossbarY);
      ctx.lineTo(rightX, crossbarY - postHeight);
      ctx.stroke();

      // Crossbar
      ctx.lineWidth = Math.max(4 * gp.scale, 2);
      ctx.beginPath();
      ctx.moveTo(leftX, crossbarY);
      ctx.lineTo(rightX, crossbarY);
      ctx.stroke();

      // Center support post (below crossbar)
      ctx.lineWidth = Math.max(2 * gp.scale, 1);
      ctx.beginPath();
      ctx.moveTo(VANISHING_X, crossbarY);
      ctx.lineTo(VANISHING_X, crossbarY + 15 * gp.scale);
      ctx.stroke();

      // --- Football on tee ---
      if (phase === "power" || phase === "aim") {
        const ballX = VANISHING_X;
        const ballY = CANVAS_H - 55;

        // Tee
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.moveTo(ballX - 6, CANVAS_H - 48);
        ctx.lineTo(ballX + 6, CANVAS_H - 48);
        ctx.lineTo(ballX + 3, CANVAS_H - 53);
        ctx.lineTo(ballX - 3, CANVAS_H - 53);
        ctx.closePath();
        ctx.fill();

        // Football (pointed up for field goal)
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.ellipse(ballX, ballY, 5, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Laces
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ballX, ballY - 7);
        ctx.lineTo(ballX, ballY + 7);
        ctx.stroke();
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(ballX - 2, ballY + i * 2.5);
          ctx.lineTo(ballX + 2, ballY + i * 2.5);
          ctx.stroke();
        }
      }

      // --- Kicker ---
      if (phase !== "menu" && phase !== "gameover") {
        drawKicker(ctx, VANISHING_X - 25, CANVAS_H - 40, phase, frameCountRef.current);
      }

      // --- Ball in flight ---
      if (phase === "flight" && ballRef.current) {
        const ball = ballRef.current;
        const t = ball.frame / ball.totalFrames;

        const gpTarget = getGoalpostParams(distanceRef.current);
        const targetY = gpTarget.crossbarY - gpTarget.postHeight * 0.3;

        // Horizontal: aim + wind drift
        const aimOffset = ball.aimX * gpTarget.postWidth * 0.45;
        const windDrift = ball.windOffset * gpTarget.postWidth * 0.45;
        const targetX = VANISHING_X + aimOffset + windDrift * t;

        // Parabolic arc
        const arcHeight = 120 * ball.power;
        const bx = ball.startX + (targetX - ball.startX) * t;
        const baseY = ball.startY + (targetY - ball.startY) * t;
        const arc = -4 * arcHeight * t * (t - 1);

        // Power check: if not enough power, ball drops short
        const distance = distanceRef.current;
        const requiredPower = Math.min(0.3 + (distance - 20) * 0.013, 0.95);
        let by: number;
        if (ball.power < requiredPower) {
          // Ball drops short
          const shortFactor = ball.power / requiredPower;
          by = ball.startY - arc * shortFactor + (1 - shortFactor) * 50 * t * t;
          if (by > CANVAS_H) by = CANVAS_H;
        } else if (ball.power > requiredPower + 0.15 && distance < 50) {
          // Too much power: flies over
          by = baseY - arc * 1.5;
        } else {
          by = baseY - arc;
        }

        // Ball gets smaller as it goes farther
        const ballScale = 1 - t * 0.7;
        const ballW = 5 * ballScale;
        const ballH = 8 * ballScale;

        // Ball shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(bx + 2, by + ballH + 3, ballW * 0.8, 2 * ballScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ball spin rotation
        const rotation = t * Math.PI * 6;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(rotation);

        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.ellipse(0, 0, ballW, ballH, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 0.8 * ballScale;
        ctx.beginPath();
        ctx.moveTo(0, -ballH + 1);
        ctx.lineTo(0, ballH - 1);
        ctx.stroke();

        ctx.restore();
      }

      // --- Result text ---
      if (phase === "result" && resultTimerRef.current > 0) {
        const alpha = Math.min(resultTimerRef.current / 30, 1);
        const bounceT = 1 - resultTimerRef.current / 90;
        const scale = 1 + Math.sin(bounceT * Math.PI) * 0.2;

        ctx.save();
        ctx.translate(VANISHING_X, CANVAS_H / 2 - 20);
        ctx.scale(scale, scale);

        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText(resultTextRef.current, 2, 2);

        ctx.fillStyle = resultGoodRef.current
          ? GOALPOST_YELLOW
          : "#ff4444";
        ctx.globalAlpha = alpha;
        ctx.fillText(resultTextRef.current, 0, 0);

        // Points earned
        if (resultGoodRef.current) {
          const pts = getPointsForDistance(distanceRef.current);
          ctx.font = "bold 24px sans-serif";
          ctx.fillStyle = "white";
          ctx.fillText(`+${pts} pts`, 0, 40);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // --- Power Meter (left side) ---
      if (phase === "power" || phase === "aim") {
        const meterX = 25;
        const meterY = CANVAS_H - 320;
        const meterW = 24;
        const meterH = 250;

        // Background
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        drawRoundRect(ctx, meterX, meterY, meterW, meterH, 4);
        ctx.fill();
        ctx.stroke();

        // Zones: green (low) -> yellow (mid) -> red (high)
        const zoneH = meterH / 3;
        // Bottom third: green
        ctx.fillStyle = "rgba(46,139,87,0.3)";
        ctx.fillRect(meterX + 2, meterY + meterH - zoneH + 2, meterW - 4, zoneH - 4);
        // Middle third: yellow
        ctx.fillStyle = "rgba(218,165,32,0.3)";
        ctx.fillRect(meterX + 2, meterY + meterH - 2 * zoneH + 2, meterW - 4, zoneH);
        // Top third: red
        ctx.fillStyle = "rgba(220,50,50,0.3)";
        ctx.fillRect(meterX + 2, meterY + 2, meterW - 4, zoneH);

        // Sweet spot indicator for current distance
        const reqPower = Math.min(0.3 + (distanceRef.current - 20) * 0.013, 0.95);
        const sweetY = meterY + meterH - reqPower * meterH;
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(meterX + 2, sweetY - 8, meterW - 4, 16);

        // Fill level
        const fillH = (phase === "power" ? powerRef.current : lockedPowerRef.current) * meterH;
        const fillGrad = ctx.createLinearGradient(0, meterY + meterH, 0, meterY);
        fillGrad.addColorStop(0, "#2e8b57");
        fillGrad.addColorStop(0.5, ORANGE);
        fillGrad.addColorStop(1, "#dc3232");
        ctx.fillStyle = fillGrad;
        ctx.fillRect(meterX + 3, meterY + meterH - fillH + 1, meterW - 6, fillH - 2);

        // Locked indicator
        if (phase === "aim") {
          const lockY = meterY + meterH - lockedPowerRef.current * meterH;
          ctx.strokeStyle = "white";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(meterX - 4, lockY);
          ctx.lineTo(meterX + meterW + 4, lockY);
          ctx.stroke();
        }

        // Label
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("POWER", meterX + meterW / 2, meterY + meterH + 6);
      }

      // --- Aim Cursor ---
      if (phase === "aim") {
        const gpAim = getGoalpostParams(distanceRef.current);
        const cursorY = gpAim.crossbarY - gpAim.postHeight * 0.5;
        const cursorX = VANISHING_X + aimRef.current * gpAim.postWidth * 0.55;

        // Sweeping line
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cursorX, gpAim.crossbarY + 5);
        ctx.lineTo(cursorX, gpAim.crossbarY - gpAim.postHeight - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosshair circle
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, 8 * gpAim.scale + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = ORANGE;
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Wind indicator (top right) ---
      if (phase !== "menu" && phase !== "gameover") {
        const windX = CANVAS_W - 70;
        const windY = 15;

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        drawRoundRect(ctx, windX - 10, windY - 5, 75, 35, 6);
        ctx.fill();

        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("WIND", windX + 27, windY);

        const wind = windRef.current;
        if (Math.abs(wind) < 0.1) {
          ctx.font = "bold 12px sans-serif";
          ctx.fillStyle = "white";
          ctx.fillText("CALM", windX + 27, windY + 14);
        } else {
          // Arrow
          const arrowLen = Math.min(Math.abs(wind) * 2, 25);
          const arrowDir = wind > 0 ? 1 : -1;
          const arrowCx = windX + 27;
          const arrowCy = windY + 20;

          ctx.strokeStyle = wind > 0 ? "#ff6b6b" : "#6bc5ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(arrowCx - arrowLen * arrowDir, arrowCy);
          ctx.lineTo(arrowCx + arrowLen * arrowDir, arrowCy);
          ctx.stroke();

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(arrowCx + arrowLen * arrowDir, arrowCy);
          ctx.lineTo(arrowCx + (arrowLen - 5) * arrowDir, arrowCy - 4);
          ctx.moveTo(arrowCx + arrowLen * arrowDir, arrowCy);
          ctx.lineTo(arrowCx + (arrowLen - 5) * arrowDir, arrowCy + 4);
          ctx.stroke();

          // MPH text
          ctx.font = "bold 9px sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillText(`${Math.abs(wind).toFixed(0)} mph`, arrowCx, windY + 14);
        }
      }

      // --- HUD ---
      if (phase !== "menu" && phase !== "gameover") {
        // Distance
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        drawRoundRect(ctx, CANVAS_W / 2 - 65, 8, 130, 32, 6);
        ctx.fill();

        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${distanceRef.current} YD ATTEMPT`, CANVAS_W / 2, 24);

        // Score
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        drawRoundRect(ctx, 10, 8, 80, 32, 6);
        ctx.fill();

        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "left";
        ctx.fillText("SCORE", 18, 17);

        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = ORANGE;
        ctx.fillText(String(scoreRef.current), 18, 32);

        // Misses remaining (football icons)
        const missX = CANVAS_W / 2 - 30;
        const missY = 48;
        for (let i = 0; i < MAX_MISSES; i++) {
          const mx = missX + i * 22;
          const missed = i < missesRef.current;

          ctx.save();
          if (missed) ctx.globalAlpha = 0.25;

          // Mini football
          ctx.fillStyle = "#8B4513";
          ctx.beginPath();
          ctx.ellipse(mx, missY, 7, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "white";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(mx, missY - 4);
          ctx.lineTo(mx, missY + 4);
          ctx.stroke();

          if (missed) {
            // X through it
            ctx.strokeStyle = "#ff4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mx - 6, missY - 5);
            ctx.lineTo(mx + 6, missY + 5);
            ctx.moveTo(mx + 6, missY - 5);
            ctx.lineTo(mx - 6, missY + 5);
            ctx.stroke();
          }

          ctx.restore();
        }

        // Best score
        if (bestScoreRef.current > 0) {
          ctx.font = "bold 9px sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.textAlign = "right";
          ctx.fillText(`BEST: ${bestScoreRef.current}`, CANVAS_W - 15, CANVAS_H - 10);
        }

        // Instructions
        if (phase === "power") {
          const blink = Math.sin(frameCountRef.current * 0.08) > 0;
          if (blink) {
            ctx.font = "bold 14px sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.textAlign = "center";
            ctx.fillText("HOLD for power. RELEASE to lock.", CANVAS_W / 2, CANVAS_H - 15);
          }
        } else if (phase === "aim") {
          const blink = Math.sin(frameCountRef.current * 0.08) > 0;
          if (blink) {
            ctx.font = "bold 14px sans-serif";
            ctx.fillStyle = "rgba(255,255,255,0.8)";
            ctx.textAlign = "center";
            ctx.fillText("TAP to set aim!", CANVAS_W / 2, CANVAS_H - 15);
          }
        }
      }

      // --- Menu overlay ---
      if (phase === "menu") {
        ctx.fillStyle = "rgba(12, 35, 64, 0.88)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.font = "bold 38px sans-serif";
        ctx.fillStyle = ORANGE;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("FIELD GOAL", CANVAS_W / 2, CANVAS_H / 2 - 95);
        ctx.fillText("FRENZY", CANVAS_W / 2, CANVAS_H / 2 - 55);

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText("Kick field goals. Go the distance.", CANVAS_W / 2, CANVAS_H / 2 - 15);

        // Draw goalpost icon
        ctx.strokeStyle = GOALPOST_YELLOW;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        // Left upright
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 - 20, CANVAS_H / 2 + 20);
        ctx.lineTo(CANVAS_W / 2 - 20, CANVAS_H / 2 + 55);
        ctx.stroke();
        // Right upright
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 + 20, CANVAS_H / 2 + 20);
        ctx.lineTo(CANVAS_W / 2 + 20, CANVAS_H / 2 + 55);
        ctx.stroke();
        // Crossbar
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2 - 20, CANVAS_H / 2 + 55);
        ctx.lineTo(CANVAS_W / 2 + 20, CANVAS_H / 2 + 55);
        ctx.stroke();
        // Support
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_W / 2, CANVAS_H / 2 + 55);
        ctx.lineTo(CANVAS_W / 2, CANVAS_H / 2 + 70);
        ctx.stroke();

        // Football above goalposts
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2 + 40, 6, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        const blink = Math.sin(Date.now() * 0.004) > 0;
        if (blink) {
          ctx.font = "bold 16px sans-serif";
          ctx.fillStyle = ORANGE;
          ctx.fillText("TAP or PRESS SPACE", CANVAS_W / 2, CANVAS_H / 2 + 100);
        }

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("3 misses and you are out", CANVAS_W / 2, CANVAS_H / 2 + 125);
      }

      // --- Game Over overlay ---
      if (phase === "gameover") {
        ctx.fillStyle = "rgba(12, 35, 64, 0.88)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = "#ff4444";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 80);

        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = ORANGE;
        ctx.fillText(`${scoreRef.current} PTS`, CANVAS_W / 2, CANVAS_H / 2 - 30);

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        const made = kicksRef.current;
        const total = kicksRef.current + missesRef.current;
        ctx.fillText(
          `${made}/${total} field goals made`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 10,
        );

        if (distanceRef.current > INITIAL_DISTANCE) {
          ctx.fillText(
            `Longest: ${distanceRef.current - DISTANCE_STEP} yards`,
            CANVAS_W / 2,
            CANVAS_H / 2 + 35,
          );
        }

        if (bestScoreRef.current > 0) {
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillText(
            `Best: ${bestScoreRef.current} pts`,
            CANVAS_W / 2,
            CANVAS_H / 2 + 60,
          );
        }

        const blink = Math.sin(Date.now() * 0.004) > 0;
        if (blink) {
          ctx.font = "bold 16px sans-serif";
          ctx.fillStyle = ORANGE;
          ctx.fillText("TAP or PRESS SPACE", CANVAS_W / 2, CANVAS_H / 2 + 95);
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [endGame, generateWind]);

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
                  key={`${entry.name}-${entry.score}-${i}`}
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
                    {entry.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          {gamePhase === "gameover" && !isSignedIn && (
            <div className="border-t border-white/10 px-4 py-3">
              <a
                href="/api/auth/yahoo"
                className="block text-center text-xs font-semibold text-[#DD550C] hover:underline"
              >
                Sign in to save your score
              </a>
            </div>
          )}
          {gamePhase === "gameover" && scoreSaved && scoreRank && (
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

// --- Drawing helpers ---

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawKicker(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  phase: GamePhase, frame: number,
) {
  ctx.save();
  ctx.translate(x, y);

  const kickAnim = phase === "flight" ? Math.min(frame * 0.15, Math.PI) : 0;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 12, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back leg (plant leg)
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(4, 8, 3, 6, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Kicking leg (animated during flight)
  ctx.save();
  ctx.translate(-4, 8);
  ctx.rotate(-kickAnim * 0.8);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(0, 0, 3, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Shoe
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(-1, 5, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body / jersey
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.ellipse(0, -2, 10, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulder pads
  ctx.fillStyle = ORANGE;
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.ellipse(0, -8, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Arms
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.ellipse(-11, -4, 3, 5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(11, -4, 3, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.arc(0, -16, 8, 0, Math.PI * 2);
  ctx.fill();

  // Facemask
  ctx.strokeStyle = "rgba(200,200,200,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -14, 4, 0, Math.PI);
  ctx.stroke();

  // Number
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "bold 8px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3", 0, -2);

  ctx.restore();
}
