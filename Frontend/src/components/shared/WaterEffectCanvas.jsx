import { useEffect, useRef } from 'react';

export default function WaterEffectCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Water ripples array
    const ripples = [];
    // Ambient rising bubbles (Subtle micro-dots)
    const bubbles = [];
    const BUBBLE_COUNT = 6;

    for (let i = 0; i < BUBBLE_COUNT; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 0.8 + 0.5,
        speedY: Math.random() * 0.2 + 0.1,
        wobbleSpeed: Math.random() * 0.01 + 0.005,
        wobbleAmp: Math.random() * 0.8 + 0.2,
        wobbleOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.12 + 0.04,
      });
    }

    // Helper to spawn a water ripple
    const createRipple = (x, y, strength = 1) => {
      ripples.push({
        x,
        y,
        radius: 0,
        maxRadius: Math.min(width, height) * 0.18 * strength,
        speed: (Math.random() * 0.5 + 1.2) * strength,
        opacity: 0.2 * strength,
        decay: 0.008 / strength,
        rings: 1,
      });
      if (ripples.length > 5) ripples.shift();
    };

    // Pointer listeners
    let lastMoveTime = 0;
    const handlePointerMove = (e) => {
      const now = performance.now();
      if (now - lastMoveTime > 300) {
        lastMoveTime = now;
        createRipple(e.clientX, e.clientY, 0.3);
      }
    };

    const handlePointerDown = (e) => {
      createRipple(e.clientX, e.clientY, 0.8);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Ambient undulating water caustics (Subtle light mesh)
      const grad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.5) * 120,
        height * 0.3 + Math.cos(time * 0.6) * 90,
        10,
        width * 0.5,
        height * 0.4,
        width * 0.6
      );
      grad.addColorStop(0, 'rgba(124, 58, 237, 0.035)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.02)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Render rising fluid bubbles
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speedY;
        const currentX = b.x + Math.sin(time + b.wobbleOffset) * b.wobbleAmp;

        if (b.y < -10) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(currentX, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${b.opacity})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(167, 139, 250, 0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Render interactive water wave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.opacity -= r.decay;

        if (r.opacity <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        // Draw multiple concentric refractive rings
        for (let ring = 0; ring < r.rings; ring++) {
          const ringRadius = r.radius - ring * 12;
          if (ringRadius <= 0) continue;

          const ringOpacity = Math.max(0, r.opacity * (1 - ring * 0.28));

          ctx.beginPath();
          ctx.arc(r.x, r.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(167, 139, 250, ${ringOpacity * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Subtle cyan highlight line
          ctx.beginPath();
          ctx.arc(r.x - 1, r.y - 1, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${ringOpacity * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
