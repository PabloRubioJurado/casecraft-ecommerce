/**
 * Ilustraciones SVG de fundas de móvil, una por categoría.
 * Sustituyen a las imágenes de producto (que aún no existen) y se generan
 * de forma determinista a partir del id del producto.
 */
export type CaseKind = 'clear' | 'magsafe' | 'eco' | 'rugged' | 'leather';

const BODY = 'x="8" y="8" width="184" height="384" rx="36"';

const PALETTES: Record<CaseKind, string[]> = {
  clear: ['#2A3F6E', '#3A3A44', '#7B3F58', '#2F5D57'], // color del móvil que se ve a través
  magsafe: ['#E8472B', '#2D4BF0', '#1B1F27', '#E9B949'],
  eco: ['#8FA37A', '#C9B99A', '#6F8F7B', '#B3A27D'],
  rugged: ['#2B2F36', '#3C4A3B', '#4B3F36', '#1F3A5F'],
  leather: ['#8A4B2A', '#5A3825', '#B0783C', '#2F3B4F'],
};

const RUGGED_ACCENTS = ['#F2C230', '#FF6B35', '#7BE0C3', '#E8EAF0'];

function rng(seed: number) {
  let s = (Math.abs(seed) * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function lens(cx: number, cy: number) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="14" fill="#0a0d12"/>` +
    `<circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="7" fill="#1b2a45"/>` +
    `<circle cx="${cx - 2.5}" cy="${cy - 2.5}" r="2" fill="#fff" fill-opacity=".55"/>`
  );
}

function camera() {
  return (
    `<rect x="20" y="20" width="86" height="86" rx="26" fill="#000" fill-opacity=".28"/>` +
    `<rect x="24" y="24" width="78" height="78" rx="23" fill="#0d1117"/>` +
    lens(46, 46) +
    lens(46, 80) +
    lens(80, 63) +
    `<circle cx="82" cy="38" r="4" fill="#f5e7b0" fill-opacity=".8"/>`
  );
}

function clear(v: number, id: string) {
  const phone = PALETTES.clear[v];
  return (
    `<defs><linearGradient id="gl-${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity=".7"/>` +
    `<stop offset=".5" stop-color="#dcecf5" stop-opacity=".16"/>` +
    `<stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient></defs>` +
    `<rect x="14" y="14" width="172" height="372" rx="31" fill="${phone}"/>` +
    `<circle cx="100" cy="236" r="9" fill="#fff" fill-opacity=".35"/>` +
    `<rect ${BODY} fill="url(#gl-${id})" stroke="#fff" stroke-opacity=".9" stroke-width="3"/>` +
    `<g clip-path="url(#cp-${id})"><path d="M40 392 L192 120 L192 164 L72 392Z" fill="#fff" fill-opacity=".16"/></g>` +
    camera()
  );
}

function magsafe(v: number, id: string) {
  return (
    `<rect ${BODY} fill="${PALETTES.magsafe[v]}"/>` +
    `<rect ${BODY} fill="url(#sh-${id})"/>` +
    `<circle cx="100" cy="246" r="52" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>` +
    `<circle cx="100" cy="246" r="44" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2"/>` +
    `<path d="M100 188v10M100 294v10M42 246h10M148 246h10" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>` +
    camera()
  );
}

function eco(v: number, id: string) {
  const rand = rng(v + 11);
  let dots = '';
  for (let i = 0; i < 46; i++) {
    const x = 14 + rand() * 172;
    const y = 14 + rand() * 372;
    const r = 0.8 + rand() * 1.5;
    const light = rand() < 0.5;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${light ? '#fff' : '#3a3a2a'}" fill-opacity=".35"/>`;
  }
  return (
    `<rect ${BODY} fill="${PALETTES.eco[v]}"/>` +
    `<g clip-path="url(#cp-${id})">${dots}</g>` +
    `<rect ${BODY} fill="url(#sh-${id})"/>` +
    `<path d="M100 346c-22-4-34-24-32-46 22 0 38 14 32 46z" fill="#fff" fill-opacity=".5"/>` +
    `<path d="M100 346c-3-14-9-26-19-36" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2" stroke-linecap="round"/>` +
    camera()
  );
}

function rugged(v: number, id: string) {
  const accent = RUGGED_ACCENTS[v];
  let ribs = '';
  for (let y = 236; y <= 376; y += 14) {
    ribs += `<path d="M8 ${y}H192" stroke="#fff" stroke-opacity=".08" stroke-width="6"/>`;
  }
  const bumper = (d: string) =>
    `<path d="${d}" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>`;
  return (
    `<rect ${BODY} fill="${PALETTES.rugged[v]}"/>` +
    `<g clip-path="url(#cp-${id})">${ribs}</g>` +
    `<rect ${BODY} fill="url(#sh-${id})"/>` +
    bumper('M8 64V44A36 36 0 0 1 44 8H64') +
    bumper('M136 8H156A36 36 0 0 1 192 44V64') +
    bumper('M192 336V356A36 36 0 0 1 156 392H136') +
    bumper('M64 392H44A36 36 0 0 1 8 356V336') +
    camera()
  );
}

function leather(v: number, id: string) {
  return (
    `<defs><linearGradient id="lg-${id}" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>` +
    `<rect ${BODY} fill="${PALETTES.leather[v]}"/>` +
    `<rect ${BODY} fill="url(#lg-${id})"/>` +
    `<rect x="40" y="226" width="120" height="70" rx="8" fill="#ECE8E0"/>` +
    `<rect x="52" y="240" width="22" height="16" rx="3" fill="#C9A24B"/>` +
    `<path d="M8 262H192V356A36 36 0 0 1 156 392H44A36 36 0 0 1 8 356Z" fill="#000" fill-opacity=".24"/>` +
    `<path d="M8 262H192" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>` +
    `<rect x="20" y="20" width="160" height="360" rx="26" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="6 6"/>` +
    camera()
  );
}

const BUILDERS: Record<CaseKind, (v: number, id: string) => string> = {
  clear,
  magsafe,
  eco,
  rugged,
  leather,
};

/** Devuelve el SVG (como string) de una funda. Mismo kind + seed => mismo dibujo. */
export function caseSvg(kind: CaseKind, seed = 0): string {
  const variant = Math.abs(Math.trunc(seed)) % PALETTES[kind].length;
  const id = `${kind}${variant}`;
  const shared =
    `<defs><clipPath id="cp-${id}"><rect ${BODY}/></clipPath>` +
    `<linearGradient id="sh-${id}" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#fff" stop-opacity=".22"/>` +
    `<stop offset=".45" stop-color="#fff" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient></defs>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400" width="100%" height="100%" focusable="false">` +
    shared +
    BUILDERS[kind](variant, id) +
    `</svg>`
  );
}
