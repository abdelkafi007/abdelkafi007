// scripts/build-assets.mjs
// Zero-dependency Node 20 script to generate all GitHub profile README SVG assets.
// Supports `--live` flag to fetch real repository activity from GitHub API.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { tokens, esc, chipWidth, mulberry32 } from './theme.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');

// ==========================================
// CONFIGURATION & PLACEHOLDERS
// ==========================================
export const config = {
  PUBLIC_REPOS: 11,
  REPO_DIR_1: 'ssh-bruteforce-lab',
  REPO_DIR_2: 'microjail',
  REPO_DIR_3: 'cloud-iam',
  REPO_DIR_4: 'sentinelsoc',
  REPO_URL_1: 'https://github.com/abdelkafi007/SSH-Honeypot',
  REPO_URL_2: 'https://github.com/abdelkafi007/microjail',
  REPO_URL_3: 'https://github.com/abdelkafi007/cloud-iam-reachability-engine',
  REPO_URL_4: 'https://github.com/abdelkafi007/SentinelSOC',
  SENTINELSOC_STACK: 'Python, SIEM, auth.log, Linux',
  THM_VALUE: 'Top 10%',
  THM_SUBLABEL: 'global ranking',
  HTB_VALUE: 'Level 13',
  HTB_SUBLABEL: 'beginner rank',
  LINKEDIN_URL: 'https://linkedin.com/in/abdelkafi-oumnih-91b37b32b/',
  EMAIL_ADDRESS: 'oumnihabdelkafi0@gmail.com',
};

