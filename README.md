# Cờ Dân Chủ — CNXHKH Chương 4

## Cấu trúc file
```
├── api/game.js     ← Serverless API
├── admin.html      ← Trang giáo viên
├── play.html       ← Trang học sinh
├── index.html      ← Redirect → /play
└── vercel.json
```

## ⚡ Deploy (5 bước)

### Bước 1 — Tạo Upstash Redis (miễn phí)
1. Vào https://console.upstash.com → Đăng ký miễn phí
2. **Create Database** → Chọn region gần nhất → Create
3. Vào tab **REST API** → Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Bước 2 — Push lên GitHub
1. Tạo repo mới trên GitHub
2. Upload toàn bộ file vào repo (drag & drop hoặc git push)

### Bước 3 — Deploy Vercel
1. Vào https://vercel.com → New Project → Import repo GitHub
2. Click **Deploy** (không cần config build)

### Bước 4 — Thêm Environment Variables
Trong Vercel → Project → **Settings → Environment Variables**, thêm:
```
UPSTASH_REDIS_REST_URL   = https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN = AXxx...
```
Sau đó **Redeploy** (Deployments → 3 chấm → Redeploy)

### Bước 5 — Chơi!
- Học sinh: `https://your-app.vercel.app/play`
- Admin: `https://your-app.vercel.app/admin`
  - Tài khoản: **captains1812** / **123456**

## Cách chơi
1. Admin vào `/admin` → đăng nhập → tạo phòng → share mã 6 ký tự
2. Học sinh vào `/play` → chọn avatar → nhập mã + tên → Vào Chơi
3. Admin nhấn **Bắt Đầu** (cần ít nhất 2 người)
4. Admin điều hành từ màn chiếu lớn
