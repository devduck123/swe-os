// The track map's two enhancements: the hand-drawn trail that joins the stops, and reading progress.
// Without this script the map is still a list of stages and stops, just without the line and ticks.
import { progressKey } from '../lib/track-progress';

const svgNS = 'http://www.w3.org/2000/svg';

function readStops(): Set<string> {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(progressKey) ?? '[]',
    );
    return new Set(
      Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [],
    );
  } catch {
    return new Set();
  }
}

function clearStops() {
  try {
    localStorage.removeItem(progressKey);
  } catch {}
}

// The same wobble every time, so the trail doesn't jump when the window resizes.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Point = [number, number];

// A smooth curve through every point, with a small sideways wobble between them so it reads as
// drawn by hand rather than by a ruler.
function trailPath(points: Point[]): string {
  const random = seeded(23);
  const wobbly: Point[] = [];
  points.forEach((point, i) => {
    wobbly.push(point);
    const next = points[i + 1];
    if (!next) return;
    const [dx, dy] = [next[0] - point[0], next[1] - point[1]];
    const length = Math.hypot(dx, dy) || 1;
    const push = (random() - 0.5) * Math.min(14, length * 0.12);
    wobbly.push([
      point[0] + dx / 2 + (-dy / length) * push,
      point[1] + dy / 2 + (dx / length) * push,
    ]);
  });
  // Catmull-Rom through the points, written as cubic Béziers.
  const p = (i: number) => wobbly[Math.max(0, Math.min(wobbly.length - 1, i))];
  let d = `M${wobbly[0][0].toFixed(1)} ${wobbly[0][1].toFixed(1)}`;
  for (let i = 0; i < wobbly.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1.map((n) => n.toFixed(1)).join(' ')} ${c2.map((n) => n.toFixed(1)).join(' ')} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function drawTrail(map: HTMLElement) {
  const stages = map.querySelector<HTMLElement>('.track-map__stages');
  if (!stages) return;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.classList.add('track-map__trail');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const line = document.createElementNS(svgNS, 'path');
  line.classList.add('track-map__line');
  // A little flag where the trail ends.
  const flag = document.createElementNS(svgNS, 'path');
  flag.classList.add('track-map__flag');
  svg.append(line, flag);
  stages.prepend(svg);

  const draw = () => {
    const box = stages.getBoundingClientRect();
    if (!box.width) return;
    const points: Point[] = [
      ...stages.querySelectorAll<HTMLElement>('[data-trail-point]'),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    });
    if (points.length < 2) return;
    // The trail starts under the first duck and wanders a little past the last stop to a flag.
    const [xn, yn] = points[points.length - 1];
    const end: Point = [xn + 8, yn + 84];
    points.push([xn - 7, yn + 44], end);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.setAttribute('width', String(box.width));
    svg.setAttribute('height', String(box.height));
    line.setAttribute('d', trailPath(points));
    const [fx, fy] = end;
    flag.setAttribute(
      'd',
      `M${fx} ${fy}c.4-9 .1-19-.6-29 M${fx - 0.4} ${fy - 29}c6 1.6 11 3.4 16 6.2-5 1.6-10 3.6-15.4 6.6`,
    );
  };
  draw();
  new ResizeObserver(draw).observe(stages);
  document.fonts?.ready.then(draw);
}

function showProgress(map: HTMLElement) {
  const stops = [...map.querySelectorAll<HTMLElement>('[data-stop]')];
  const start = map.querySelector<HTMLElement>('[data-progress-start]');
  const done = map.querySelector<HTMLElement>('[data-progress-done]');
  const count = map.querySelector<HTMLElement>('[data-progress-count]');
  const fill = map.querySelector<SVGPathElement>('[data-progress-fill]');
  const status = map.querySelector<HTMLElement>('[data-progress-status]');
  const reset = map.querySelector<HTMLButtonElement>('[data-progress-reset]');
  if (!start || !done || !count || !fill || !status || !reset) return;

  const render = (read: Set<string>) => {
    let n = 0;
    for (const stop of stops) {
      const isRead = read.has(stop.dataset.stop ?? '');
      stop.toggleAttribute('data-read', isRead);
      if (isRead) stop.style.setProperty('--order', String(n++));
      const label = stop.querySelector('[data-stop-status]');
      if (label) label.textContent = isRead ? ' (read)' : '';
    }
    start.hidden = n > 0;
    done.hidden = n === 0;
    count.textContent = String(n);
    // Let the bar start empty, then grow to where you are.
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = String(1 - n / stops.length);
    });
  };

  render(readStops());
  reset.addEventListener('click', () => {
    clearStops();
    render(new Set());
    status.textContent = 'Reading progress cleared.';
    start.querySelector('a')?.focus();
  });
}

const map = document.querySelector<HTMLElement>('[data-track-map]');
if (map) {
  map.classList.add('track-map--drawn');
  drawTrail(map);
  showProgress(map);
}