// Default fallback activity data if offline or API unavailable
const fallbackActivity = {
  repoCount: config.PUBLIC_REPOS,
  lastPushRelative: 'yesterday',
  repos: [
    { name: 'portfolio', relative: '2 days ago' },
    { name: 'SSH-Honeypot', relative: '3 days ago' },
    { name: 'microjail', relative: '2 weeks ago' },
    { name: 'cloud-iam-reachability-engine', relative: '3 weeks ago' },
    { name: 'End-to-End-SSH-Brute-Force-Detection-Lab', relative: '1 month ago' },
  ],
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

function truncateString(str, maxLen = 40) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

function fetchGitHubRepos() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.github.com/users/abdelkafi007/repos?sort=pushed&per_page=15';
    const headers = {
      'User-Agent': 'abdelkafi007-profile-sync',
      Accept: 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
    }

    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              resolve(parsed);
            } else {
              reject(new Error(`GitHub API returned non-array payload: ${data.slice(0, 100)}`));
            }
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`GitHub API responded with status ${res.statusCode}: ${data.slice(0, 100)}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('GitHub API request timed out after 8s'));
    });
  });
}

// ==========================================
// SVG GENERATOR FUNCTIONS
// ==========================================

export function generateBanner() {
  const prng = mulberry32(7);
  const stars = [];

  while (stars.length < 70) {
    const x = Math.round((12 + prng() * (822 - 24)) * 10) / 10;
    const y = Math.round((12 + prng() * (300 - 24)) * 10) / 10;
    // Keep out of text block area (x < 300, y < 110)
    if (x < 300 && y < 110) continue;

    const r = Math.round((0.5 + prng() * 0.9) * 10) / 10;
    const op = Math.round((0.15 + prng() * 0.55) * 100) / 100;
    stars.push({ x, y, r, op });
  }

  // 12 stars twinkle with staggered timings
  const twinkleIndices = new Set([0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66]);
  let twinkleCount = 0;

  const starElements = stars.map((s, idx) => {
    if (twinkleIndices.has(idx)) {
      const dur = (3.0 + (twinkleCount * 0.35) % 3.0).toFixed(1);
      const begin = ((twinkleCount * 0.45) % 4.0).toFixed(1);
      const lowOp = Math.max(0.04, Math.round(s.op * 0.25 * 100) / 100);
      twinkleCount++;
      return `    <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#ffffff" opacity="${s.op}">
      <animate attributeName="opacity" values="${s.op};${lowOp};${s.op}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
    </circle>`;
    }
    return `    <circle cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#ffffff" opacity="${s.op}"/>`;
  }).join('\n');

  // Three server racks at cx = 215, 415, 615
  const racksConfig = [
    { cx: 215, label: 'Projects', begin: '0s' },
    { cx: 415, label: 'About Me', begin: '0.8s' },
    { cx: 615, label: 'Contacts', begin: '1.6s' },
  ];

  const rackElements = racksConfig.map((rack, rIdx) => {
    const cx = rack.cx;
    const label = rack.label;
    const chipW = Math.round(label.length * 6.6 + 20);
    const chipX = cx - Math.round(chipW / 2);

    // 6 units per rack
    const unitElements = [];
    for (let i = 0; i < 6; i++) {
      const unitY = 168 + i * 17;
      const isAccentLed = (i === 0 || i === 2 || i === 4);
      let ledElement = '';

      if (isAccentLed) {
        const dur = (1.4 + ((i * 0.4 + rIdx * 0.3) % 1.2)).toFixed(1);
        const begin = (0.2 + ((i * 0.5 + rIdx * 0.4) % 1.5)).toFixed(1);
        ledElement = `<circle cx="${cx + 20}" cy="${unitY + 7}" r="1.6" fill="${tokens.colors.accent}">
          <animate attributeName="opacity" values="1;0.25;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
        </circle>`;
      } else {
        ledElement = `<circle cx="${cx + 20}" cy="${unitY + 7}" r="1.6" fill="${tokens.colors.muted}" opacity="0.6"/>`;
      }

      unitElements.push(`      <rect x="${cx - 26}" y="${unitY}" width="52" height="14" rx="2" fill="${tokens.colors.rackUnit}" stroke="${tokens.colors.border}" stroke-width="1"/>
      <line x1="${cx - 22}" y1="${unitY + 4}" x2="${cx - 22}" y2="${unitY + 10}" stroke="${tokens.colors.muted}" stroke-opacity="0.5" stroke-width="1"/>
      <line x1="${cx - 18}" y1="${unitY + 4}" x2="${cx - 18}" y2="${unitY + 10}" stroke="${tokens.colors.muted}" stroke-opacity="0.5" stroke-width="1"/>
      ${ledElement}`);
    }

    return `  <!-- Rack at cx=${cx}: ${label} -->
  <g>
    <!-- Ground glow -->
    <ellipse cx="${cx}" cy="278" rx="44" ry="6" fill="${tokens.colors.accent}" opacity="0.08"/>
    <!-- Rack structure -->
    <rect x="${cx - 32}" y="160" width="64" height="112" rx="4" fill="${tokens.colors.rackBody}" stroke="${tokens.colors.borderStrong}" stroke-width="1"/>
    <polygon points="${cx + 32},160 ${cx + 44},154 ${cx + 44},266 ${cx + 32},272" fill="${tokens.colors.rackSide}" stroke="${tokens.colors.border}" stroke-width="1"/>
    <polygon points="${cx - 32},160 ${cx - 20},154 ${cx + 44},154 ${cx + 32},160" fill="${tokens.colors.rackTop}" stroke="${tokens.colors.border}" stroke-width="1"/>
${unitElements.join('\n')}
    <!-- Floating chip + dashed tether -->
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="4s" begin="${rack.begin}" repeatCount="indefinite"/>
      <line x1="${cx}" y1="142" x2="${cx}" y2="154" stroke="${tokens.colors.muted}" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="2,2"/>
      <rect x="${chipX}" y="120" width="${chipW}" height="22" rx="4" fill="${tokens.colors.surface}" stroke="${tokens.colors.borderStrong}" stroke-width="1"/>
      <text x="${cx}" y="135" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted2}" text-anchor="middle">${label}</text>
    </g>
  </g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 308" width="830" height="308">
  <title>Oumnih Abdelkafi — Profile Banner</title>
  <desc>Header banner with dark radial vignette, starfield, cybersecurity student bio, and three 3D server racks</desc>
  <defs>
    <radialGradient id="bannerVignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
      <stop offset="0%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="#0b0c0f"/>
    </radialGradient>
  </defs>
  <style>
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
    }
  </style>
  <!-- Background panel (inset 4px) -->
  <rect x="4" y="4" width="822" height="300" rx="12" fill="url(#bannerVignette)" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- Starfield -->
  <g id="starfield">
${starElements}
  </g>
  <!-- Text block -->
  <g id="header-text">
    <text x="32" y="52" font-family="${tokens.fonts.sans}" font-size="28" font-weight="600" fill="${tokens.colors.textBright}">Oumnih Abdelkafi</text>
    <text x="32" y="74" font-family="${tokens.fonts.sans}" font-size="13" font-weight="400" fill="${tokens.colors.muted2}">Cybersecurity Engineering — ENSAO &apos;29</text>
    <text x="32" y="94" font-family="${tokens.fonts.mono}" font-size="11" font-weight="400" fill="${tokens.colors.muted}">Morocco</text>
    <text x="32" y="110" font-family="${tokens.fonts.mono}" font-size="11" font-weight="400" fill="${tokens.colors.muted}">${config.PUBLIC_REPOS} public repos · open to internships</text>
  </g>
  <!-- Server racks -->
${rackElements}
</svg>`;
}

export function generateTerminal() {
  const line6Text = `${config.REPO_DIR_1}/  ${config.REPO_DIR_2}/  ${config.REPO_DIR_3}/  ${config.REPO_DIR_4}/`;
  const line6EstimatedWidth = Math.round(line6Text.length * 7.8);
  const cursorX = Math.min(800, 28 + line6EstimatedWidth + 6);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 258" width="830" height="258">
  <title>Terminal Intro — Oumnih Abdelkafi</title>
  <desc>Monochrome interactive terminal session showing student identity, technical focus, and projects directory</desc>
  <defs>
    <clipPath id="terminalPanelClip">
      <rect x="4" y="4" width="822" height="250" rx="12"/>
    </clipPath>
    <!-- Typing clipPaths for command lines -->
    <clipPath id="clipL1">
      <rect class="cmd-clip" x="28" y="64" width="780" height="24">
        <animate attributeName="width" from="0" to="780" dur="0.9s" begin="0.5s" fill="freeze" calcMode="linear"/>
      </rect>
    </clipPath>
    <clipPath id="clipL3">
      <rect class="cmd-clip" x="28" y="122" width="780" height="24">
        <animate attributeName="width" from="0" to="780" dur="1.2s" begin="2.2s" fill="freeze" calcMode="linear"/>
      </rect>
    </clipPath>
    <clipPath id="clipL5">
      <rect class="cmd-clip" x="28" y="180" width="780" height="24">
        <animate attributeName="width" from="0" to="780" dur="1.0s" begin="4.2s" fill="freeze" calcMode="linear"/>
      </rect>
    </clipPath>
  </defs>
  <style>
    @media (prefers-reduced-motion: reduce) {
      .cmd-clip { width: 780px !important; }
      .fade-item { opacity: 1 !important; }
      .term-cursor { display: none !important; }
    }
  </style>
  <!-- Background panel (inset 4px) -->
  <rect x="4" y="4" width="822" height="250" rx="12" fill="${tokens.colors.surface2}" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- Titlebar -->
  <g clip-path="url(#terminalPanelClip)">
    <rect x="4" y="4" width="822" height="40" fill="${tokens.colors.surface}"/>
    <line x1="4" y1="44" x2="826" y2="44" stroke="${tokens.colors.border}" stroke-width="1"/>
    <!-- Three neutral window controls -->
    <circle cx="28" cy="24" r="5" fill="${tokens.colors.borderStrong}"/>
    <circle cx="46" cy="24" r="5" fill="${tokens.colors.borderStrong}"/>
    <circle cx="64" cy="24" r="5" fill="${tokens.colors.borderStrong}"/>
    <text x="415" y="28" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted}" text-anchor="middle">guest@oumnih:~</text>
  </g>
  <!-- Terminal body -->
  <!-- Line 1: whoami (types 0.5s - 1.4s) -->
  <g clip-path="url(#clipL1)">
    <text x="28" y="80" font-family="${tokens.fonts.mono}" font-size="13" xml:space="preserve"><tspan fill="${tokens.colors.accent}">oumnih@ensao</tspan><tspan fill="${tokens.colors.muted}">:~$ </tspan><tspan fill="${tokens.colors.text}">whoami</tspan></text>
  </g>
  <!-- Line 2: whoami output (fades in at 1.6s) -->
  <text class="fade-item" x="28" y="104" font-family="${tokens.fonts.mono}" font-size="13" opacity="1">
    <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.6s" fill="freeze"/>
    <tspan fill="${tokens.colors.muted2}">&gt; Cybersecurity engineering student, ENSAO &apos;29</tspan>
  </text>
  <!-- Line 3: cat focus.txt (types 2.2s - 3.4s) -->
  <g clip-path="url(#clipL3)">
    <text x="28" y="138" font-family="${tokens.fonts.mono}" font-size="13" xml:space="preserve"><tspan fill="${tokens.colors.accent}">oumnih@ensao</tspan><tspan fill="${tokens.colors.muted}">:~$ </tspan><tspan fill="${tokens.colors.text}">cat focus.txt</tspan></text>
  </g>
  <!-- Line 4: focus output (fades in at 3.6s) -->
  <text class="fade-item" x="28" y="162" font-family="${tokens.fonts.mono}" font-size="13" opacity="1">
    <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="3.6s" fill="freeze"/>
    <tspan fill="${tokens.colors.muted2}">&gt; offensive security · threat detection · infrastructure hardening</tspan>
  </text>
  <!-- Line 5: ls projects/ (types 4.2s - 5.2s) -->
  <g clip-path="url(#clipL5)">
    <text x="28" y="196" font-family="${tokens.fonts.mono}" font-size="13" xml:space="preserve"><tspan fill="${tokens.colors.accent}">oumnih@ensao</tspan><tspan fill="${tokens.colors.muted}">:~$ </tspan><tspan fill="${tokens.colors.text}">ls projects/</tspan></text>
  </g>
  <!-- Line 6: projects output (fades in at 5.4s) -->
  <text class="fade-item" x="28" y="220" font-family="${tokens.fonts.mono}" font-size="13" opacity="1" xml:space="preserve"><animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="5.4s" fill="freeze"/><tspan fill="${tokens.colors.text}">${esc(line6Text)}</tspan></text>
  <!-- Terminal block cursor after line 6 (appears at 6s, blinks 1s cycle) -->
  <rect class="term-cursor" x="${cursorX}" y="208" width="8" height="15" fill="${tokens.colors.accent}" opacity="1">
    <set attributeName="visibility" to="hidden" begin="0s" dur="6s"/>
    <set attributeName="visibility" to="visible" begin="6s"/>
    <animate attributeName="opacity" values="1;0;1" keyTimes="0;0.5;1" dur="1s" begin="6s" calcMode="discrete" repeatCount="indefinite"/>
  </rect>
</svg>`;
}

export function generateLabel(labelKey, labelText) {
  // Estimated width: chars * 8.0px (12px mono + letter-spacing 1)
  const textWidth = Math.round(labelText.length * 8.0);
  const lineStart = 12 + textWidth + 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 40" width="830" height="40">
  <title>Section Header — ${esc(labelText)}</title>
  <desc>Minimal section divider line with label ${esc(labelText)}</desc>
  <text x="12" y="26" font-family="${tokens.fonts.mono}" font-size="12" fill="${tokens.colors.muted}" letter-spacing="1">${esc(labelText)}</text>
  <line x1="${lineStart}" y1="22" x2="818" y2="22" stroke="${tokens.colors.border}" stroke-width="1"/>
</svg>`;
}

