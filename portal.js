// portal.js v3 — More oval Rick & Morty portals

function drawPortal(canvasId, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const rx = W * 0.42;  // horizontal radius
  const ry = H * 0.48;  // vertical radius — taller = more oval

  let angle = 0;
  let time = 0;

  // Clip everything to the oval
  function setOvalClip() {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.97, ry * 0.97, 0, 0, Math.PI * 2);
    ctx.clip();
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    setOvalClip();

    // ── BACKGROUND ──
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    bg.addColorStop(0, colors.core + '33');
    bg.addColorStop(0.4, colors.dark);
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── SWIRL RINGS ──
    const rings = 22;
    for (let i = rings; i >= 0; i--) {
      const t = i / rings;
      const ringRx = rx * 0.95 * t;
      const ringRy = ry * 0.95 * t;
      const swirl = angle * (1 + t * 0.5) + i * 0.3;
      const alpha = 0.12 + (1 - t) * 0.55;
      const width = t < 0.2 ? 1 : t * 5;

      const r1 = hexToRgb(colors.outer);
      const r2 = hexToRgb(colors.inner);
      const r = Math.round(r1.r + (r2.r - r1.r) * (1 - t));
      const g = Math.round(r1.g + (r2.g - r1.g) * (1 - t));
      const b = Math.round(r1.b + (r2.b - r1.b) * (1 - t));

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(swirl);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(ringRx, 1), Math.max(ringRy, 1), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.restore();
    }

    // ── SPIRAL ARMS ──
    const arms = 8;
    for (let a = 0; a < arms; a++) {
      const armAngle = (a / arms) * Math.PI * 2 + angle * 1.8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      for (let r = 0; r <= 1; r += 0.015) {
        const spiralAngle = armAngle + r * Math.PI * 2.5;
        const x = Math.cos(spiralAngle) * rx * 0.95 * r;
        const y = Math.sin(spiralAngle) * ry * 0.95 * r;
        if (r === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const rgb = hexToRgb(colors.spiral);
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // ── CENTER CORE ──
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx * 0.35);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.2, colors.core + 'ff');
    core.addColorStop(0.6, colors.core + '66');
    core.addColorStop(1, colors.core + '00');
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.35, ry * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = core;
    ctx.fill();

    ctx.restore(); // end oval clip

    // ── BUBBLY EDGE (outside clip) ──
    ctx.save();
    ctx.beginPath();
    const bubblePoints = 80;
    for (let i = 0; i <= bubblePoints; i++) {
      const t = (i / bubblePoints) * Math.PI * 2;
      const bubble = 1
        + Math.sin(t * 8 + time * 1.5) * 0.045
        + Math.sin(t * 13 + time * 1.0) * 0.025
        + Math.sin(t * 5 - time * 2.0) * 0.035
        + Math.sin(t * 19 + time * 0.7) * 0.015;
      const x = cx + Math.cos(t) * rx * bubble;
      const y = cy + Math.sin(t) * ry * bubble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = 6;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 25;
    ctx.stroke();

    // Second edge pass for glow thickness
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.restore();

    angle += 0.010;
    time += 0.025;
    requestAnimationFrame(drawFrame);
  }

  drawFrame();
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 255, b: 0 };
}

document.addEventListener('DOMContentLoaded', () => {

  // BLUE — Web Design
  drawPortal('portal-blue', {
    dark:   '#010a1a',
    outer:  '#0a2a88',
    inner:  '#4488ff',
    spiral: '#88bbff',
    core:   '#aaccff',
    edge:   '#4488ff',
    glow:   '#4488ff',
  });

  // GREEN — Health (classic Rick & Morty green)
  drawPortal('portal-green', {
    dark:   '#010e01',
    outer:  '#0a5511',
    inner:  '#33cc33',
    spiral: '#77ff77',
    core:   '#aaffaa',
    edge:   '#33cc33',
    glow:   '#33cc33',
  });

  // OLIVE — Consulting
  drawPortal('portal-olive', {
    dark:   '#070c00',
    outer:  '#4a6600',
    inner:  '#99bb11',
    spiral: '#ccee44',
    core:   '#eeff99',
    edge:   '#aacc22',
    glow:   '#aacc22',
  });

});