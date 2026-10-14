// TEMPORARY demo look (pink sky, blue lizards) for showing the game to friends.
// Turn it off: set FORCE to false below, or open the page with ?demo=off.   Turn it on for a single visit: ?demo
const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const FORCE = true;
export const DEMO = q.get('demo') === 'off' ? false : (FORCE || q.has('demo'));

// pink sky: keep the light/dark structure of the painted sky (clouds, horizon band) but colour it pink
export function pinkify(canvas) {
  const g = canvas.getContext('2d'), w = canvas.width, h = canvas.height, d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    const L = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255, t = Math.min(1, Math.max(0, (L - 0.25) / 0.7));
    p[i] = 255 * (0.93 + 0.07 * t); p[i + 1] = 255 * (0.42 + 0.5 * t); p[i + 2] = 255 * (0.62 + 0.33 * t);
  }
  g.putImageData(d, 0, 0);
}

// green (and teal) lizard skin -> blue, same lightness and saturation
export function greenToBlue(color) {
  const hsl = {}; color.getHSL(hsl);
  if (hsl.s > 0.15 && hsl.h > 0.1 && hsl.h < 0.55) color.setHSL(0.6, Math.min(1, Math.max(0.55, hsl.s * 1.2)), hsl.l);
  return color;
}