export function generateCard(indexStr, title, descLine1, descLine2, chips) {
  let chipOffset = 24;
  const chipElements = chips.map((chip) => {
    // Monospace 10px chips: padding 8px on each side, gap 6px
    const cWidth = Math.round(chip.length * 6.0 + 16);
    const elem = `    <rect x="${chipOffset}" y="118" width="${cWidth}" height="20" rx="4" fill="${tokens.colors.surface}" stroke="${tokens.colors.border}" stroke-width="1"/>
    <text x="${chipOffset + Math.round(cWidth / 2)}" y="132" font-family="${tokens.fonts.mono}" font-size="10" fill="${tokens.colors.muted2}" text-anchor="middle">${esc(chip)}</text>`;
    chipOffset += cWidth + 6;
    return elem;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 415 156" width="415" height="156">
  <title>${esc(title)}</title>
  <desc>Project card ${indexStr}: ${esc(title)}</desc>
  <!-- Card base panel (inset 4px) -->
  <rect x="4" y="4" width="407" height="148" rx="12" fill="${tokens.colors.cardBg}" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- Top edge accent line -->
  <line x1="24" y1="4" x2="64" y2="4" stroke="${tokens.colors.accent}" stroke-width="1"/>
  <!-- Header row -->
  <text x="24" y="34" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.accent}">${indexStr}</text>
  <text x="383" y="34" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted}" text-anchor="end">view →</text>
  <!-- Title -->
  <text x="24" y="58" font-family="${tokens.fonts.sans}" font-size="15" font-weight="600" fill="${tokens.colors.textBright}">${esc(title)}</text>
  <!-- Description (2 lines) -->
  <text x="24" y="80" font-family="${tokens.fonts.sans}" font-size="12" fill="${tokens.colors.muted2}">
    <tspan x="24" dy="0">${esc(descLine1)}</tspan>
    <tspan x="24" dy="17">${esc(descLine2)}</tspan>
  </text>
  <!-- Tech chips along bottom -->
  <g>
${chipElements}
  </g>
</svg>`;
}

export function generateStack() {
  const categories = [
    { label: 'SYSTEMS', chips: ['Linux', 'Bash', 'systemd', 'iptables', 'SSH'] },
    { label: 'LANGUAGES', chips: ['Python', 'Node.js', 'Express'] },
    { label: 'SECURITY', chips: ['Log analysis', 'SIEM', 'Threat hunting', 'CTFs', 'RCON'] },
    { label: 'TOOLING', chips: ['Git', 'GitHub', 'Docker'] },
  ];

  const rowElements = categories.map((cat, rowIdx) => {
    const chipTop = 28 + rowIdx * 40;
    const labelY = chipTop + 18;
    let chipX = 150;

    const chipsSvg = cat.chips.map((chip) => {
      const cWidth = chipWidth(chip, 12, 6.6); // chars * 6.6 + 24
      const elem = `    <rect x="${chipX}" y="${chipTop}" width="${cWidth}" height="28" rx="6" fill="${tokens.colors.surface}" stroke="${tokens.colors.border}" stroke-width="1"/>
    <text x="${chipX + Math.round(cWidth / 2)}" y="${chipTop + 18}" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.text}" text-anchor="middle">${esc(chip)}</text>`;
      chipX += cWidth + 8;
      return elem;
    }).join('\n');

    return `  <!-- Row ${rowIdx}: ${cat.label} -->
  <text x="28" y="${labelY}" font-family="${tokens.fonts.mono}" font-size="10" fill="${tokens.colors.muted}" letter-spacing="1.5">${cat.label}</text>
${chipsSvg}`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 204" width="830" height="204">
  <title>Technical Stack — Oumnih Abdelkafi</title>
  <desc>Categorized technical toolkit: Systems, Languages, Security, and Tooling</desc>
  <!-- Panel base (inset 4px) -->
  <rect x="4" y="4" width="822" height="196" rx="12" fill="${tokens.colors.bgDeep}" stroke="${tokens.colors.border}" stroke-width="1"/>
