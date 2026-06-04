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

    if (parallaxMode === 'breathe') {
      // Portal 1 — breathes toward cursor when hovering
      const rect = canvas.getBoundingClientRect();
      const portalCenterX = rect.left + rect.width / 2;
      const portalCenterY = rect.top + rect.height / 2;
      const cursorX = (mouseX * 0.5 + 0.5) * window.innerWidth;
      const cursorY = (mouseY * 0.5 + 0.5) * window.innerHeight;
      const distX = cursorX - portalCenterX;
      const distY = cursorY - portalCenterY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const maxDist = 350;
      const influence = Math.max(0, 1 - dist / maxDist);
      // Breathe scale stored on canvas
      canvas._breatheInfluence = influence;
      return {
        x: (distX / maxDist) * strength * influence,
        y: (distY / maxDist) * strength * influence
      };
    }

    if (parallaxMode === 'heartbeat') {
      // Portal 2 — heartbeat rhythm shifts the galaxy
      const beat = canvas._heartbeat || 0;
      return {
        x: Math.sin(beat * 3.2) * 12,
        y: Math.cos(beat * 1.6) * 8
      };
    }

    if (parallaxMode === 'scroll') {
      const scrollSpeed = scrollY * 0.004;
      return {
        x: Math.sin(scrollSpeed) * 20,
        y: Math.cos(scrollSpeed * 0.7) * 15
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

      const pad = 60;
      const imgAspect = bgImage.width / bgImage.height;
      const canvasAspect = W / H;
      let drawW, drawH;

      // Heartbeat portal uses CONTAIN mode — show full image
      // All others use COVER mode — fill the portal
      if (parallaxMode === 'heartbeat' || parallaxMode === 'scroll') {
        // Fit entire image inside portal with padding
        if (imgAspect > canvasAspect) {
          drawW = W * 0.95;
          drawH = drawW / imgAspect;
        } else {
          drawH = H * 0.95;
          drawW = drawH * imgAspect;
        }
      } else {
        // Cover mode — fill completely
        if (imgAspect > canvasAspect) {
          drawH = H + pad * 2;
          drawW = drawH * imgAspect;
        } else {
          drawW = W + pad * 2;
          drawH = drawW / imgAspect;
        }
        if (drawW < W + pad * 2) { drawW = W + pad * 2; drawH = drawW / imgAspect; }
        if (drawH < H + pad * 2) { drawH = H + pad * 2; drawW = drawH * imgAspect; }
      }

      const drawX = (W - drawW) / 2 + smoothOffsetX;
      const drawY = (H - drawH) / 2 + smoothOffsetY;

      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
    }

    // Radial fade — bright center, dark edges so image blends in
    const fadeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    fadeGrad.addColorStop(0, 'rgba(0,0,0,0.0)');
    fadeGrad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    fadeGrad.addColorStop(0.8, 'rgba(0,0,0,0.55)');
    fadeGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = fadeGrad;
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
    // Outer soft glow fade — multiple passes getting more transparent
    const glowLayers = [
      { width: 40, alpha: 0.04 },
      { width: 28, alpha: 0.07 },
      { width: 18, alpha: 0.12 },
      { width: 10, alpha: 0.20 },
      { width: 5,  alpha: 0.35 },
    ];

    glowLayers.forEach(layer => {
      ctx.lineWidth = layer.width;
      ctx.strokeStyle = colors.edge;
      ctx.globalAlpha = layer.alpha;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 40;
      ctx.stroke();
    });

    // Main bright edge
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = 5;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 20;
    ctx.stroke();

    // Inner white highlight
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.25;
    ctx.shadowBlur = 0;
    ctx.stroke();

    ctx.restore();

    // ── BREATHE SCALE on portal 1 ──
    if (parallaxMode === 'breathe') {
      const influence = canvas._breatheInfluence || 0;
      const breatheScale = 1 + Math.sin(time * 1.2) * 0.015 * (1 + influence * 3);
      canvas.style.transform = `scale(${breatheScale})`;
    }

    // ── HEARTBEAT on portal 2 ──
    if (parallaxMode === 'heartbeat') {
      if (!canvas._heartbeat) canvas._heartbeat = 0;
      canvas._heartbeat += 0.035;

      // Heartbeat lub-dub rhythm — two quick beats then pause
      const beat = canvas._heartbeat;
      const cycle = beat % (Math.PI * 2);
      const lub = Math.exp(-Math.pow((cycle - 0.3) / 0.15, 2));
      const dub = Math.exp(-Math.pow((cycle - 0.7) / 0.12, 2)) * 0.7;
      const pulse = (lub + dub) * 0.12;
      canvas.style.transform = `scale(${1 + pulse})`;
      canvas.style.filter = `drop-shadow(0 0 ${20 + pulse * 200}px #33cc33)`;
    }

    // ── SCROLL SURGE on portal 3 ──
    if (parallaxMode === 'scroll') {
      const scrollDelta = Math.abs(scrollY - (canvas._lastScroll || 0));
      canvas._lastScroll = scrollY;
      const surge = Math.min(scrollDelta * 0.02, 0.04);
      canvas._scrollSurge = (canvas._scrollSurge || 0) * 0.92 + surge;
      canvas.style.transform = `scale(${1 + canvas._scrollSurge})`;
      canvas.style.filter = `drop-shadow(0 0 ${20 + canvas._scrollSurge * 60}px #aacc22)`;
    }

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

  // Portal 1 — breathes toward cursor on hover
  drawPortal('portal-blue', {
    dark:   '#010a1a',
    outer:  '#0a2a88',
    inner:  '#4488ff',
    spiral: '#88bbff',
    core:   '#aaccff',
    edge:   '#4488ff',
    glow:   '#4488ff',
  }, 'images/greengalaxy.jpg', 'breathe');

  // Portal 2 — heartbeat rhythm
  drawPortal('portal-green', {
    dark:   '#010e01',
    outer:  '#0a5511',
    inner:  '#33cc33',
    spiral: '#77ff77',
    core:   '#aaffaa',
    edge:   '#33cc33',
    glow:   '#33cc33',
  }, 'images/skelton.webp', 'heartbeat');

  // Portal 3 — scroll (moves as you scroll up and down)
  drawPortal('portal-olive', {
    dark:   '#070c00',
    outer:  '#4a6600',
    inner:  '#99bb11',
    spiral: '#ccee44',
    core:   '#eeff99',
    edge:   '#aacc22',
    glow:   '#aacc22',
  }, 'images/digitalhouse.jpg', 'scroll');

});