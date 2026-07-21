/**
 * Dependency-free confetti burst.
 *
 * Deliberately vanilla (canvas + requestAnimationFrame) so it adds NO npm
 * dependency — avoids lockfile / supply-chain issues on Vercel.
 */
// Canvas 2D fillStyle cannot consume CSS variables, so the celebration burst
// uses literal Field Guide brand colors — the one documented raw-color
// exception (all other surfaces consume semantic tokens).
const ORANGE = '#e94f2d';
const BLUE = '#102a68';

export function fireConfetti() {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = [ORANGE, BLUE, '#f5a623', '#ffffff', '#2a4bb0'];
  const N = 140;
  const parts = Array.from({ length: N }, (_, i) => ({
    x: canvas.width / 2,
    y: canvas.height / 3,
    // spread outward + up, varied by index (no Math.random needed)
    vx: Math.cos((i / N) * Math.PI * 2) * (4 + (i % 7)),
    vy: Math.sin((i / N) * Math.PI * 2) * (4 + (i % 5)) - 6,
    size: 5 + (i % 4) * 2,
    color: colors[i % colors.length],
    rot: (i / N) * Math.PI * 2,
    vr: (i % 2 ? 1 : -1) * 0.2,
  }));

  let frame = 0;
  const gravity = 0.22;
  function tick() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 120);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    frame += 1;
    if (frame < 120) requestAnimationFrame(tick);
    else canvas.remove();
  }
  requestAnimationFrame(tick);
}
