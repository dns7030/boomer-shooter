// Grid flow field: lets lizards walk around whole city blocks to reach the player.
// Cells blocked by tall colliders are impassable; a breadth-first search from the player's cell
// gives every cell a distance, and an enemy simply steps to its lowest-distance neighbour.
export class Nav {
  constructor(boxes, b, cell = 1.0, inflate = 0.5) {
    this.c = cell; this.x0 = b.x0; this.z0 = b.z0;
    this.nx = Math.ceil((b.x1 - b.x0) / cell); this.nz = Math.ceil((b.z1 - b.z0) / cell);
    this.blocked = new Uint8Array(this.nx * this.nz);
    this.dist = new Int32Array(this.nx * this.nz).fill(-1);
    this.queue = new Int32Array(this.nx * this.nz);
    this.last = -1; this.t = 0;
    for (const bx of boxes) {
      if (bx.h <= 0.5) continue;   // (lizards cannot hop low walls, so anything above ankle height is an obstacle)
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
  // static flow field toward a set of target points (e.g. a ring around the Neo node): same BFS, many sources
  floodFrom(points) {
    const { dist, queue, blocked, nx, nz } = this; dist.fill(-1); let h = 0, tl = 0;
    for (const [px, pz] of points) { const c = this.cellOf(px, pz); if (c >= 0 && !blocked[c] && dist[c] < 0) { dist[c] = 0; queue[tl++] = c; } }
    while (h < tl) {
      const c = queue[h++], i = c % nx, j = (c / nx) | 0, d = dist[c] + 1;
      for (let k = 0; k < 8; k++) {
        const di = k < 4 ? [1, -1, 0, 0][k] : [1, 1, -1, -1][k - 4], dj = k < 4 ? [0, 0, 1, -1][k] : [1, -1, 1, -1][k - 4];
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const n = nj * nx + ni; if (blocked[n] || dist[n] >= 0) continue;
        if (di && dj && (blocked[j * nx + ni] || blocked[nj * nx + i])) continue;
        dist[n] = d; queue[tl++] = n;
      }
    }
  }
  // unit direction toward the player along the shortest walkable path, or null
  dir(x, z) {
    const c = this.cellOf(x, z);
    if (c < 0) return null;
    const { dist, blocked, nx, nz } = this, i = c % nx, j = (c / nx) | 0;
    if (dist[c] < 0) {   // standing in a blocked cell (hugging a wall, or flying over a building): head for the nearest reachable one
      let best = -1, bd = 1e9;
      for (let dj = -4; dj <= 4; dj++) for (let di = -4; di <= 4; di++) {
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const n = nj * nx + ni; if (dist[n] < 0) continue;
        const score = Math.hypot(di, dj) * 1000 + dist[n]; if (score >= bd) continue;
        // the way there must not cross another blocked band (otherwise we'd try to walk through a wall to the other side)
        const cx = this.x0 + ((n % nx) + 0.5) * this.c, cz = this.z0 + (((n / nx) | 0) + 0.5) * this.c, L = Math.hypot(cx - x, cz - z); let ok = true;
        for (let t = 1.2; t < L && ok; t += 0.5) { const q = this.cellOf(x + ((cx - x) * t) / L, z + ((cz - z) * t) / L); if (q < 0 || blocked[q]) ok = false; }
        if (ok) { bd = score; best = n; }
      }
      if (best < 0) return null;
      const tx = this.x0 + ((best % nx) + 0.5) * this.c - x, tz = this.z0 + (((best / nx) | 0) + 0.5) * this.c - z, l = Math.hypot(tx, tz) || 1;
      return { x: tx / l, z: tz / l };
    }
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
