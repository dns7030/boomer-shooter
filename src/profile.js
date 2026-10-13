// Local player profile: nickname + lifetime stats, kept in this browser's localStorage (per game: `key` keeps the two games apart).
// Score of a run = kills x 10 + waves cleared x 100 + final bosses killed x 1000.
export const scoreOf = (s) => s.kills * 10 + (s.waves || 0) * 100 + (s.bosses || 0) * 1000;

export function createProfile(key = 'game') {
  const K = `profile.${key}`;
  let db = { nick: '', players: {} };
  try { const raw = localStorage.getItem(K); if (raw) db = { ...db, ...JSON.parse(raw) }; } catch (e) { /* no storage */ }
  const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) { /* ignore */ } };
  const me = () => {
    if (!db.nick) return null;
    return (db.players[db.nick] ||= { best: 0, bosses: 0, waves: 0, kills: 0, plays: 0 });
  };
  return {
    get nick() { return db.nick; },
    setNick(n) { db.nick = String(n || '').trim().slice(0, 16); me(); save(); return db.nick; },
    stats() { return me(); },
    startRun() { const m = me(); if (m) { m.plays++; save(); } },
    // delta since the last event of the same run; `run` is game.stats ({kills, waves, bosses})
    event(kind, run) {
      const m = me(); if (!m) return;
      if (kind === 'kill') m.kills++;
      else if (kind === 'wave') m.waves++;
      else if (kind === 'boss') m.bosses++;
      m.best = Math.max(m.best, scoreOf(run));
      save();
    },
    leaderboard() { return Object.entries(db.players).map(([n, s]) => ({ nick: n, ...s })).sort((a, b) => b.best - a.best).slice(0, 5); },
  };
}
