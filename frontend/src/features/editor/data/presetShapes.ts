// Designer-quality preset SVG shapes
// Each entry has a name and raw SVG markup

export interface PresetShape {
  name: string;
  category: string;
  svgData: string;
  defaultWidth: number;
  defaultHeight: number;
}

export const presetShapes: PresetShape[] = [
  {
    name: '高端品牌海报',
    category: '精选广告',
    defaultWidth: 1200,
    defaultHeight: 800,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="50%" style="stop-color:#764ba2"/>
      <stop offset="100%" style="stop-color:#f093fb"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFE566"/>
      <stop offset="50%" style="stop-color:#FFD700"/>
      <stop offset="100%" style="stop-color:#FFA500"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00f2fe"/>
      <stop offset="100%" style="stop-color:#4facfe"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="20" stdDeviation="40" flood-color="#00000040"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="1200" height="800" fill="url(#bg1)"/>
  <!-- Decorative circles -->
  <circle cx="1100" cy="100" r="200" fill="#ffffff10"/>
  <circle cx="100" cy="700" r="250" fill="#ffffff08"/>
  <circle cx="600" cy="400" r="300" fill="#ffffff05"/>
  <!-- Grid pattern -->
  <g opacity="0.1" stroke="#ffffff" stroke-width="0.5">
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="600" x2="1200" y2="600"/>
    <line x1="300" y1="0" x2="300" y2="800"/>
    <line x1="600" y1="0" x2="600" y2="800"/>
    <line x1="900" y1="0" x2="900" y2="800"/>
  </g>
  <!-- Main content card -->
  <rect x="80" y="80" width="1040" height="640" rx="32" fill="#ffffff15" filter="url(#shadow)"/>
  <!-- Header -->
  <text x="600" y="160" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="300" font-size="24" fill="#ffffff90">PREMIUM COLLECTION</text>
  <!-- Main headline -->
  <text x="600" y="260" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="900" font-size="72" fill="white" filter="url(#glow)">极致体验</text>
  <text x="600" y="340" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="300" font-size="32" fill="#ffffffcc">探索无限可能</text>
  <!-- Feature boxes -->
  <rect x="120" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
  <text x="260" y="450" text-anchor="middle" font-family="Arial" font-weight="700" font-size="48" fill="url(#accent)">01</text>
  <text x="260" y="500" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="600" font-size="18" fill="white">创新设计</text>
  <text x="260" y="530" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-size="14" fill="#ffffff80">突破传统边界</text>

  <rect x="460" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
  <text x="600" y="450" text-anchor="middle" font-family="Arial" font-weight="700" font-size="48" fill="url(#accent)">02</text>
  <text x="600" y="500" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="600" font-size="18" fill="white">卓越品质</text>
  <text x="600" y="530" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-size="14" fill="#ffffff80">精工细作</text>

  <rect x="800" y="400" width="280" height="200" rx="16" fill="#ffffff20"/>
  <text x="940" y="450" text-anchor="middle" font-family="Arial" font-weight="700" font-size="48" fill="url(#accent)">03</text>
  <text x="940" y="500" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="600" font-size="18" fill="white">尊享服务</text>
  <text x="940" y="530" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-size="14" fill="#ffffff80">VIP专属体验</text>
  <!-- CTA -->
  <rect x="400" y="640" width="400" height="60" rx="30" fill="url(#gold)"/>
  <text x="600" y="680" text-anchor="middle" font-family="Microsoft YaHei, SimHei, Arial" font-weight="700" font-size="22" fill="#333">立即探索 →</text>
  <!-- Price tag -->
  <circle cx="1050" cy="180" r="60" fill="url(#gold)"/>
  <text x="1050" y="170" text-anchor="middle" font-family="Arial" font-weight="700" font-size="16" fill="#333">限时</text>
  <text x="1050" y="200" text-anchor="middle" font-family="Arial" font-weight="900" font-size="24" fill="#333">¥999</text>
</svg>`,
  },
  {
    name: 'Gold Medal Badge',
    category: 'Badges',
    defaultWidth: 160,
    defaultHeight: 160,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="medalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="50%" style="stop-color:#FFA500"/>
      <stop offset="100%" style="stop-color:#FF8C00"/>
    </linearGradient>
    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#E74C3C"/>
      <stop offset="100%" style="stop-color:#C0392B"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="#00000040"/>
    </filter>
  </defs>
  <!-- Ribbon -->
  <polygon points="70,90 55,200 85,180 100,200 100,90" fill="url(#ribbonGrad)" opacity="0.9"/>
  <polygon points="130,90 145,200 115,180 100,200 100,90" fill="url(#ribbonGrad)" opacity="0.9"/>
  <!-- Medal circle -->
  <circle cx="100" cy="75" r="55" fill="url(#medalGrad)" filter="url(#shadow)"/>
  <circle cx="100" cy="75" r="45" fill="none" stroke="#B8860B" stroke-width="2" opacity="0.5"/>
  <circle cx="100" cy="75" r="38" fill="none" stroke="#B8860B" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>
  <!-- Star -->
  <polygon points="100,40 108,60 130,62 114,76 118,98 100,86 82,98 86,76 70,62 92,60"
    fill="#FFF8DC" opacity="0.9"/>
  <!-- Shine -->
  <ellipse cx="82" cy="58" rx="18" ry="12" fill="white" opacity="0.25" transform="rotate(-30,82,58)"/>
</svg>`,
  },
  {
    name: 'Modern Dashboard Chart',
    category: 'Charts',
    defaultWidth: 240,
    defaultHeight: 180,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <linearGradient id="bar1" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#00d2ff"/>
      <stop offset="100%" style="stop-color:#3a7bd5"/>
    </linearGradient>
    <linearGradient id="bar2" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#f857a6"/>
      <stop offset="100%" style="stop-color:#ff5858"/>
    </linearGradient>
    <linearGradient id="bar3" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#00b09b"/>
      <stop offset="100%" style="stop-color:#96c93d"/>
    </linearGradient>
    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6a00"/>
      <stop offset="100%" style="stop-color:#ee0979"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="400" height="300" rx="12" fill="url(#bgGrad)"/>
  <!-- Grid lines -->
  <g stroke="#ffffff10" stroke-width="1">
    <line x1="50" y1="60" x2="370" y2="60"/>
    <line x1="50" y1="120" x2="370" y2="120"/>
    <line x1="50" y1="180" x2="370" y2="180"/>
    <line x1="50" y1="240" x2="370" y2="240"/>
  </g>
  <!-- Bars -->
  <rect x="70" y="100" width="28" height="140" rx="4" fill="url(#bar1)" opacity="0.85"/>
  <rect x="110" y="140" width="28" height="100" rx="4" fill="url(#bar2)" opacity="0.85"/>
  <rect x="150" y="80" width="28" height="160" rx="4" fill="url(#bar3)" opacity="0.85"/>
  <rect x="190" y="120" width="28" height="120" rx="4" fill="url(#bar1)" opacity="0.85"/>
  <rect x="230" y="60" width="28" height="180" rx="4" fill="url(#bar2)" opacity="0.85"/>
  <rect x="270" y="90" width="28" height="150" rx="4" fill="url(#bar3)" opacity="0.85"/>
  <rect x="310" y="70" width="28" height="170" rx="4" fill="url(#bar1)" opacity="0.85"/>
  <!-- Trend line -->
  <polyline points="84,95 124,135 164,75 204,115 244,55 284,85 324,65"
    fill="none" stroke="url(#lineGrad)" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>
  <!-- Dots on line -->
  <g fill="#fff" filter="url(#glow)">
    <circle cx="84" cy="95" r="4"/><circle cx="124" cy="135" r="4"/>
    <circle cx="164" cy="75" r="4"/><circle cx="204" cy="115" r="4"/>
    <circle cx="244" cy="55" r="4"/><circle cx="284" cy="85" r="4"/>
    <circle cx="324" cy="65" r="4"/>
  </g>
  <!-- Labels -->
  <text x="80" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Mon</text>
  <text x="118" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Tue</text>
  <text x="160" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Wed</text>
  <text x="198" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Thu</text>
  <text x="240" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Fri</text>
  <text x="278" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Sat</text>
  <text x="318" y="275" fill="#ffffff60" font-size="10" font-family="system-ui">Sun</text>
</svg>`,
  },
  {
    name: 'Abstract Geometric Art',
    category: 'Decorative',
    defaultWidth: 200,
    defaultHeight: 200,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f093fb"/>
      <stop offset="100%" style="stop-color:#f5576c"/>
    </linearGradient>
    <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#4facfe"/>
      <stop offset="100%" style="stop-color:#00f2fe"/>
    </linearGradient>
    <linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#43e97b"/>
      <stop offset="100%" style="stop-color:#38f9d7"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="#0f0f23"/>
  <!-- Rotating squares -->
  <rect x="80" y="80" width="140" height="140" rx="8" fill="none" stroke="url(#g1)" stroke-width="2" transform="rotate(15,150,150)" opacity="0.7"/>
  <rect x="95" y="95" width="110" height="110" rx="6" fill="none" stroke="url(#g2)" stroke-width="2" transform="rotate(30,150,150)" opacity="0.7"/>
  <rect x="110" y="110" width="80" height="80" rx="4" fill="none" stroke="url(#g3)" stroke-width="2" transform="rotate(45,150,150)" opacity="0.7"/>
  <rect x="125" y="125" width="50" height="50" rx="3" fill="none" stroke="url(#g4)" stroke-width="2" transform="rotate(60,150,150)" opacity="0.7"/>
  <!-- Circles -->
  <circle cx="150" cy="150" r="100" fill="none" stroke="url(#g1)" stroke-width="1.5" opacity="0.3"/>
  <circle cx="150" cy="150" r="70" fill="none" stroke="url(#g2)" stroke-width="1" stroke-dasharray="8,4" opacity="0.4"/>
  <circle cx="150" cy="150" r="40" fill="none" stroke="url(#g3)" stroke-width="1" opacity="0.5"/>
  <!-- Decorative dots -->
  <circle cx="150" cy="50" r="5" fill="url(#g1)" opacity="0.9"/>
  <circle cx="240" cy="100" r="4" fill="url(#g2)" opacity="0.8"/>
  <circle cx="250" cy="200" r="6" fill="url(#g3)" opacity="0.7"/>
  <circle cx="150" cy="250" r="4" fill="url(#g4)" opacity="0.9"/>
  <circle cx="50" cy="200" r="5" fill="url(#g1)" opacity="0.8"/>
  <circle cx="60" cy="100" r="3" fill="url(#g2)" opacity="0.7"/>
  <!-- Center diamond -->
  <polygon points="150,120 170,150 150,180 130,150" fill="url(#g1)" opacity="0.6"/>
  <!-- Connecting lines -->
  <line x1="150" y1="50" x2="240" y2="100" stroke="#667eea" stroke-width="0.5" opacity="0.3"/>
  <line x1="240" y1="100" x2="250" y2="200" stroke="#f093fb" stroke-width="0.5" opacity="0.3"/>
  <line x1="250" y1="200" x2="150" y2="250" stroke="#4facfe" stroke-width="0.5" opacity="0.3"/>
  <line x1="150" y1="250" x2="50" y2="200" stroke="#43e97b" stroke-width="0.5" opacity="0.3"/>
  <line x1="50" y1="200" x2="60" y2="100" stroke="#667eea" stroke-width="0.5" opacity="0.3"/>
  <line x1="60" y1="100" x2="150" y2="50" stroke="#f093fb" stroke-width="0.5" opacity="0.3"/>
</svg>`,
  },
  {
    name: 'Premium Star Burst',
    category: 'Decorative',
    defaultWidth: 160,
    defaultHeight: 160,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#FFD700;stop-opacity:0"/>
    </radialGradient>
    <linearGradient id="starFill" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700"/>
      <stop offset="30%" style="stop-color:#FFC107"/>
      <stop offset="70%" style="stop-color:#FF9800"/>
      <stop offset="100%" style="stop-color:#F57C00"/>
    </linearGradient>
    <filter id="starShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#F57C0060"/>
    </filter>
  </defs>
  <!-- Glow -->
  <circle cx="100" cy="100" r="90" fill="url(#starGlow)"/>
  <!-- Star -->
  <polygon
    points="100,15 118,70 175,70 128,105 145,162 100,128 55,162 72,105 25,70 82,70"
    fill="url(#starFill)" filter="url(#starShadow)"/>
  <!-- Highlight -->
  <polygon
    points="100,25 112,65 100,55 88,65"
    fill="white" opacity="0.3"/>
</svg>`,
  },
  {
    name: 'Elegant Decorative Frame',
    category: 'Frames',
    defaultWidth: 240,
    defaultHeight: 180,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#B8860B"/>
      <stop offset="50%" style="stop-color:#DAA520"/>
      <stop offset="100%" style="stop-color:#B8860B"/>
    </linearGradient>
  </defs>
  <!-- Outer frame -->
  <rect x="10" y="10" width="380" height="280" rx="8" fill="none" stroke="url(#frameGrad)" stroke-width="3"/>
  <!-- Inner frame -->
  <rect x="20" y="20" width="360" height="260" rx="6" fill="none" stroke="url(#frameGrad)" stroke-width="1" opacity="0.5"/>
  <!-- Corner ornaments - top left -->
  <path d="M30,30 Q30,60 60,30" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <path d="M30,30 Q60,30 30,60" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <circle cx="30" cy="30" r="4" fill="url(#frameGrad)"/>
  <!-- Corner ornaments - top right -->
  <path d="M370,30 Q370,60 340,30" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <path d="M370,30 Q340,30 370,60" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <circle cx="370" cy="30" r="4" fill="url(#frameGrad)"/>
  <!-- Corner ornaments - bottom left -->
  <path d="M30,270 Q30,240 60,270" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <path d="M30,270 Q60,270 30,240" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <circle cx="30" cy="270" r="4" fill="url(#frameGrad)"/>
  <!-- Corner ornaments - bottom right -->
  <path d="M370,270 Q370,240 340,270" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <path d="M370,270 Q340,270 370,240" fill="none" stroke="url(#frameGrad)" stroke-width="2"/>
  <circle cx="370" cy="270" r="4" fill="url(#frameGrad)"/>
  <!-- Top center ornament -->
  <path d="M180,10 Q200,25 220,10" fill="none" stroke="url(#frameGrad)" stroke-width="1.5"/>
  <circle cx="200" cy="18" r="3" fill="url(#frameGrad)"/>
  <!-- Bottom center ornament -->
  <path d="M180,290 Q200,275 220,290" fill="none" stroke="url(#frameGrad)" stroke-width="1.5"/>
  <circle cx="200" cy="282" r="3" fill="url(#frameGrad)"/>
  <!-- Side decorations -->
  <line x1="10" y1="150" x2="25" y2="150" stroke="url(#frameGrad)" stroke-width="1.5"/>
  <circle cx="28" cy="150" r="2.5" fill="url(#frameGrad)"/>
  <line x1="375" y1="150" x2="390" y2="150" stroke="url(#frameGrad)" stroke-width="1.5"/>
  <circle cx="372" cy="150" r="2.5" fill="url(#frameGrad)"/>
</svg>`,
  },
  {
    name: 'Neon Lightning Bolt',
    category: 'Icons',
    defaultWidth: 120,
    defaultHeight: 160,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 200">
  <defs>
    <filter id="neonGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff"/>
      <stop offset="100%" style="stop-color:#7b2ff7"/>
    </linearGradient>
  </defs>
  <rect width="150" height="200" rx="8" fill="#0a0a1a"/>
  <!-- Lightning bolt -->
  <polygon points="90,10 40,95 70,95 55,190 110,90 80,90"
    fill="url(#boltGrad)" filter="url(#neonGlow)" opacity="0.95"/>
  <!-- Secondary glow layer -->
  <polygon points="90,10 40,95 70,95 55,190 110,90 80,90"
    fill="none" stroke="#00d4ff" stroke-width="1" filter="url(#neonGlow)" opacity="0.5"/>
</svg>`,
  },
  {
    name: 'Social Profile Card',
    category: 'UI',
    defaultWidth: 220,
    defaultHeight: 160,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#f8f9fa"/>
    </linearGradient>
    <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
    <filter id="cardShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000018"/>
    </filter>
    <clipPath id="avatarClip"><circle cx="180" cy="110" r="36"/></clipPath>
  </defs>
  <!-- Card -->
  <rect x="10" y="10" width="340" height="240" rx="16" fill="url(#cardBg)" filter="url(#cardShadow)"/>
  <!-- Cover -->
  <rect x="10" y="10" width="340" height="90" rx="16" fill="url(#coverGrad)"/>
  <rect x="10" y="70" width="340" height="30" fill="url(#coverGrad)"/>
  <!-- Avatar circle -->
  <circle cx="180" cy="110" r="38" fill="white"/>
  <circle cx="180" cy="110" r="36" fill="#e2e8f0"/>
  <circle cx="180" cy="100" r="14" fill="#94a3b8"/>
  <ellipse cx="180" cy="128" rx="22" ry="12" fill="#94a3b8"/>
  <!-- Name -->
  <text x="180" y="170" text-anchor="middle" font-family="system-ui" font-weight="600" font-size="16" fill="#1e293b">Alex Designer</text>
  <!-- Role -->
  <text x="180" y="190" text-anchor="middle" font-family="system-ui" font-size="12" fill="#64748b">Senior UI/UX Designer</text>
  <!-- Stats -->
  <line x1="60" y1="210" x2="300" y2="210" stroke="#e2e8f0" stroke-width="1"/>
  <text x="120" y="238" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#1e293b">1.2K</text>
  <text x="120" y="250" text-anchor="middle" font-family="system-ui" font-size="9" fill="#94a3b8">Posts</text>
  <text x="180" y="238" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#1e293b">8.5K</text>
  <text x="180" y="250" text-anchor="middle" font-family="system-ui" font-size="9" fill="#94a3b8">Followers</text>
  <text x="240" y="238" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="600" fill="#1e293b">324</text>
  <text x="240" y="250" text-anchor="middle" font-family="system-ui" font-size="9" fill="#94a3b8">Following</text>
</svg>`,
  },
  {
    name: 'Instagram Post Template',
    category: 'Social Media',
    defaultWidth: 280,
    defaultHeight: 280,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="igBg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#FFDC80"/>
      <stop offset="25%" style="stop-color:#F77737"/>
      <stop offset="50%" style="stop-color:#F56040"/>
      <stop offset="75%" style="stop-color:#C13584"/>
      <stop offset="100%" style="stop-color:#833AB4"/>
    </linearGradient>
    <linearGradient id="igTextBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#00000000"/>
      <stop offset="100%" style="stop-color:#000000aa"/>
    </linearGradient>
    <filter id="igShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#00000030"/>
    </filter>
    <clipPath id="postClip"><rect x="20" y="20" width="360" height="360" rx="16"/></clipPath>
  </defs>
  <!-- Background with gradient -->
  <rect x="20" y="20" width="360" height="360" rx="16" fill="url(#igBg)" filter="url(#igShadow)"/>
  <!-- Decorative circles -->
  <circle cx="320" cy="80" r="120" fill="#ffffff15"/>
  <circle cx="80" cy="320" r="100" fill="#ffffff10"/>
  <circle cx="200" cy="200" r="80" fill="#ffffff08"/>
  <!-- Main content area -->
  <rect x="50" y="80" width="300" height="240" rx="12" fill="#ffffff20"/>
  <!-- Headline -->
  <text x="200" y="150" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="32" fill="white">SUMMER SALE</text>
  <text x="200" y="185" text-anchor="middle" font-family="system-ui" font-weight="400" font-size="16" fill="#ffffffcc">Up to 50% Off</text>
  <!-- Discount badge -->
  <circle cx="320" cy="120" r="35" fill="#FF3366"/>
  <text x="320" y="115" text-anchor="middle" font-family="system-ui" font-weight="700" font-size="14" fill="white">50%</text>
  <text x="320" y="130" text-anchor="middle" font-family="system-ui" font-weight="600" font-size="10" fill="white">OFF</text>
  <!-- CTA Button -->
  <rect x="130" y="260" width="140" height="40" rx="20" fill="white"/>
  <text x="200" y="286" text-anchor="middle" font-family="system-ui" font-weight="600" font-size="14" fill="#C13584">SHOP NOW</text>
  <!-- Bottom text -->
  <text x="200" y="340" text-anchor="middle" font-family="system-ui" font-size="11" fill="#ffffff90">Valid until Aug 31, 2025</text>
  <text x="200" y="358" text-anchor="middle" font-family="system-ui" font-size="9" fill="#ffffff60">@yourbrand • #summer #sale</text>
  <!-- Corner decorations -->
  <circle cx="60" cy="60" r="4" fill="white" opacity="0.5"/>
  <circle cx="340" cy="340" r="4" fill="white" opacity="0.5"/>
  <circle cx="340" cy="60" r="3" fill="white" opacity="0.4"/>
  <circle cx="60" cy="340" r="3" fill="white" opacity="0.4"/>
</svg>`,
  },
  {
    name: 'Music Player UI',
    category: 'UI',
    defaultWidth: 280,
    defaultHeight: 200,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280">
  <defs>
    <linearGradient id="playerBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e1e2f"/>
      <stop offset="100%" style="stop-color:#151521"/>
    </linearGradient>
    <linearGradient id="albumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b6b"/>
      <stop offset="100%" style="stop-color:#ee5a24"/>
    </linearGradient>
    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff6b6b"/>
      <stop offset="100%" style="stop-color:#feca57"/>
    </linearGradient>
    <filter id="playerGlow">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#ff6b6b30"/>
    </filter>
    <filter id="albumGlow">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ff6b6b50"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="400" height="280" rx="20" fill="url(#playerBg)" filter="url(#playerGlow)"/>
  <!-- Album art -->
  <rect x="30" y="30" width="100" height="100" rx="12" fill="url(#albumGrad)" filter="url(#albumGlow)"/>
  <!-- Music note icon on album -->
  <circle cx="80" cy="80" r="20" fill="#ffffff30"/>
  <circle cx="75" cy="85" r="6" fill="white"/>
  <rect x="80" y="60" width="3" height="28" rx="1" fill="white"/>
  <circle cx="88" cy="78" r="5" fill="white"/>
  <!-- Song info -->
  <text x="150" y="60" font-family="system-ui" font-weight="600" font-size="18" fill="white">Sunset Vibes</text>
  <text x="150" y="82" font-family="system-ui" font-size="13" fill="#ffffff80">Chill Beats</text>
  <text x="150" y="102" font-family="system-ui" font-size="11" fill="#ffffff50">Album: Summer Nights</text>
  <!-- Like button -->
  <path d="M350 55 L355 50 L362 50 L367 55 L367 62 L358 72 L350 62 Z" fill="#ff6b6b" opacity="0.9"/>
  <!-- Progress bar background -->
  <rect x="30" y="155" width="340" height="4" rx="2" fill="#ffffff20"/>
  <!-- Progress bar -->
  <rect x="30" y="155" width="180" height="4" rx="2" fill="url(#progressGrad)"/>
  <!-- Progress dot -->
  <circle cx="210" cy="157" r="6" fill="white"/>
  <!-- Time -->
  <text x="30" y="180" font-family="system-ui" font-size="10" fill="#ffffff60">2:34</text>
  <text x="350" y="180" text-anchor="end" font-family="system-ui" font-size="10" fill="#ffffff60">4:12</text>
  <!-- Controls -->
  <!-- Previous -->
  <g transform="translate(120, 210)">
    <polygon points="0,10 15,0 15,20" fill="#ffffff80"/>
    <polygon points="15,10 30,0 30,20" fill="#ffffff80"/>
  </g>
  <!-- Play button -->
  <circle cx="200" cy="220" r="25" fill="url(#progressGrad)"/>
  <polygon points="193,208 193,232 215,220" fill="white"/>
  <!-- Next -->
  <g transform="translate(250, 210)">
    <polygon points="0,0 0,20 15,10" fill="#ffffff80"/>
    <polygon points="15,0 15,20 30,10" fill="#ffffff80"/>
  </g>
  <!-- Volume -->
  <rect x="320" y="215" width="50" height="3" rx="1.5" fill="#ffffff30"/>
  <rect x="320" y="215" width="30" height="3" rx="1.5" fill="#ffffff80"/>
  <circle cx="285" cy="217" r="8" fill="none" stroke="#ffffff60" stroke-width="1.5"/>
  <rect x="295" y="210" width="2" height="14" rx="1" fill="#ffffff60"/>
  <!-- Playlist indicator -->
  <rect x="30" y="250" width="80" height="20" rx="10" fill="#ffffff10"/>
  <text x="50" y="264" font-family="system-ui" font-size="9" fill="#ffffff80">♪ Playlist</text>
</svg>`,
  },
  {
    name: 'Analytics Dashboard',
    category: 'Dashboards',
    defaultWidth: 320,
    defaultHeight: 200,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">
  <defs>
    <linearGradient id="dashBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f0f1a"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="100%" style="stop-color:#764ba2"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#11998e"/>
      <stop offset="100%" style="stop-color:#38ef7d"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f093fb"/>
      <stop offset="100%" style="stop-color:#f5576c"/>
    </linearGradient>
    <filter id="dashGlow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#00000050"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="500" height="300" rx="16" fill="url(#dashBg)"/>
  <!-- Header -->
  <text x="25" y="30" font-family="system-ui" font-weight="600" font-size="14" fill="white">Analytics Overview</text>
  <text x="25" y="48" font-family="system-ui" font-size="10" fill="#ffffff50">Last 30 days</text>
  <!-- Stats cards -->
  <!-- Revenue card -->
  <rect x="25" y="65" width="145" height="70" rx="10" fill="#ffffff08"/>
  <text x="40" y="90" font-family="system-ui" font-size="10" fill="#ffffff60">Revenue</text>
  <text x="40" y="115" font-family="system-ui" font-weight="700" font-size="22" fill="white">$24.5K</text>
  <text x="40" y="128" font-family="system-ui" font-size="9" fill="#38ef7d">↑ 12.5%</text>
  <!-- Users card -->
  <rect x="180" y="65" width="145" height="70" rx="10" fill="#ffffff08"/>
  <text x="195" y="90" font-family="system-ui" font-size="10" fill="#ffffff60">Users</text>
  <text x="195" y="115" font-family="system-ui" font-weight="700" font-size="22" fill="white">8,420</text>
  <text x="195" y="128" font-family="system-ui" font-size="9" fill="#38ef7d">↑ 8.2%</text>
  <!-- Orders card -->
  <rect x="335" y="65" width="140" height="70" rx="10" fill="#ffffff08"/>
  <text x="350" y="90" font-family="system-ui" font-size="10" fill="#ffffff60">Orders</text>
  <text x="350" y="115" font-family="system-ui" font-weight="700" font-size="22" fill="white">1,284</text>
  <text x="350" y="128" font-family="system-ui" font-size="9" fill="#f5576c">↓ 3.1%</text>
  <!-- Chart area -->
  <rect x="25" y="145" width="300" height="130" rx="10" fill="#ffffff05"/>
  <text x="40" y="168" font-family="system-ui" font-size="11" fill="#ffffff80">Revenue Trend</text>
  <!-- Grid lines -->
  <g stroke="#ffffff10" stroke-width="1">
    <line x1="40" y1="190" x2="310" y2="190"/>
    <line x1="40" y1="220" x2="310" y2="220"/>
    <line x1="40" y1="250" x2="310" y2="250"/>
  </g>
  <!-- Area chart -->
  <path d="M40,250 L70,230 L100,240 L130,210 L160,220 L190,190 L220,200 L250,180 L280,195 L310,175 L310,250 Z" fill="url(#blueGrad)" opacity="0.3"/>
  <path d="M40,250 L70,230 L100,240 L130,210 L160,220 L190,190 L220,200 L250,180 L280,195 L310,175" fill="none" stroke="url(#blueGrad)" stroke-width="2"/>
  <!-- Chart dots -->
  <g fill="white">
    <circle cx="70" cy="230" r="3"/><circle cx="130" cy="210" r="3"/>
    <circle cx="190" cy="190" r="3"/><circle cx="250" cy="180" r="3"/>
    <circle cx="310" cy="175" r="4" fill="url(#blueGrad)"/>
  </g>
  <!-- Pie chart area -->
  <rect x="335" y="145" width="140" height="130" rx="10" fill="#ffffff05"/>
  <text x="350" y="168" font-family="system-ui" font-size="11" fill="#ffffff80">Traffic Sources</text>
  <!-- Pie chart -->
  <circle cx="405" cy="225" r="40" fill="none" stroke="url(#blueGrad)" stroke-width="20" stroke-dasharray="100 151" stroke-dashoffset="0" transform="rotate(-90,405,225)"/>
  <circle cx="405" cy="225" r="40" fill="none" stroke="url(#greenGrad)" stroke-width="20" stroke-dasharray="60 191" stroke-dashoffset="-100" transform="rotate(-90,405,225)"/>
  <circle cx="405" cy="225" r="40" fill="none" stroke="url(#orangeGrad)" stroke-width="20" stroke-dasharray="40 211" stroke-dashoffset="-160" transform="rotate(-90,405,225)"/>
  <!-- Legend -->
  <circle cx="350" cy="210" r="4" fill="url(#blueGrad)"/>
  <text x="360" y="213" font-family="system-ui" font-size="8" fill="#ffffff60">Direct</text>
  <circle cx="350" cy="225" r="4" fill="url(#greenGrad)"/>
  <text x="360" y="228" font-family="system-ui" font-size="8" fill="#ffffff60">Organic</text>
  <circle cx="350" cy="240" r="4" fill="url(#orangeGrad)"/>
  <text x="360" y="243" font-family="system-ui" font-size="8" fill="#ffffff60">Social</text>
</svg>`,
  },
  {
    name: '淘宝双十一促销海报',
    category: '电商广告',
    defaultWidth: 800,
    defaultHeight: 500,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="promoBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF4D00"/>
      <stop offset="50%" style="stop-color:#FF6B00"/>
      <stop offset="100%" style="stop-color:#FF8533"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFE566"/>
      <stop offset="50%" style="stop-color:#FFD700"/>
      <stop offset="100%" style="stop-color:#FFA500"/>
    </linearGradient>
    <linearGradient id="redGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FF3333"/>
      <stop offset="100%" style="stop-color:#CC0000"/>
    </linearGradient>
    <filter id="promoShadow">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#00000040"/>
    </filter>
    <filter id="textGlow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#FFD70080"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="800" height="500" fill="url(#promoBg)"/>
  <!-- Decorative patterns -->
  <circle cx="50" cy="50" r="80" fill="#ffffff10"/>
  <circle cx="750" cy="450" r="100" fill="#ffffff08"/>
  <circle cx="400" cy="250" r="150" fill="#ffffff05"/>
  <!-- Confetti-like dots -->
  <circle cx="100" cy="100" r="6" fill="#FFD700" opacity="0.8"/>
  <circle cx="200" cy="80" r="4" fill="#FFE566" opacity="0.7"/>
  <circle cx="600" cy="120" r="5" fill="#FF3333" opacity="0.8"/>
  <circle cx="700" cy="60" r="7" fill="#FFD700" opacity="0.6"/>
  <circle cx="150" cy="400" r="5" fill="#FFE566" opacity="0.7"/>
  <circle cx="650" cy="380" r="6" fill="#FF3333" opacity="0.8"/>
  <circle cx="50" cy="300" r="4" fill="#FFD700" opacity="0.6"/>
  <circle cx="750" cy="200" r="5" fill="#FFE566" opacity="0.7"/>
  <!-- Main banner area -->
  <rect x="50" y="60" width="700" height="380" rx="24" fill="#ffffff15" filter="url(#promoShadow)"/>
  <!-- Header ribbon -->
  <rect x="0" y="0" width="800" height="50" fill="url(#redGrad)"/>
  <text x="400" y="32" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700" font-size="20" fill="white">天猫双十一全球狂欢节</text>
  <!-- Main headline -->
  <text x="400" y="130" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="48" fill="url(#goldGrad)" filter="url(#textGlow)">狂欢盛典</text>
  <!-- Sub headline -->
  <text x="400" y="180" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700" font-size="28" fill="white">全场商品 低至5折</text>
  <!-- Discount badge -->
  <circle cx="650" cy="150" r="50" fill="url(#redGrad)"/>
  <circle cx="650" cy="150" r="45" fill="url(#goldGrad)"/>
  <text x="650" y="140" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="24" fill="#CC0000">5折</text>
  <text x="650" y="165" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700" font-size="14" fill="#CC0000">起</text>
  <!-- Product showcase area -->
  <rect x="80" y="200" width="150" height="180" rx="12" fill="#ffffff20"/>
  <rect x="90" y="210" width="130" height="100" rx="8" fill="#ffffff30"/>
  <text x="155" y="280" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">爆款手机</text>
  <text x="155" y="330" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="18" fill="#FFD700">¥2999</text>
  <text x="155" y="360" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="12" fill="#ffffff80">原价 ¥5999</text>

  <rect x="250" y="200" width="150" height="180" rx="12" fill="#ffffff20"/>
  <rect x="260" y="210" width="130" height="100" rx="8" fill="#ffffff30"/>
  <text x="325" y="280" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">时尚穿搭</text>
  <text x="325" y="330" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="18" fill="#FFD700">¥199</text>
  <text x="325" y="360" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="12" fill="#ffffff80">原价 ¥399</text>

  <rect x="420" y="200" width="150" height="180" rx="12" fill="#ffffff20"/>
  <rect x="430" y="210" width="130" height="100" rx="8" fill="#ffffff30"/>
  <text x="495" y="280" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">家电数码</text>
  <text x="495" y="330" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="18" fill="#FFD700">¥1499</text>
  <text x="495" y="360" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="12" fill="#ffffff80">原价 ¥2999</text>
  <!-- CTA button -->
  <rect x="250" y="420" width="300" height="50" rx="25" fill="url(#goldGrad)"/>
  <text x="400" y="452" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700" font-size="20" fill="#CC0000">立即抢购 →</text>
  <!-- Timer section -->
  <rect x="590" y="200" width="150" height="180" rx="12" fill="#ffffff20"/>
  <text x="665" y="230" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700" font-size="14" fill="white">限时倒计时</text>
  <!-- Timer boxes -->
  <rect x="605" y="250" width="35" height="50" rx="6" fill="url(#redGrad)"/>
  <text x="622" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="white">02</text>
  <rect x="650" y="250" width="35" height="50" rx="6" fill="url(#redGrad)"/>
  <text x="667" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="white">15</text>
  <rect x="695" y="250" width="35" height="50" rx="6" fill="url(#redGrad)"/>
  <text x="712" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="white">30</text>
  <text x="622" y="310" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="10" fill="#ffffff80">时</text>
  <text x="667" y="310" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="10" fill="#ffffff80">分</text>
  <text x="712" y="310" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="10" fill="#ffffff80">秒</text>
  <!-- Additional info -->
  <text x="665" y="350" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff90">活动时间</text>
  <text x="665" y="370" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="12" fill="white">11.01 - 11.11</text>
  <!-- Brand footer -->
  <text x="400" y="485" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff80">天猫双十一 | 天猫理想生活 | 更多优惠等你来</text>
</svg>`,
  },
  {
    name: '京东618大促海报',
    category: '电商广告',
    defaultWidth: 800,
    defaultHeight: 560,
    svgData: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560">
  <defs>
    <linearGradient id="jdBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E4393C"/>
      <stop offset="50%" style="stop-color:#F23D40"/>
      <stop offset="100%" style="stop-color:#C8161D"/>
    </linearGradient>
    <linearGradient id="jdGold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#FFF176"/>
      <stop offset="50%" style="stop-color:#FFD54F"/>
      <stop offset="100%" style="stop-color:#FFAB00"/>
    </linearGradient>
    <linearGradient id="jdBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1976D2"/>
      <stop offset="100%" style="stop-color:#2196F3"/>
    </linearGradient>
    <filter id="jdShadow">
      <feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#00000030"/>
    </filter>
    <filter id="jdGlow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#FFD54F60"/>
    </filter>
  </defs>
  <!-- Background -->
  <rect width="800" height="560" fill="url(#jdBg)"/>
  <!-- Decorative elements -->
  <polygon points="0,0 200,0 0,200" fill="#ffffff10"/>
  <polygon points="800,560 600,560 800,360" fill="#ffffff10"/>
  <!-- Pattern circles -->
  <circle cx="700" cy="100" r="60" fill="#ffffff08"/>
  <circle cx="100" cy="460" r="80" fill="#ffffff08"/>
  <!-- Confetti -->
  <rect x="50" y="30" width="8" height="8" fill="#FFD54F" transform="rotate(45,54,34)"/>
  <rect x="750" y="50" width="6" height="6" fill="#FFF176" transform="rotate(30,753,53)"/>
  <rect x="600" y="20" width="10" height="10" fill="#2196F3" transform="rotate(60,605,25)"/>
  <rect x="150" y="530" width="8" height="8" fill="#FFD54F" transform="rotate(45,154,534)"/>
  <rect x="650" y="500" width="6" height="6" fill="#FFF176" transform="rotate(30,653,503)"/>
  <!-- Main card -->
  <rect x="40" y="80" width="720" height="420" rx="24" fill="#ffffff15" filter="url(#jdShadow)"/>
  <!-- Header -->
  <rect x="40" y="80" width="720" height="60" rx="24" fill="#ffffff20"/>
  <rect x="40" y="110" width="720" height="30" fill="#ffffff20"/>
  <text x="400" y="115" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="32" fill="url(#jdGold)" filter="url(#jdGlow)">618年中大促</text>
  <!-- JD logo placeholder -->
  <rect x="60" y="90" width="80" height="40" rx="8" fill="url(#jdBlue)"/>
  <text x="100" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="white">JD</text>
  <!-- Main headline -->
  <text x="400" y="180" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="36" fill="white">全场狂欢 · 超值钜惠</text>
  <!-- Sub text -->
  <text x="400" y="210" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="18" fill="#ffffff90">百亿补贴 · 品质保障 · 正品低价</text>
  <!-- Price showcase -->
  <rect x="60" y="230" width="200" height="130" rx="16" fill="#ffffff25"/>
  <rect x="70" y="240" width="180" height="80" rx="12" fill="#ffffff35"/>
  <text x="160" y="290" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">数码相机</text>
  <text x="160" y="330" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="24" fill="url(#jdGold)">¥1299</text>
  <text x="160" y="355" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff70">补贴价 ¥2999</text>

  <rect x="280" y="230" width="200" height="130" rx="16" fill="#ffffff25"/>
  <rect x="290" y="240" width="180" height="80" rx="12" fill="#ffffff35"/>
  <text x="380" y="290" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">智能手表</text>
  <text x="380" y="330" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="24" fill="url(#jdGold)">¥599</text>
  <text x="380" y="355" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff70">补贴价 ¥1299</text>

  <rect x="500" y="230" width="200" height="130" rx="16" fill="#ffffff25"/>
  <rect x="510" y="240" width="180" height="80" rx="12" fill="#ffffff35"/>
  <text x="600" y="290" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">蓝牙耳机</text>
  <text x="600" y="330" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="24" fill="url(#jdGold)">¥199</text>
  <text x="600" y="355" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff70">补贴价 ¥399</text>
  <!-- Special offer badge -->
  <circle cx="710" cy="180" r="40" fill="url(#jdGold)"/>
  <text x="710" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="20" fill="#C8161D">省</text>
  <text x="710" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="#C8161D">¥1700</text>
  <!-- Coupon section -->
  <rect x="60" y="380" width="240" height="80" rx="12" fill="#ffffff20"/>
  <rect x="60" y="380" width="60" height="80" fill="url(#jdGold)"/>
  <text x="90" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#C8161D">¥50</text>
  <text x="180" y="410" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">满200可用</text>
  <text x="180" y="430" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff70">全品类通用券</text>
  <text x="270" y="430" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="12" fill="#FFD54F">领取</text>

  <rect x="320" y="380" width="240" height="80" rx="12" fill="#ffffff20"/>
  <rect x="320" y="380" width="60" height="80" fill="url(#jdGold)"/>
  <text x="350" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#C8161D">¥100</text>
  <text x="440" y="410" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">满500可用</text>
  <text x="440" y="430" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff70">数码家电专用</text>
  <text x="530" y="430" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="12" fill="#FFD54F">领取</text>

  <rect x="580" y="380" width="160" height="80" rx="12" fill="#ffffff20"/>
  <text x="660" y="410" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="600" font-size="14" fill="white">新人专享</text>
  <text x="660" y="440" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="900" font-size="18" fill="url(#jdGold)">首单立减</text>
  <!-- CTA -->
  <rect x="200" y="480" width="400" height="50" rx="25" fill="url(#jdGold)"/>
  <text x="400" y="510" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-weight="700" font-size="20" fill="#C8161D">立即参与抢购 →</text>
  <!-- Footer -->
  <text x="400" y="550" text-anchor="middle" font-family="Microsoft YaHei, SimHei, sans-serif" font-size="11" fill="#ffffff70">京东618 · 多快好省 · 品质生活</text>
</svg>`,
  },
];