${rowElements}
</svg>`;
}

export function generateProgress() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 108" width="830" height="108">
  <title>Security Labs Progress</title>
  <desc>Active laboratory progression across OverTheWire Bandit, TryHackMe, and HackTheBox</desc>
  <!-- Panel base (inset 4px) -->
  <rect x="4" y="4" width="822" height="100" rx="12" fill="${tokens.colors.bgDeep}" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- Dividers -->
  <line x1="278" y1="24" x2="278" y2="80" stroke="${tokens.colors.border}" stroke-width="1"/>
  <line x1="552" y1="24" x2="552" y2="80" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- Column 1: OverTheWire -->
  <g>
    <text x="28" y="36" font-family="${tokens.fonts.mono}" font-size="10" fill="${tokens.colors.muted}" letter-spacing="1.5">OVERTHEWIRE BANDIT</text>
    <text x="28" y="66" font-family="${tokens.fonts.mono}" font-size="22" font-weight="600" fill="${tokens.colors.textBright}">34/34</text>
    <text x="28" y="86" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted}">levels cleared</text>
  </g>
  <!-- Column 2: TryHackMe -->
  <g>
    <text x="302" y="36" font-family="${tokens.fonts.mono}" font-size="10" fill="${tokens.colors.muted}" letter-spacing="1.5">TRYHACKME</text>
    <text x="302" y="66" font-family="${tokens.fonts.mono}" font-size="22" font-weight="600" fill="${tokens.colors.textBright}">${esc(config.THM_VALUE)}</text>
    <text x="302" y="86" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted}">${esc(config.THM_SUBLABEL)}</text>
  </g>
  <!-- Column 3: HackTheBox -->
  <g>
    <text x="576" y="36" font-family="${tokens.fonts.mono}" font-size="10" fill="${tokens.colors.muted}" letter-spacing="1.5">HACKTHEBOX</text>
    <text x="576" y="66" font-family="${tokens.fonts.mono}" font-size="22" font-weight="600" fill="${tokens.colors.textBright}">${esc(config.HTB_VALUE)}</text>
    <text x="576" y="86" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted}">${esc(config.HTB_SUBLABEL)}</text>
  </g>
</svg>`;
}

