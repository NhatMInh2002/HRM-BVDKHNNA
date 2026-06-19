# HRM Implementation Plan — 44 Weeks

**Last updated:** 2026-06-19  
**Architecture:** Modular Monolith (Spring Boot) + Next.js + PostgreSQL (on-prem)  
**Dev environment:** Docker Compose (local) → K8s khi có server on-prem thật  
**SSO:** Keycloak (self-hosted, SAML 2.0 / OIDC) — thay thế AD FS  
**Team:** Solo dev

---

## Phase 1 — Foundation & Security (Weeks 1–8)
**Goal:** Skeleton chạy được với SSO, SSL, logging trước khi viết business logic.

| Week | Deliverable | Status |
|---|---|---|
| 1–2 | Docker Compose stack: PostgreSQL, Redis, MinIO, OpenSearch, Keycloak | ⬜ Todo |
| 3–4 | Keycloak: realm HRM, SAML 2.0 / OIDC config, Spring Security integration, JWT | ⬜ Todo |
| 5–6 | API Gateway (Spring Cloud Gateway): routing, JWT verify, rate limiting, Nginx + SSL | ⬜ Todo |
| 7–8 | Next.js shell: SSO login flow, RBAC route guards, audit log middleware, ELK + Prometheus | ⬜ Todo |

**Exit criteria:** User đăng nhập qua Keycloak, JWT được cấp, traffic TLS, mọi request được audit-log.

---

## Phase 2 — Core HR Modules (Weeks 9–20)
**Goal:** Personnel trước (nền tảng), rồi Attendance.

| Week | Deliverable | Status |
|---|---|---|
| 9–11 | Personnel Service: hồ sơ nhân viên, org chart, hợp đồng, upload tài liệu (MinIO) | ⬜ Todo |
| 12–13 | Phân cấp tổ chức: cây phòng ban, reporting lines, quản lý chức danh | ⬜ Todo |
| 14–16 | Attendance Service: check-in/out API, GPS validation, QR code, RFID/biometric connector | ⬜ Todo |
| 17–18 | Nghỉ phép & tăng ca: loại nghỉ, số dư phép, approval workflow engine | ⬜ Todo |
| 19–20 | Admin UI: danh sách/tìm kiếm nhân viên (OpenSearch), dashboard chấm công, duyệt nghỉ | ⬜ Todo |

**Exit criteria:** HR có thể quản lý hồ sơ nhân viên và chấm công; đơn nghỉ phép chạy qua approval.

---

## Phase 3 — Payroll & Compliance (Weeks 21–28)
**Goal:** Tính lương tự động, tuân thủ BHXH/BHYT/thuế TNCN Việt Nam.

| Week | Deliverable | Status |
|---|---|---|
| 21–22 | Payroll engine: cấu hình quy tắc lương (cơ bản, phụ cấp, OT), mã hóa cột lương | ⬜ Todo |
| 23–24 | Tính BHXH/BHYT/BHTN, thuế TNCN lũy tiến theo quy định hiện hành | ⬜ Todo |
| 25–26 | Phiếu lương PDF, approval flow chạy lương, export cho phần mềm kế toán | ⬜ Todo |
| 27–28 | Sync cổng BHXH, connector nộp e-Tax, báo cáo kiểm toán lương | ⬜ Todo |

**Exit criteria:** Có thể tính lương tháng, duyệt, và nộp lên cổng BHXH/thuế.

---

## Phase 4 — Recruitment, KPI & Reporting (Weeks 29–38)

| Week | Deliverable | Status |
|---|---|---|
| 29–31 | Recruitment: đăng tin, pipeline ứng viên, lịch phỏng vấn, offer letter | ⬜ Todo |
| 32–33 | Onboarding: checklist công việc, thu thập giấy tờ, cấp tài khoản | ⬜ Todo |
| 34–36 | KPI Service: thiết lập mục tiêu, KPI tree, 360° evaluation, tổng hợp điểm | ⬜ Todo |
| 37–38 | Report Service: dashboard, export Excel/PDF, phân tích turnover/headcount/chi phí | ⬜ Todo |

---

## Phase 5 — Integration & Hardening (Weeks 39–44)

| Week | Deliverable | Status |
|---|---|---|
| 39–40 | ERP/CRM API connectors, sync phần mềm kế toán, tích hợp RFID/biometric đầy đủ | ⬜ Todo |
| 41 | Penetration testing (OWASP Top 10), khắc phục lỗ hổng | ⬜ Todo |
| 42 | Load testing (500–1,000 concurrent users), tối ưu query DB, tuning cache | ⬜ Todo |
| 43 | UAT với phòng Nhân sự, sprint fix bug | ⬜ Todo |
| 44 | Go-live: cutover production (Docker Compose → K8s on-prem), monitoring, runbook | ⬜ Todo |
