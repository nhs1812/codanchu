// Vercel KV-less in-memory store via global (works per-instance, good for demo)
// For production: swap globalThis.ROOMS with Vercel KV or Upstash Redis

if (!globalThis._ROOMS) globalThis._ROOMS = {};
if (!globalThis._POLL) globalThis._POLL = {};

const ROOMS = globalThis._ROOMS;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const body = req.method === 'POST' ? req.body : {};

  try {
    switch (action) {

      case 'login': {
        const { user, pass } = body;
        if (user === 'captains1812' && pass === '123456') {
          return res.json({ ok: true });
        }
        return res.json({ ok: false, err: 'Sai tài khoản hoặc mật khẩu!' });
      }

      case 'create': {
        const { maxR = 5, maxP = 6 } = body;
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        ROOMS[code] = {
          code, phase: 'lobby', players: {}, order: [],
          turn: 0, round: 1, maxR: Number(maxR), maxP: Math.min(10, Math.max(2, Number(maxP))),
          dbl: 0, dice: null, ts: Date.now()
        };
        // cleanup old rooms (>3h)
        Object.keys(ROOMS).forEach(k => {
          if (Date.now() - ROOMS[k].ts > 3 * 3600 * 1000) delete ROOMS[k];
        });
        return res.json({ ok: true, code });
      }

      case 'get': {
        const { code } = req.query;
        if (!ROOMS[code]) return res.json({ ok: false, err: 'Không tìm thấy phòng!' });
        return res.json({ ok: true, state: ROOMS[code] });
      }

      case 'poll': {
        // Long-poll: wait up to 15s for a state change
        const { code, ts } = req.query;
        if (!ROOMS[code]) return res.json({ ok: false, err: 'Room not found' });
        const clientTs = Number(ts) || 0;
        const deadline = Date.now() + 12000;
        const check = () => {
          if (!ROOMS[code]) return res.json({ ok: false });
          if (ROOMS[code].ts > clientTs) return res.json({ ok: true, state: ROOMS[code] });
          if (Date.now() >= deadline) return res.json({ ok: true, state: ROOMS[code] });
          setTimeout(check, 400);
        };
        return check();
      }

      case 'join': {
        const { code, id, name, emoji, pi } = body;
        const room = ROOMS[code];
        if (!room) return res.json({ ok: false, err: 'Không tìm thấy phòng!' });
        if (room.phase !== 'lobby') return res.json({ ok: false, err: 'Game đã bắt đầu!' });
        if (room.order.length >= room.maxP) return res.json({ ok: false, err: `Phòng đầy (${room.maxP} người)!` });
        room.players[id] = { id, name, emoji, pi: pi || 0, score: 10, pos: 0, jailTurns: 0, wins: 0 };
        room.order.push(id);
        room.ts = Date.now();
        return res.json({ ok: true, state: room });
      }

      case 'start': {
        const { code } = body;
        const room = ROOMS[code];
        if (!room) return res.json({ ok: false, err: 'Không tìm thấy phòng!' });
        if (room.order.length < 2) return res.json({ ok: false, err: 'Cần ít nhất 2 người chơi!' });
        room.phase = 'playing';
        room.ts = Date.now();
        return res.json({ ok: true, state: room });
      }

      case 'update': {
        const { code, patch } = body;
        const room = ROOMS[code];
        if (!room) return res.json({ ok: false });
        Object.assign(room, patch, { ts: Date.now() });
        return res.json({ ok: true, state: room });
      }

      case 'updatePlayer': {
        const { code, pid, data } = body;
        const room = ROOMS[code];
        if (!room) return res.json({ ok: false });
        room.players[pid] = { ...room.players[pid], ...data };
        room.ts = Date.now();
        return res.json({ ok: true, state: room });
      }

      case 'updatePlayers': {
        const { code, players } = body; // { pid: data }
        const room = ROOMS[code];
        if (!room) return res.json({ ok: false });
        Object.keys(players).forEach(pid => {
          room.players[pid] = { ...room.players[pid], ...players[pid] };
        });
        room.ts = Date.now();
        return res.json({ ok: true, state: room });
      }

      default:
        return res.status(400).json({ ok: false, err: 'Unknown action' });
    }
  } catch (e) {
    return res.status(500).json({ ok: false, err: e.message });
  }
};
