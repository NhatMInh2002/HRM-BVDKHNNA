# HRM Implementation Plan — 44 Weeks

**Last updated:** 2026-06-29  
**Architecture:** Modular Monolith (Spring Boot) + Next.js + PostgreSQL (on-prem)  
**Dev environment:** Docker Compose (local) → K8s khi có server on-prem thật  
**SSO:** JWT tự quản lý (custom) — Keycloak sẽ tích hợp Phase 5  
**Team:** Solo dev

---

## Phase 1 — Foundation & Security (Weeks 1–8) ✅ HOÀN THÀNH CƠ BẢN

| Week | Deliverable | Status |
|---|---|---|
| 1–2 | Docker Compose: PostgreSQL, Redis, MinIO (OpenSearch bỏ qua — dùng LIKE search) | ✅ Done |
| 3–4 | JWT auth tự quản lý (Spring Security + RS256), RBAC role-based | ✅ Done |
| 5–6 | Next.js proxy (rewrites → backend), NextAuth session | ✅ Done |
| 7–8 | RBAC route guards, notification system, audit log cơ bản | ✅ Done |

**Còn thiếu (sẽ làm Phase 5):** Keycloak SSO, SSL/Nginx, Prometheus, ELK stack

**Bổ sung 2026-06-30:** Audit log bất biến (`audit.audit_log`, schema riêng, trigger chặn UPDATE/DELETE ở DB) — hook vào Employee CRUD, Leave approval 2 cấp, Permission changes. Xem `/dashboard/settings/audit-log`.

---

## Phase 2 — Core HR Modules (Weeks 9–20) ✅ HOÀN THÀNH

| Week | Deliverable | Status |
|---|---|---|
| 9–11 | Personnel: hồ sơ nhân viên, org chart, upload avatar/chữ ký (MinIO) | ✅ Done |
| 12–13 | Phân cấp tổ chức: cây phòng ban, reporting lines, chức danh ngạch bậc | ✅ Done |
| 14–16 | Attendance: check-in/out API, lịch sử chấm công, dashboard heatmap | ✅ Done |
| 17–18 | Nghỉ phép: 9 loại nghỉ, 2-level approval (phòng ban → HR), số dư phép | ✅ Done |
| 19–20 | Admin UI: tìm kiếm nhân viên, dashboard chấm công, duyệt nghỉ, thông báo real-time | ✅ Done |

**Điểm chính:** 500+ nhân viên seed từ dữ liệu thật, ngạch/bậc CBCC-VC đầy đủ

---

## Phase 3 — Payroll & Compliance (Weeks 21–28) ✅ HOÀN THÀNH CƠ BẢN

| Week | Deliverable | Status |
|---|---|---|
| 21–22 | Payroll engine: cấu hình lương (cơ bản, hệ số, phụ cấp), bảng ngạch/bậc A0→A3.1 | ✅ Done |
| 23–24 | BHXH 8%/17.5%, BHYT 1.5%/3%, BHTN 1%/1%, thuế TNCN lũy tiến 7 bậc | ✅ Done |
| 25–26 | Phiếu lương PDF (font Unicode tiếng Việt DejaVu), approval flow, export Excel | ✅ Done |
| 27–28 | Lương cơ sở 2,530,000 (01/07/2026), lương vùng III 3,860,000 | ✅ Done |

**Còn thiếu:** Sync cổng BHXH điện tử, connector nộp e-Tax (Phase 5 — cần API bên ngoài)

---

## Phase 4 — Recruitment, KPI & Reporting (Weeks 29–38) 🔄 ĐANG TRIỂN KHAI

| Week | Deliverable | Status |
|---|---|---|
| 29–31 | Recruitment: đăng tin, pipeline ứng viên, lịch phỏng vấn, offer letter | ✅ Done |
| 32–33 | Onboarding: checklist công việc, thu thập giấy tờ, cấp tài khoản | ✅ Done |
| 34–36 | KPI Service: thiết lập mục tiêu, KPI tree, 360° evaluation, tổng hợp điểm | ✅ Done |
| 37–38 | **Report Service: headcount/dept, chi phí lương, chuyên cần, số dư phép** | ✅ Done |

**Đã làm:** Module Báo cáo (`/dashboard/reports`) với 4 tab: Nhân sự / Chi phí lương / Chuyên cần / Số dư phép

---

## Phase 5 — Integration & Hardening (Weeks 39–44)

| Week | Deliverable | Status |
|---|---|---|
| 39–40 | Keycloak SSO (SAML 2.0/OIDC), SSL/Nginx, sync phần mềm kế toán | 🔄 Một phần (Nginx/SSL xong) |
| 41 | BHXH điện tử connector, e-Tax nộp tờ khai | ⬜ Todo |
| 42 | Penetration testing (OWASP Top 10), khắc phục lỗ hổng | ⬜ Todo |
| 43 | Load testing (500–1,000 concurrent), tối ưu query DB, tuning cache | ⬜ Todo |
| 44 | UAT với phòng Nhân sự, sprint fix bug, go-live runbook | ⬜ Todo |

**Bổ sung 2026-06-30:** Nginx reverse proxy + TLS termination (`nginx/nginx.conf`) — HTTP→HTTPS redirect, security headers (HSTS, X-Frame-Options, nosniff), rate limiting (login 5r/s, API 30r/s). Dev dùng self-signed cert (`nginx/gen-dev-cert.ps1`); production thay bằng chứng chỉ CA thật (VNPT-CA/Viettel-CA) trong `nginx/certs/`. Keycloak SSO vẫn chưa làm — hệ thống đang dùng JWT tự quản lý.

---

## Tiếp theo ưu tiên cao (Phase 4 còn lại)

1. **Tuyển dụng** — pipeline ứng viên, lịch phỏng vấn
2. **KPI cơ bản** — đặt mục tiêu theo quý, đánh giá cuối kỳ
3. **Onboarding checklist** — tự động khi tạo nhân viên mới
