# Kiến trúc triển khai: FE (Render) + BE/DB/AI (máy nhà) + VPS (coturn/gateway entry)

Trạng thái: **đang triển khai.** Coturn + Tailscale + gateway + nginx HTTPS (`togetherexe.duckdns.org`) đã chạy. Đang gắn FE static lên cùng domain VPS.

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
- **Máy nhà**: chạy `gateway` (Spring Cloud Gateway) + 5 service BE + Postgres + Ollama.
- **Tailscale**: nối VPS ↔ máy nhà thành mạng riêng, không cần forward port trên router Viettel.

Lý do chọn kiến trúc này thay vì đưa hết lên VPS hoặc VPS chỉ làm STUN/TURN thuần:
- Router Viettel không có quyền admin → không forward port được → Tailscale né hoàn toàn vấn đề này (đục lỗ NAT tự động, không cần cấu hình router).
- STUN/TURN bắt buộc phải có IP public thật để hoạt động đúng → phải ở VPS, không thể ở nhà.
- DB/AI (Ollama dùng GPU RTX 4060) ở nhà → giữ nguyên tại nhà, không round-trip qua mạng cho mỗi query.
- FE là static → Render free/rẻ, CDN toàn cầu, không cần VPS phục vụ.

## Tailscale — trạng thái

- **Máy nhà**: đã cài, đã connected. Tailscale IPv4: `100.90.135.8` (machine name `vuong`).
- **VPS**: đã cài, machine name `together` / `100.94.54.105`. Ping VPS→home OK (qua DERP cũng được).

## VPS — trạng thái

- Public IP: `103.20.97.225`
- **coturn**: đã cài, `active (running)`, ufw mở 3478 + 49152-49252.
- **nginx**: chưa gắn domain/SSL; template VPS sẵn tại `deploy/nginx/conf.d/default.vps.conf.template` (proxy → `HOME_GATEWAY=100.90.135.8:8890`).

## Việc còn phải làm (theo thứ tự)

1. ~~Thuê VPS, cài Tailscale, verify ping.~~
2. ~~Tạo module `BE/gateway` (Spring Cloud Gateway), expose `8890`.~~ — đã có trong `docker-compose.yml`.
3. Trên máy nhà: `docker compose up -d --build gateway` (cùng stack BE), verify từ VPS: `curl http://100.90.135.8:8890/actuator/health`.
4. Tách compose (tùy chọn): `docker-compose.home.yml` / `docker-compose.vps.yml` — hiện gateway đã nằm trong `docker-compose.yml`.
5. Trên VPS: chạy nginx với `default.vps.conf.template`, set `HOME_GATEWAY=100.90.135.8:8890`, mở ufw 80/443.
6. Build FE, deploy Render; proxy `/api` + `/ws` → domain/IP VPS.
7. DNS + `deploy/certbot/init-letsencrypt.sh` cho domain API.
8. Đổi `WEBRTC_STUN_URLS` / `WEBRTC_TURN_URLS` của workflow sang coturn VPS (`103.20.97.225:3478`) + user/password trong `/etc/turnserver.conf`.

## Rủi ro đã biết, chấp nhận ở quy mô hiện tại

- Máy nhà phải luôn bật + có mạng — mất điện/mất mạng nhà thì app sập tạm, tự hồi phục khi có lại (Docker `restart: always` + Windows auto-login + Tailscale auto-start giúp tự phục hồi không cần thao tác tay).
- Nên thêm: nginx custom trang lỗi 502/504 thân thiện, health-check ping (UptimeRobot) báo khi BE mất kết nối.
