import sharp from 'sharp';
const grid = Array.from({ length: 44 }, (_, i) => `<line x1="${i*28}" y1="0" x2="${i*28}" y2="630" stroke="rgba(42,75,215,0.09)"/>`).join('') +
             Array.from({ length: 23 }, (_, i) => `<line x1="0" y1="${i*28}" x2="1200" y2="${i*28}" stroke="rgba(42,75,215,0.09)"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#F7F5EE"/>${grid}
<rect x="96" y="290" width="560" height="44" fill="#FFE34D" transform="rotate(-1 376 312)"/>
<g transform="translate(905 175) rotate(-8) scale(2.4)">
  <circle cx="60" cy="60" r="56" fill="#FFE34D" stroke="#1C1C1C" stroke-width="4"/>
  <g transform="translate(0 6)" fill="none" stroke="#1C1C1C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M46 46 C42 60 40 72 44 84 C47 97 73 97 76 84 C80 72 78 60 74 46 C66 40 54 40 46 46 Z"/>
  <path d="M48 42 C38 38 28 34 20 26 M24 30 C24 22 27 15 32 11 M34 36 C36 28 40 22 46 19"/>
  <path d="M72 42 C82 38 92 34 100 26 M96 30 C96 22 93 15 88 11 M86 36 C84 28 80 22 74 19"/>
  <circle cx="53" cy="60" r="3.5" fill="#1C1C1C" stroke="none"/><circle cx="67" cy="60" r="3.5" fill="#1C1C1C" stroke="none"/></g></g>
<rect x="40" y="40" width="1120" height="550" fill="none" stroke="#1C1C1C" stroke-width="5" rx="18"/>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('/tmp/og-bg.png');