export function generateActivity(activityData) {
  const data = activityData || fallbackActivity;
  const repoCount = data.repoCount || config.PUBLIC_REPOS;
  const lastPushRelative = data.lastPushRelative || 'yesterday';
  const repos = (data.repos && data.repos.length >= 5) ? data.repos.slice(0, 5) : fallbackActivity.repos;

  const yBaselines = [82, 106, 130, 154, 178];
  const rowElements = repos.map((repo, idx) => {
    const y = yBaselines[idx];
    const safeName = esc(truncateString(repo.name, 40));
    const safeRel = esc(repo.relative);
    return `  <!-- Row ${idx + 1}: ${safeName} -->
  <g>
    <circle cx="32" cy="${y - 4}" r="3" fill="${tokens.colors.accent}"/>
    <text x="46" y="${y}" font-family="${tokens.fonts.mono}" font-size="12" fill="${tokens.colors.text}">${safeName}</text>
    <text x="794" y="${y}" font-family="${tokens.fonts.mono}" font-size="11" fill="${tokens.colors.muted}" text-anchor="end">${safeRel}</text>
  </g>`;
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 210" width="830" height="210">
  <title>Recent GitHub Activity</title>
  <desc>Recently updated public repositories with relative activity timestamps</desc>
  <!-- Panel base (inset 4px) -->
  <rect x="4" y="4" width="822" height="202" rx="12" fill="${tokens.colors.bgDeep}" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- Header row -->
  <text x="28" y="44" font-family="${tokens.fonts.mono}" font-size="12" fill="${tokens.colors.text}">${repoCount} public repos</text>
  <text x="794" y="44" font-family="${tokens.fonts.mono}" font-size="12" fill="${tokens.colors.muted}" text-anchor="end">last push ${esc(lastPushRelative)}</text>
  <line x1="24" y1="58" x2="798" y2="58" stroke="${tokens.colors.border}" stroke-width="1"/>
  <!-- 5 Activity rows -->
${rowElements}
</svg>`;
}

export function generateButton(label, isPortfolio = false) {
  const accentBar = isPortfolio
    ? `  <clipPath id="btnClip">
    <rect x="4" y="4" width="164" height="36" rx="8"/>
  </clipPath>
  <rect x="4" y="4" width="3" height="36" fill="${tokens.colors.accent}" clip-path="url(#btnClip)"/>\n`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 44" width="172" height="44">
  <title>${esc(label)}</title>
  <desc>Action button: ${esc(label)}</desc>
  <!-- Button base rect (inset 4px) -->
  <rect x="4" y="4" width="164" height="36" rx="8" fill="${tokens.colors.surface}" stroke="${tokens.colors.borderStrong}" stroke-width="1"/>
${accentBar}  <text x="86" y="26" font-family="${tokens.fonts.mono}" font-size="12" fill="${tokens.colors.muted2}" text-anchor="middle">${esc(label)}</text>
</svg>`;
}

export function generateStatus() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 830 40" width="830" height="40">
  <title>Status Indicator</title>
  <desc>Current operational availability: open to internships</desc>
  <style>
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; }
    }
  </style>
  <!-- Pulsing accent dot -->
  <circle cx="16" cy="20" r="4" fill="${tokens.colors.accent}"/>
  <circle cx="16" cy="20" r="4" fill="none" stroke="${tokens.colors.accent}" stroke-width="1.5">
    <animate attributeName="r" values="4;9" dur="2s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite"/>
  </circle>
  <text x="32" y="24" font-family="${tokens.fonts.mono}" font-size="12" fill="${tokens.colors.muted2}">open to internships · cybersecurity &amp; IT infrastructure</text>
