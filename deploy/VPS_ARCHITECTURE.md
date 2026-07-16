# Kiến trúc triển khai: FE (Render) + BE/DB/AI (máy nhà) + VPS (coturn/gateway entry)

Trạng thái: **đã quyết định kiến trúc, chưa triển khai.** File này để tiếp tục đúng chỗ khi quay lại.

## Kiến trúc đã chốt

```
Browser user
   ├─ tải FE (static) ─────────────► Render (CDN, tự SSL)
   ├─ gọi API/WS ──────────────────► VPS nginx (public IP) ──Tailscale──► gateway (máy nhà, Docker)
   │                                                                          │
   │                                                                          ▼
   │                                                    auth / workflow / read / cronjob / email
   │                                                                          │
   │                                                                          ▼
   │                                                            Postgres + Ollama (máy nhà)
   │
   └─ WebRTC media (STUN/TURN) ─────► VPS coturn (public IP)
```

- **Render**: chỉ host FE build tĩnh (không liên quan gì tới máy nhà, không cần Tailscale).
- **VPS**: chạy `nginx` (reverse proxy, TLS) + `coturn` (STUN/TURN). Vai trò cửa ngõ public duy nhất.
- **Máy nhà**: chạy `gateway` (Spring Cloud Gateway, mới) + 5 service BE + Postgres + Ollama.
- **Tailscale**: nối VPS ↔ máy nhà thành mạng riêng, không cần forward port trên router Viettel.

Lý do chọn kiến trúc này thay vì đưa hết lên VPS hoặc VPS chỉ làm STUN/TURN thuần:
- Router Viettel không có quyền admin → không forward port được → Tailscale né hoàn toàn vấn đề này (đục lỗ NAT tự động, không cần cấu hình router).
- STUN/TURN bắt buộc phải có IP public thật để hoạt động đúng → phải ở VPS, không thể ở nhà.
- DB/AI (Ollama dùng GPU RTX 4060) ở nhà → giữ nguyên tại nhà, không round-trip qua mạng cho mỗi query.
- FE là static → Render free/rẻ, CDN toàn cầu, không cần VPS phục vụ.

## Tailscale — trạng thái

- **Máy nhà**: đã cài, đã connected. Tailscale IPv4: `100.90.135.8` (machine name `vuong`, MagicDNS short domain `vuong`, full domain `vuong.tailcb3432.ts.net`).
- **VPS**: chưa cài. Khi thuê VPS xong, chạy:
  ```bash
  curl -fsSL https://tailscale.com/install.sh | sh
  sudo tailscale up
  ```
  Đăng nhập cùng tài khoản `vuongvo297@gmail.com` để chung tailnet. Verify: `tailscale ping vuong` hoặc `tailscale ping 100.90.135.8`.

## VPS — lựa chọn

- OS: **Ubuntu 22.04/24.04 LTS Server** (hoặc Debian 12), không dùng bản Desktop.
- Cấu hình tối thiểu đã bàn: 1 vCPU / 1GB RAM / 20GB NVMe / 1 IPv4 riêng / 100Mbps / unlimited băng thông — đủ dư cho `nginx` (~25MB idle) + `coturn` (~11MB idle) ở quy mô hiện tại. TURN chỉ tốn băng thông khi P2P thất bại và phải relay media.

## Việc còn phải làm (theo thứ tự)

1. Thuê VPS (Ubuntu LTS), cài Tailscale, verify kết nối 2 chiều với máy nhà.
2. Tạo module `gateway` mới trong `BE/` (Spring Cloud Gateway) — Dockerfile giống các service khác (copy `common` module, build multi-stage), route nội bộ theo tên container (`http://auth:8880`, `http://workflow:8881`, ...) qua Docker network hiện có, expose 1 port duy nhất (VD `8890`) ra host để Tailscale thấy được.
3. Tách `docker-compose.yml` hiện tại thành 2 file:
   - `docker-compose.home.yml`: postgres, auth, workflow, read, cronjob, email, gateway.
   - `docker-compose.vps.yml`: nginx, coturn.
4. Sửa `deploy/nginx/conf.d/default.conf.template`: các `proxy_pass` hiện đang trỏ tên container Docker (`workflow:8881`, `auth:8880`, `read:8882`, `frontend:8080`) → đổi thành trỏ 1 điểm duy nhất `100.90.135.8:8890` (gateway qua Tailscale). Bỏ block `location /` proxy sang `frontend` (FE giờ ở Render, không còn container `frontend` trên VPS nữa).
5. Build FE, deploy lên Render (static site). Cấu hình Render Rewrites để proxy `/api/*` và `/ws` sang domain/IP VPS (tránh CORS), hoặc dùng domain phụ (`api.duckdns...`) trỏ thẳng VPS nếu không dùng Rewrites.
6. DNS: `app.<domain>` → Render, `api.<domain>` (nếu không dùng Rewrites) → IP VPS.
7. Chạy `deploy/certbot/init-letsencrypt.sh` trên VPS cho domain API một khi DNS trỏ đúng.
8. Đổi `WEBRTC_STUN_URLS`/`WEBRTC_TURN_URLS` trong env của `workflow` từ Google STUN tạm thời (`stun:stun.l.google.com:19302`) về coturn thật trên VPS.

## Rủi ro đã biết, chấp nhận ở quy mô hiện tại

- Máy nhà phải luôn bật + có mạng — mất điện/mất mạng nhà thì app sập tạm, tự hồi phục khi có lại (Docker `restart: always` + Windows auto-login + Tailscale auto-start giúp tự phục hồi không cần thao tác tay).
- Nên thêm: nginx custom trang lỗi 502/504 thân thiện, health-check ping (UptimeRobot) báo khi BE mất kết nối.
