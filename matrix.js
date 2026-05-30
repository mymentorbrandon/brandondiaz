// matrix.js — DIAZ | BrandonDiaz.com
// Easter Egg #1: "CHRIST IS LORD" hidden in the rain

const MatrixRain = (() => {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');

  const FONT_SIZE = 14;
  const COLOR_PRIMARY = '#00ff41';
  const COLOR_DIM = '#003b10';
  const COLOR_BRIGHT = '#ffffff';
  const COLOR_EASTER = '#ff4444'; // subtle red flash for easter egg chars

  // Easter egg message embedded in the rain
  const EASTER_MESSAGE = 'CHRIST IS LORD';
  const EASTER_CHARS = EASTER_MESSAGE.split('');

  // Katakana + latin + numbers — classic matrix feel
  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()';

  let columns = [];
  let drops = [];
  let easterEggPositions = {};
  let frameCount = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colCount = Math.floor(canvas.width / FONT_SIZE);

    drops = [];
    columns = [];
    easterEggPositions = {};

    for (let i = 0; i < colCount; i++) {
      drops[i] = Math.random() * -100;
      columns[i] = { speed: 0.3 + Math.random() * 0.7, bright: false };
    }

    // Plant easter egg across random columns, staggered rows
    plantEasterEgg();
  }

  function plantEasterEgg() {
    const colCount = Math.floor(canvas.width / FONT_SIZE);
    // Pick a starting column roughly in the middle area
    const startCol = Math.floor(colCount * 0.3 + Math.random() * colCount * 0.4);
    const startRow = Math.floor(5 + Math.random() * 10);

    EASTER_CHARS.forEach((char, i) => {
      const col = (startCol + i) % colCount;
      if (!easterEggPositions[col]) easterEggPositions[col] = [];
      easterEggPositions[col].push({ row: startRow, char });
    });
  }

  function getRandomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function isEasterEggCell(col, row) {
    if (!easterEggPositions[col]) return null;
    const found = easterEggPositions[col].find(e => Math.abs(e.row - row) < 1);
    return found ? found.char : null;
  }

  function draw() {
    frameCount++;

    // Fade trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px 'Share Tech Mono', monospace`;

    const colCount = Math.floor(canvas.width / FONT_SIZE);

    for (let i = 0; i < colCount; i++) {
      const row = drops[i];
      const x = i * FONT_SIZE;
      const y = row * FONT_SIZE;

      // Check if this position is an easter egg cell
      const easterChar = isEasterEggCell(i, row);

      if (easterChar) {
        // Render easter egg character — subtle red, slightly brighter
        ctx.fillStyle = COLOR_EASTER;
        ctx.shadowColor = COLOR_EASTER;
        ctx.shadowBlur = 8;
        ctx.fillText(easterChar, x, y);
        ctx.shadowBlur = 0;
      } else {
        // Normal matrix char
        const isBright = drops[i] % 1 < 0.1;
        ctx.fillStyle = isBright ? COLOR_BRIGHT : (Math.random() > 0.98 ? COLOR_PRIMARY : COLOR_DIM);
        ctx.fillText(getRandomChar(), x, y);
      }

      // Reset drop when it reaches bottom, with randomness
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i] += columns[i].speed;
    }

    // Re-plant easter egg occasionally so it cycles through
    if (frameCount % 600 === 0) {
      easterEggPositions = {};
      plantEasterEgg();
    }
  }

  function init() {
    resize();
    window.addEventListener('resize', resize);
    setInterval(draw, 33); // ~30fps — intentional, gives it weight
  }

  return { init };
})();

// Glitch effect for hero text
const GlitchText = (() => {
  const glitchChars = '!@#$%^&*<>[]{}|\\/?~`';

  function glitch(element, originalText, intensity = 0.3) {
    let iterations = 0;
    const maxIterations = originalText.length * 3;

    const interval = setInterval(() => {
      element.textContent = originalText
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < iterations / 3) return originalText[i];
          if (Math.random() < intensity) {
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          }
          return char;
        })
        .join('');

      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        element.textContent = originalText;
      }
    }, 40);
  }

  function initGlitchLoop(selector, interval = 8000) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const original = el.dataset.text || el.textContent;
      el.dataset.text = original;

      // Initial glitch on load
      setTimeout(() => glitch(el, original), 500 + Math.random() * 1000);

      // Random glitch loop
      setInterval(() => {
        if (Math.random() > 0.6) glitch(el, original);
      }, interval + Math.random() * 4000);
    });
  }

  return { glitch, initGlitchLoop };
})();

// Konami-style Easter Egg — type "DIAZ" anywhere to trigger hidden message
const SecretCode = (() => {
  let typed = '';
  const secret = 'DIAZ';

  function init() {
    document.addEventListener('keyup', (e) => {
      typed += e.key.toUpperCase();
      typed = typed.slice(-secret.length);
      if (typed === secret) triggerSecret();
    });
  }

  function triggerSecret() {
    const overlay = document.getElementById('secret-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => overlay.classList.remove('active'), 5000);
    }
  }

  return { init };
})();

// Scroll-based parallax
const Parallax = (() => {
  function init() {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      document.querySelectorAll('[data-parallax]').forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    });
  }

  return { init };
})();

// Boot sequence — runs on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  MatrixRain.init();
  GlitchText.initGlitchLoop('.glitch-text');
  SecretCode.init();
  Parallax.init();
});