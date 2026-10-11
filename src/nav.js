// Grid flow field: lets lizards walk around whole city blocks to reach the player.
// Cells blocked by tall colliders are impassable; a breadth-first search from the player's cell
// gives every cell a distance, and an enemy simply steps to its lowest-distance neighbour.
export class Nav {
  constructor(boxes, b, cell = 2, inflate = 0.9) {
    this.c = cell; this.x0 = b.x0; this.z0 = b.z0;
    this.nx = Math.ceil((b.x1 - b.x0) / cell); this.nz = Math.ceil((b.z1 - b.z0) / cell);
    this.blocked = new Uint8Array(this.nx * this.nz);
    this.dist = new Int32Array(this.nx * this.nz).fill(-1);
    this.queue = new Int32Array(this.nx * this.nz);
    this.last = -1; this.t = 0;
    for (const bx of boxes) {
      if (bx.h <= 1.0) continue;
      const i0 = Math.max(0, Math.floor((bx.x0 - inflate - this.x0) / cell)), i1 = Math.min(this.nx - 1, Math.floor((bx.x1 + inflate - this.x0) / cell));
      const j0 = Math.max(0, Math.floor((bx.z0 - inflate - this.z0) / cell)), j1 = Math.min(this.nz - 1, Math.floor((bx.z1 + inflate - this.z0) / cell));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) this.blocked[j * this.nx + i] = 1;
    }
  }
  cellOf(x, z) {
    const i = Math.floor((x - this.x0) / this.c), j = Math.floor((z - this.z0) / this.c);
    return i < 0 || j < 0 || i >= this.nx || j >= this.nz ? -1 : j * this.nx + i;
  }
  // recompute distances when the target moved to a new cell (at most a few times per second)
  update(px, pz, dt) {
    this.t -= dt;
    let s = this.cellOf(px, pz);
    if (s < 0 || (s === this.last && this.t > 0) || this.t > 0 && this.last >= 0) return;
    if (this.blocked[s]) { // player hugging a wall: start from the nearest free neighbour
      const nx = this.nx; let f = -1;
      for (const o of [-1, 1, -nx, nx, -nx - 1, -nx + 1, nx - 1, nx + 1]) { const n = s + o; if (n >= 0 && n < this.blocked.length && !this.blocked[n]) { f = n; break; } }
      if (f < 0) return; s = f;
    }
    this.t = 0.2; this.last = s;
    const { dist, queue, blocked, nx, nz } = this;
    dist.fill(-1); dist[s] = 0; let h = 0, tl = 0; queue[tl++] = s;
    while (h < tl) {
      const c = queue[h++], i = c % nx, j = (c / nx) | 0, d = dist[c] + 1;
      for (let k = 0; k < 8; k++) {
        const di = k < 4 ? [1, -1, 0, 0][k] : [1, 1, -1, -1][k - 4], dj = k < 4 ? [0, 0, 1, -1][k] : [1, -1, 1, -1][k - 4];
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const n = nj * nx + ni;
        if (blocked[n] || dist[n] >= 0) continue;
        if (di && dj && (blocked[j * nx + ni] || blocked[nj * nx + i])) continue; // no corner cutting
        dist[n] = d; queue[tl++] = n;
      }
    }
  }
  // unit direction toward the player along the shortest walkable path, or null
  dir(x, z) {
    const c = this.cellOf(x, z);
    if (c < 0 || this.dist[c] < 0) return null;
    const { dist, blocked, nx, nz } = this, i = c % nx, j = (c / nx) | 0;
    let best = dist[c], bi = -1, bj = -1;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
      const n = nj * nx + ni, d = dist[n];
      if (d < 0 || blocked[n] || d >= best) continue;
      if (di && dj && (blocked[j * nx + ni] || blocked[nj * nx + i])) continue;
      best = d; bi = ni; bj = nj;
    }
    if (bi < 0) return null;
    const tx = this.x0 + (bi + 0.5) * this.c - x, tz = this.z0 + (bj + 0.5) * this.c - z, l = Math.hypot(tx, tz) || 1;
    return { x: tx / l, z: tz / l };
  }
}
