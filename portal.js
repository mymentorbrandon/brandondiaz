// portal.js v5 — Three different parallax interactions per portal

// ── SHARED TRACKERS ──
let mouseX = 0;
let mouseY = 0;
let scrollY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
});

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── PARALLAX MODES ──
// 'mouse'    — follows cursor across whole screen (portal 2)
// 'proximity' — reacts when cursor gets close to portal (portal 1)
// 'scroll'   — moves as page scrolls up and down (portal 3)

async function drawPortal(canvasId, colors, imageSrc, parallaxMode) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const rx = W * 0.42;
  const ry = H * 0.48;

  const bgImage = await loadImage(imageSrc);

  let angle = 0;
  let time = 0;
  let smoothOffsetX = 0;
  let smoothOffsetY = 0;

  function getParallaxOffset() {
    const strength = 35;

    if (parallaxMode === 'mouse') {
      // Portal 2 — follows mouse across whole screen
      return {
        x: mouseX * strength,
        y: mouseY * strength
      };
    }

    if (parallaxMode === 'proximity') {
      // Portal 1 — reacts when cursor is near the portal
      const rect = canvas.getBoundingClientRect();
      const portalCenterX = rect.left + rect.width / 2;
      const portalCenterY = rect.top + rect.height / 2;
      const cursorX = (mouseX * 0.5 + 0.5) * window.innerWidth;
      const cursorY = (mouseY * 0.5 + 0.5) * window.innerHeight;
      const distX = cursorX - portalCenterX;
      const distY = cursorY - portalCenterY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const maxDist = 400;
      const influence = Math.max(0, 1 - dist / maxDist);
      return {
        x: (distX / maxDist) * strength * 2 * influence,
        y: (distY / maxDist) * strength * 2 * influence
      };
    }

    if (parallaxMode === 'scroll') {
      // Portal 3 — moves as page scrolls
      const rect = canvas.getBoundingClientRect();
      const portalMidpoint = rect.top + rect.height / 2 + scrollY;
      const scrollOffset = (scrollY - portalMidpoint * 0.3) * 0.15;
      return {
        x: Math.sin(scrollY * 0.003) * strength,
        y: scrollOffset
      };
    }

    return { x: 0, y: 0 };
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // ── OVAL CLIP ──
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * 0.90, ry * 0.90, 0, 0, Math.PI * 2);
    ctx.clip();

    // ── GALAXY BACKGROUND WITH PARALLAX ──
    if (bgImage) {
      const target = getParallaxOffset();

      // Smooth the movement so it feels fluid
      smoothOffsetX += (target.x - smoothOffsetX) * 0.06;
      smoothOffsetY += (target.y - smoothOffsetY) * 0.06;

      const pad = 50;
      const imgAspect = bgImage.width / bgImage.height;
      const canvasAspect = W / H;
      let drawW, drawH;

      if (imgAspect > canvasAspect) {
        drawH = H + pad * 2;
        drawW = drawH * imgAspect;
      } else {
        drawW = W + pad * 2;
        drawH = drawW / imgAspect;
      }

      const drawX = (W - drawW) / 2 + smoothOffsetX;
      const drawY = (H - drawH) / 2 + smoothOffsetY;

      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
    }

    // Dark overlay so swirl reads clearly
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 0, W, H);

    // ── SWIRL RINGS ──
    const rings = 22;
    for (let i = rings; i >= 0; i--) {
      const t = i / rings;
      const ringRx = rx * 0.95 * t;
      const ringRy = ry * 0.95 * t;
      const swirl = angle * (1 + t * 0.5) + i * 0.3;
      const alpha = 0.1 + (1 - t) * 0.45;
      const width = t < 0.2 ? 1 : t * 4;

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
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.18)`;
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

    ctx.restore(); // end clip

    // ── BUBBLY EDGE ──
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

  // Portal 1 — proximity (reacts when you get close)
  drawPortal('portal-blue', {
    dark:   '#010a1a',
    outer:  '#0a2a88',
    inner:  '#4488ff',
    spiral: '#88bbff',
    core:   '#aaccff',
    edge:   '#4488ff',
    glow:   '#4488ff',
  }, 'images/purplegalxy.jpg', 'proximity');

  // Portal 2 — mouse (follows cursor everywhere)
  drawPortal('portal-green', {
    dark:   '#010e01',
    outer:  '#0a5511',
    inner:  '#33cc33',
    spiral: '#77ff77',
    core:   '#aaffaa',
    edge:   '#33cc33',
    glow:   '#33cc33',
  }, 'images/greengalaxy.jpg', 'mouse');

  // Portal 3 — scroll (moves as you scroll up and down)
  drawPortal('portal-olive', {
    dark:   '#070c00',
    outer:  '#4a6600',
    inner:  '#99bb11',
    spiral: '#ccee44',
    core:   '#eeff99',
    edge:   '#aacc22',
    glow:   '#aacc22',
  }, 'images/redgalaxy.jpg', 'scroll');

});