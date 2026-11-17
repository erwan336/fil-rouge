/* Icônes SVG : Mission Recherche */
/* =====================================================================
   A. ICÔNES SVG (dessinées à la main, hors ligne)
   ===================================================================== */
const ICONS = {
  flask:'<path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 15h9"/>',
  map:'<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>',
  users:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M16 4.2a4 4 0 0 1 0 7.6M22 21c0-3-1.8-5-4.2-5.6"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 9v6M9 12h6"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2.8h6V4M9 10h6M9 14h6M9 18h3"/>',
  chart:'<path d="M4 20V11M10 20V4M16 20v-7M2 20h20"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  stetho:'<path d="M5 3v6a5 5 0 0 0 10 0V3"/><path d="M10 14v1.5a5 5 0 0 0 10 0V13"/><circle cx="20" cy="11" r="2"/>',
  landmark:'<path d="M3 21h18M5 21V10M19 21V10M9.5 21V10M14.5 21V10M2 10l10-6 10 6z"/>',
  heart:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
  news:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
  book:'<path d="M3 5h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play:'<path d="M7 4v16l13-8z"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  check:'<path d="M4 12.5 9.5 18 20 6"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3 20 3M16 7l3 3M14 9l2 2"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  finger:'<path d="M12 11v4M8.5 8.5a5 5 0 0 1 8.5 3.5v2M7 12a5 5 0 0 1 .4-2M7 15.5c.3 1.6 1 3 2 4.2M17 17c-.2 1.4-.6 2.6-1.2 3.6M12 3a9 9 0 0 1 9 9v1M3 13v-1a9 9 0 0 1 4.5-7.8"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  cards:'<rect x="3" y="6" width="12" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
  restart:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  home:'<path d="M3 11 12 3l9 8M5 9.5V21h14V9.5"/>'
};
function icon(n, s = 18) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`;
}

