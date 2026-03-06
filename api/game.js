// Upstash Redis HTTP — set 2 env vars in Vercel dashboard:
//   UPSTASH_REDIS_REST_URL   = https://xxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN = AXxx...

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCmd(...args) {
  const res = await fetch(`${REDIS_URL}/${args.map(a => encodeURIComponent(String(a))).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function getRoom(code) {
  const raw = await redisCmd('GET', `room:${code}`);
  return raw ? JSON.parse(raw) : null;
}

async function setRoom(code, room) {
  room.ts = Date.now();
  await redisCmd('SET', `room:${code}`, JSON.stringify(room), 'EX', '10800');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;
  const body = req.method === 'POST' ? (req.body || {}) : {};

  try {
    switch (action) {

      case 'login': {
        const { user, pass } = body;
        if (user === 'captains1812' && pass === '123456') return res.json({ ok: true });
        return res.json({ ok: false, err: 'Sai tài khoản hoặc mật khẩu!' });
      }

      case 'create': {
        const { maxR = 5, maxP = 6 } = body;
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        await setRoom(code, {
          code, phase: 'lobby', players: {}, order: [],
          turn: 0, round: 1, maxR: Number(maxR), maxP: Math.min(10, Math.max(2, Number(maxP))),
          dbl: 0, dice: null
        });
        return res.json({ ok: true, code });
      }

      case 'get': {
        const { code } = req.query;
        const room = await getRoom(code);
        if (!room) return res.json({ ok: false, err: 'Không tìm thấy phòng!' });
        return res.json({ ok: true, state: room });
      }

      case 'poll': {
        const { code, ts } = req.query;
        const clientTs = Number(ts) || 0;
        const deadline = Date.now() + 8000;
        let room = await getRoom(code);
        if (!room) return res.json({ ok: false, err: 'Room not found' });
        while (room.ts <= clientTs && Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 500));
          room = await getRoom(code);
          if (!room) return res.json({ ok: false });
        }
        return res.json({ ok: true, state: room });
      }

      case 'join': {
        const { code, id, name, emoji, pi } = body;
        const room = await getRoom(code);
        if (!room) return res.json({ ok: false, err: 'Không tìm thấy phòng!' });
        if (room.phase !== 'lobby') return res.json({ ok: false, err: 'Game đã bắt đầu!' });
        if (room.order.length >= room.maxP) return res.json({ ok: false, err: `Phòng đầy (${room.maxP} người)!` });
        room.players[id] = { id, name, emoji, pi: pi || 0, score: 10, pos: 0, jailTurns: 0, wins: 0 };
        room.order.push(id);
        await setRoom(code, room);
        return res.json({ ok: true, state: room });
      }

      case 'start': {
        const { code } = body;
        const room = await getRoom(code);
        if (!room) return res.json({ ok: false, err: 'Không tìm thấy phòng!' });
        if (room.order.length < 2) return res.json({ ok: false, err: 'Cần ít nhất 2 người chơi!' });
        room.phase = 'playing';
        await setRoom(code, room);
        return res.json({ ok: true, state: room });
      }

      case 'update': {
        const { code, patch } = body;
        const room = await getRoom(code);
        if (!room) return res.json({ ok: false, err: 'Room not found' });
        Object.assign(room, patch);
        await setRoom(code, room);
        return res.json({ ok: true, state: room });
      }

      case 'updatePlayer': {
        const { code, pid, data } = body;
        const room = await getRoom(code);
        if (!room) return res.json({ ok: false });
        room.players[pid] = { ...room.players[pid], ...data };
        await setRoom(code, room);
        return res.json({ ok: true, state: room });
      }

      case 'updatePlayers': {
        const { code, players } = body;
        const room = await getRoom(code);
        if (!room) return res.json({ ok: false });
        Object.keys(players).forEach(pid => {
          room.players[pid] = { ...room.players[pid], ...players[pid] };
        });
        await setRoom(code, room);
        return res.json({ ok: true, state: room });
      }

      default:
        return res.status(400).json({ ok: false, err: 'Unknown action' });
    }
  } catch (e) {
    console.error('API error:', e.message);
    return res.status(500).json({ ok: false, err: e.message });
  }
};
