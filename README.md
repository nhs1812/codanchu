# Cờ Dân Chủ — CNXHKH Chương 4

## Cấu trúc
```
├── api/game.js        # Serverless API (Vercel)
├── public/
│   ├── admin.html     # Trang Admin (giáo viên)
│   ├── play.html      # Trang Người Chơi (học sinh)
│   └── index.html     # Redirect → /play
├── vercel.json
└── package.json
```

## Deploy lên Vercel
1. Push lên GitHub
2. Import repo vào vercel.com
3. Deploy — không cần cấu hình gì thêm

## URL
- Người chơi: `https://your-app.vercel.app/play`
- Admin: `https://your-app.vercel.app/admin`
  - Tài khoản: `captains1812` / `123456`

## Cách chơi
1. Admin vào `/admin` → đăng nhập → tạo phòng → share mã 6 ký tự
2. Học sinh vào `/play` → nhập mã → nhập tên → chờ
3. Admin nhấn **Bắt Đầu** khi đủ người (tối thiểu 2)
4. Admin điều hành từ màn chiếu lớn