</svg>`;
}

// ==========================================
// MAIN BUILD ORCHESTRATION
// ==========================================

export async function buildAll() {
  const isLive = process.argv.includes('--live');
  let activityData = fallbackActivity;

  if (isLive) {
    try {
      console.log('Fetching live repository data from GitHub API...');
      const rawRepos = await fetchGitHubRepos();
      const filtered = rawRepos.filter((r) => !r.fork && r.name !== 'abdelkafi007');

      if (filtered.length > 0) {
        const top5 = filtered.slice(0, 5).map((r) => ({
          name: r.name,
          relative: formatRelativeTime(r.pushed_at),
        }));
        activityData = {
          repoCount: rawRepos.length,
          lastPushRelative: formatRelativeTime(filtered[0].pushed_at),
          repos: top5,
        };
        console.log(`Successfully fetched ${rawRepos.length} repos. Most recent push: ${activityData.lastPushRelative}`);
      }
    } catch (err) {
      console.warn(`Warning: GitHub API fetch failed (${err.message}). Using fallback activity data.`);
      // If activity.svg already exists, we leave it intact or use fallback
      if (fs.existsSync(path.join(assetsDir, 'activity.svg'))) {
        console.log('Existing assets/activity.svg preserved.');
      }
    }
  }

  // Ensure assets directory exists
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // Parse SentinelSOC chips
  const sentinelSocChips = config.SENTINELSOC_STACK.split(',').map((s) => s.trim()).filter(Boolean);

  const assets = [
    { name: 'banner.svg', content: generateBanner() },
    { name: 'terminal.svg', content: generateTerminal() },
    { name: 'label-projects.svg', content: generateLabel('projects', '// projects') },
    { name: 'label-stack.svg', content: generateLabel('stack', '// stack') },
    { name: 'label-progress.svg', content: generateLabel('progress', '// progress') },
    { name: 'label-activity.svg', content: generateLabel('activity', '// activity') },
    { name: 'label-contact.svg', content: generateLabel('contact', '// contact') },
    {
      name: 'card-1.svg',
      content: generateCard(
        '01',
        'SSH Brute-Force Detection Lab',
        'Log analysis, auth.log parsing and automated IP',
        'blocking with dynamic iptables rules.',
        ['Bash', 'Linux', 'iptables', 'SSH']
      ),
    },
    {
      name: 'card-2.svg',
      content: generateCard(
        '02',
        'Microjail Container Runtime',
        'Minimal OCI-inspired Linux container runtime in C using',
        'namespaces, pivot_root, cgroups v2, and seccomp-BPF.',
        ['C', 'Linux', 'cgroups', 'seccomp']
      ),
    },
    {
      name: 'card-3.svg',
      content: generateCard(
        '03',
        'Cloud IAM Reachability Engine',
        'Directed attack graph analyzer and telemetry fusion',
        'engine for multi-hop AWS IAM privilege escalation.',
        ['Python', 'AWS IAM', 'Terraform', 'Graphs']
      ),
    },
    {
      name: 'card-4.svg',
      content: generateCard(
        '04',
        'SentinelSOC',
        'SIEM and threat-hunting project for detection',
        'engineering and infrastructure monitoring.',
        sentinelSocChips
      ),
    },
    { name: 'stack.svg', content: generateStack() },
    { name: 'progress.svg', content: generateProgress() },
    { name: 'activity.svg', content: generateActivity(activityData) },
    { name: 'btn-portfolio.svg', content: generateButton('portfolio ↗', true) },
    { name: 'btn-linkedin.svg', content: generateButton('linkedin ↗', false) },
    { name: 'btn-email.svg', content: generateButton('email ↗', false) },
    { name: 'status.svg', content: generateStatus() },
  ];

  console.log(`Writing ${assets.length} SVG assets to ${assetsDir}...`);
  for (const asset of assets) {
    const filePath = path.join(assetsDir, asset.name);
    fs.writeFileSync(filePath, asset.content, 'utf8');
    const stats = fs.statSync(filePath);
    const sizeKb = (stats.size / 1024).toFixed(2);
    console.log(`  ✓ ${asset.name.padEnd(22)} ${sizeKb.padStart(6)} KB`);
  }

  console.log('Asset generation complete.');
}

// Execute if run directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildAll().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
