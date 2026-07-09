# HRM Project — Decision & Change Log

Mỗi khi có quyết định kiến trúc, thay đổi yêu cầu, hoặc điều chỉnh kế hoạch — ghi vào đây.  
Format: `## [YYYY-MM-DD] — [Loại thay đổi]: [Tiêu đề ngắn]`

---

## [2026-07-09] — FEAT: Báo cáo Excel chấm công + Hồ sơ lý lịch PDF + Hoàn thiện TNTT

**Người thực hiện:** NhatMInh2002
**Phiên làm việc:** 2026-07-09
**Branch:** `claude/salary-config-details-qeytz1`
**Hướng dẫn chi tiết:** `docs/guides/salary-attendance-profile-flow.md`

### Giai đoạn 0 — Nền tảng chung

- `V37__base_salary_configs.sql` + `BaseSalaryService`: lương cơ sở tra theo ngày hiệu lực, **bỏ hard-code 2.530.000đ** ở `PayrollService` và `SalaryIncrementConfigResponse`. Đổi Nghị định chỉ cần INSERT 1 dòng.
- Tách `SalaryIncrementCalculator` (dùng chung preview + sinh bảng lương), có overload nhận ngày công từ chấm công.
- **Mã hóa AES-256-GCM** cột `national_id` (`V38` + `PiiCrypto`/`EncryptedPiiConverter` trong shared-kernel) — NĐ 13/2023. Đọc được plaintext cũ, ghi luôn mã hóa. Khóa từ env `HRM_ENCRYPTION_KEY`.

### Hạng mục A — 10 báo cáo Excel chấm công

- `AttendanceExcelService` + `AttendanceReportController`: 10 endpoint `GET /attendance/export/*.xlsx` (bảng chấm công 01a-LĐTL toàn viện/theo khoa, đi muộn-về sớm, vắng không phép, tăng ca, nghỉ phép theo loại, số dư phép năm, đối soát công-lương, so sánh chuyên cần giữa khoa, chi tiết 1 NV).
- Frontend: card "Xuất báo cáo Excel chấm công" trên trang Báo cáo (`reports/page.tsx`).

### Hạng mục B — Hồ sơ lý lịch HS02-VC/BNV + PDF

- `V39`: ~25 cột bổ sung `employees` + 4 bảng con (quá trình công tác, đào tạo, quan hệ gia đình, khen thưởng/kỷ luật). Số BHXH/BHYT/sức khỏe mã hóa PII.
- `EmployeeProfileService` + `ProfilePdfService`: xuất Sơ yếu lý lịch viên chức mẫu HS02-VC/BNV (TT 07/2019/TT-BNV).
- Frontend: `EmployeeProfileModal` 7 tab + nút Xuất PDF, mở từ bảng nhân sự.

### Hạng mục C — Tích hợp TNTT vào bảng lương

- `V40`: bảng `specialty_department_multipliers` (% đặc thù khoa/phòng, mặc định 100% chờ TCCB xác nhận); cột `salary_increment` trên `payroll_records`; workflow duyệt cấu hình TNTT (`status` DRAFT/APPROVED).
- `generatePeriod`: cộng TNTT (**chỉ bản đã duyệt**) vào gross — **chịu thuế TNCN, KHÔNG tính đóng BHXH**; ngày công lấy từ chấm công.
- Phiếu lương PDF + Excel + phiếu lương cá nhân: thêm mục/cột **Thu nhập tăng thêm**.

### Kiểm thử

- `SalaryIncrementCalculatorTest`: **6/6 pass** — kiểm chứng công thức TNTT bằng ví dụ tính tay (Trưởng khoa+BS A1 = 16.445.000đ, kiêm nhiệm 25%, thiếu CCHN 85%×đặc thù 120%, C2=0đ, ngày công 18/22, A2 80%).

### Còn phụ thuộc nghiệp vụ (chờ Phòng TCCB)

- Danh sách **% đặc thù khoa/phòng** (110-135%) — đang seed 100% để không tự đổi lương.
- Xác nhận cách tính **thuế/BHXH của TNTT** và cơ chế hồi tố/truy lĩnh.
- Đặt `HRM_ENCRYPTION_KEY` ở production (hiện fallback khóa dev + log cảnh báo).

---

## [2026-06-24] — FEAT: UI overhaul + Nhân sự nâng cao + Danh mục + Sidebar + RBAC planning

**Người thực hiện:** NhatMInh2002
**Phiên làm việc:** 2026-06-24

### UI / UX

| Thành phần | Thay đổi |
|---|---|
| `side-nav.tsx` | Redesign hoàn toàn — hover-to-expand, SVG icons chuyên nghiệp, navy `#1a2b4a`, section labels, footer: Cài đặt + Đăng xuất |
| `login/page.tsx` | Auto-redirect SSO khi vào `/login`, bỏ trang trung gian |
| Responsive | `departments/page.tsx`, `categories/page.tsx` — responsive đầy đủ |

### Module Nhân sự

- Thêm cột **SĐT** vào bảng danh sách
- Filter theo **Phòng ban** (không hiện GRP- group nodes)
- Pagination số trang: `« ‹ 1 2 3 … 17 › »`
- Nút **"Nghỉ việc"** (soft delete — set `status=TERMINATED`, data giữ trong DB)
- Form nhân viên: 3 tab Cơ bản / Chi tiết / Địa chỉ, thêm trình độ, dân tộc, tôn giáo, quê quán
- `V10__employee_extra_fields.sql`: thêm 5 cột `education_level`, `ethnicity`, `religion`, `hometown`, `address`

### Module Danh mục (mới)

- Trang `/dashboard/categories` — quản lý 7 danh mục qua localStorage
- `lib/categories.ts`: 54 dân tộc, 21 quận/huyện Nghệ An, loại hợp đồng viên chức/công chức
- CRUD inline: thêm, sửa, ẩn/hiện, xóa, đổi thứ tự, reset về mặc định

### Module Phòng ban

- Sơ đồ cây có nút thu gọn ▼/▶
- Fix DB: `parent_id` cho DV-001 → GRP-TRUNGTAM, DV-002 → GRP-PHONG, DV-003 → GRP-KHOA

### Import dữ liệu thực tế

- `scripts/import_canbo.py`: import 331 cán bộ từ file `CanBo.xls` vào PostgreSQL
- Tổng: **335 nhân viên** trong hệ thống

### Chất lượng

- Fix `.gitignore`: `**/target/` thay vì `backend/target/` — không còn track compiled artifacts
- Tạo `docs/guides/testing-strategy.md` — 50+ test cases phân loại P0/P1/P2

### Quyết định kiến trúc

- **RBAC Phase 1**: `canWrite = !!session` (mọi user đăng nhập đều có quyền) — chấp nhận tạm thời
- **RBAC Phase 2** (kế hoạch): triển khai phân quyền thực theo roles — xem `docs/implementation/rbac-plan.md`

---

## [2026-06-19] — INIT: Khởi tạo dự án & thiết kế kiến trúc ban đầu

**Người quyết định:** (chưa xác định)  
**Nội dung:**
- Xác định yêu cầu: DNNN Việt Nam, 500–5,000 nhân viên, on-premises
- Chọn stack: Spring Boot + Next.js + PostgreSQL + Redis + MinIO + OpenSearch
- SSO: Microsoft Active Directory / Azure AD (SAML 2.0)
- Kiến trúc: Modular Monolith (thay vì microservices)
- Modules yêu cầu: Personnel, Attendance (GPS/QR), Payroll (BHXH/BHYT/thuế), Recruitment, KPI/360°, Approval Workflow, Reporting, ERP integrations

**Tài liệu liên quan:**
- `docs/adr/ADR-001-architecture-evaluation.md`
- `docs/implementation/phased-plan.md`

---

## [2026-06-19] — ADR-001: Đánh giá kiến trúc cho DNNN

**Quyết định:** Dùng Modular Monolith thay microservices  
**Lý do:** Đội IT DNNN ít kinh nghiệm K8s, ops burden cao không cần thiết ở quy mô này  
**Rủi ro được ghi nhận:**
- Thiếu DR site → cần bổ sung trước go-live
- Chưa có Data Classification layer (yêu cầu NĐ 13/2023)
- Chưa có chữ ký số (cần VNPT-CA hoặc Viettel-CA)
- Cần khai báo Cấp độ bảo mật theo TT12/2022
- Elasticsearch → thay bằng OpenSearch (license Apache 2.0)

**Chi tiết:** `docs/adr/ADR-001-architecture-evaluation.md`

---

---

## [2026-06-20] — FEAT: Scaffold đầy đủ + SSO hoạt động + Personnel module cơ bản

**Người thực hiện:** NhatMInh2002  
**Phiên làm việc:** 2026-06-20 (full day)

### 1. Backend — Spring Boot Modular Monolith

**Modules đã scaffold:**
- `shared-kernel`: `ApiResponse<T>`, `HrmException`, `GlobalExceptionHandler`
- `module-personnel`: `Employee`, `Department` entities + CRUD API + Audit log schema
- `module-attendance`: `AttendanceRecord`, `LeaveRequest` entities + check-in/out API
- `module-payroll`: `PayrollRecord`, `SalaryConfig` entities + tính lương + PDF service
- `app`: main Spring Boot application, `SecurityConfig` (JWT/OAuth2 Resource Server + CORS)

**Flyway migrations:**
- `V1__create_personnel_schema.sql` — bảng employees, departments, audit log
- `V2__seed_departments.sql` — 64 phòng ban HNĐK Nghệ An
- `V3__create_attendance_schema.sql` — bảng attendance_records, leave_requests
- `V4__create_payroll_schema.sql` — bảng payroll_records, salary_configs
- `V5__seed_employees.sql` — 10 nhân viên test (ON CONFLICT DO NOTHING)
- `V6__fix_contract_type.sql` — fix data cũ: `FULL_TIME` → `INDEFINITE`

**Cấu hình quan trọng:**
- `server.servlet.context-path=/api` trong `application.yml`
- Tất cả `@RequestMapping` controller KHÔNG có tiền tố `/api` (đã fix bug double-prefix)
- CORS cho phép `http://localhost:3000`
- JWT converter đọc roles từ claim `roles` (Keycloak mapper) hoặc fallback `realm_access.roles`

### 2. Frontend — Next.js 15

**Cấu trúc:**
- App Router cho pages (`/dashboard/*`)
- Pages Router cho NextAuth (`/pages/api/auth/[...nextauth].ts`) — bắt buộc với Next.js 15
- `next.config.mjs`: proxy `/api/{module}/*` → backend, KHÔNG proxy `/api/auth/*`

**Lib layer:**
- `lib/api.ts`: `apiFetch` tự động unwrap `ApiResponse<T>.data`
- `lib/personnel.ts`, `lib/attendance.ts`, `lib/payroll.ts`, `lib/dashboard.ts`, `lib/departments.ts`

**Pages đã có:**
- `/dashboard` — Tổng quan: stat cards + quick links
- `/dashboard/personnel` — Danh sách nhân viên, tìm kiếm, phân trang, form thêm/sửa/cho thôi việc
- `/dashboard/org-chart` — Sơ đồ tổ chức 64 phòng ban theo nhóm
- `/dashboard/attendance` — Bảng chấm công theo ngày
- `/dashboard/attendance/leave` — Đơn nghỉ phép
- `/dashboard/payroll` — Bảng lương
- `/dashboard/payroll/config` — Cấu hình lương

### 3. SSO — Keycloak

**Keycloak realm `hrm`:**
- Client `hrm-frontend`: OIDC, PKCE disabled (set "Choose..."), secret configured
- Client `hrm-backend`: bearer-only
- Roles: `ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`
- Client scopes: `openid`, `profile`, `email`, `roles` (realm mapper → claim `roles`)
- Users: `admin.hrm` / `Admin@123`, `hr.manager` / `Hr@123456`

**NextAuth config (`lib/auth.ts`):**
- `checks: ['state']` — PKCE tắt hoàn toàn
- `authorization: { params: { scope: 'openid' } }` — chỉ request openid để tránh `invalid_scope`
- JWT callback: lưu `accessToken`, `roles` vào session

### 4. Bugs đã fix trong session này

| Bug | Nguyên nhân | Fix |
|-----|------------|-----|
| `/api/auth/error` HTTP 401 | `next.config.mjs` proxy ALL `/api/*` kể cả NextAuth | Chỉ proxy các module cụ thể |
| `error=Callback` | PKCE mismatch NextAuth ↔ Keycloak | Tắt PKCE cả 2 phía |
| `signIn()` trả về `undefined` | NextAuth v4 + Next.js 15 App Router incompatible | Dùng Pages Router |
| `invalid_scope` | Keycloak realm thiếu `email`/`profile` scopes | Restrict scope chỉ còn `openid` |
| `NoResourceFoundException` | Double `/api` prefix (context-path + controller) | Xóa `/api` khỏi tất cả 6 controller `@RequestMapping` |
| Flyway V5 duplicate key | Chạy lại migration trên DB đã có data | Thêm `ON CONFLICT DO NOTHING` + repair flyway_schema_history |
| `FULL_TIME` không có trong enum | Seed dùng `FULL_TIME` nhưng `ContractType` enum không có | V6 migration + fix V5 seed |
| API response không unwrap | `apiFetch` trả raw JSON, backend wrap trong `ApiResponse<T>` | Auto-unwrap trong `apiFetch` |
| Frontend dùng `startDate` | Backend trả `joinDate` | Đồng bộ type + form |

### 5. Trạng thái cuối session

- ✅ SSO login hoạt động với `testuser` (tạo thủ công) và `admin.hrm` / `hr.manager` (từ realm JSON)
- ✅ Org-chart hiện 64 phòng ban
- ✅ Backend recompile đúng với controller mappings mới
- ⏳ Personnel page: đã fix type mismatches, chờ verify sau khi backend restart + V6 chạy
- ⏳ Dashboard stats: chờ verify

---

## [2026-06-22] — FIX: Đồng bộ frontend/backend — employeeId, joinDate, contractType

**Người thực hiện:** NhatMInh2002  
**Phiên làm việc:** 2026-06-22

### Bugs đã fix

| Bug | Nguyên nhân | Fix |
|-----|------------|-----|
| Leave/Attendance không gửi đúng `employeeId` | Frontend dùng email thay vì UUID | Thêm endpoint `GET /personnel/employees/me` + hook `useCurrentEmployee` |
| `joinDate` undefined | Backend trả `joinDate`, frontend đọc `startDate` | Đồng bộ type `Employee` |
| `FULL_TIME` enum lỗi | `ContractType` enum không có `FULL_TIME` | V6 migration fix data cũ |
| Frontend gọi trực tiếp `localhost:8080` (bypass proxy) | `NEXT_PUBLIC_API_BASE_URL` hardcode trong `.env.local` | Sửa `apiFetch` dùng window check: browser → `/api`, server → `BACKEND_URL` |
| CORS thiếu port 3001 | Frontend đôi khi chạy trên 3001 | Thêm `localhost:3001` vào `SecurityConfig` |

### Thêm mới

- `GET /personnel/employees/me` — lookup nhân viên theo email từ JWT claim
- Hook `useCurrentEmployee` (React Query) — tự động lấy thông tin nhân viên hiện tại
- Attendance page: check-in/out dùng `employeeId` thay email
- Leave page: tự điền `employeeId` từ hook, không cần nhập tay

---

## [2026-06-23] — FIX: JWT validation + Keycloak logout + Seed data đầy đủ

**Người thực hiện:** NhatMInh2002  
**Phiên làm việc:** 2026-06-23

### Root cause — Không có data hiển thị

| Vấn đề | Nguyên nhân | Fix |
|--------|------------|-----|
| Tất cả API trả 401 | Backend Docker dùng `localhost:8180` để verify JWT — nhưng trong container `localhost` = container đó, không phải host | Restart với env `KEYCLOAK_JWK_SET_URI=http://hrm-keycloak:8180/realms/hrm/protocol/openid-connect/certs` |
| API trả 403 | User đăng nhập với role `EMPLOYEE`, không có `ADMIN`/`HR_MANAGER` | Reset password `admin.hrm` → `Admin@123`; hướng dẫn dùng đúng tài khoản |
| Sau signout, SSO không hiện form Keycloak | NextAuth chỉ xóa session cookie, không xóa Keycloak SSO session → auto-login lại user cũ | Cập nhật `TopBar.tsx`: logout redirect đến `{issuer}/protocol/openid-connect/logout?id_token_hint=...` |
| `admin.hrm` báo sai password | Password không match | Reset qua Keycloak Admin API |

### Backend — cấu hình quan trọng

```
KEYCLOAK_JWK_SET_URI=http://hrm-keycloak:8180/realms/hrm/protocol/openid-connect/certs
SPRING_DATASOURCE_URL=jdbc:postgresql://hrm-postgres:5432/hrm
SPRING_DATASOURCE_PASSWORD=hrm_dev_pass   ← (không phải hrm_dev_password)
```

Backend phải chạy trong Docker (không phải host JVM) vì JDK 21 trên Windows có bug `WEPollSelectorImpl` khiến `Selector.open()` fail với Docker Desktop / WSL2.

### Keycloak — cấu hình bổ sung

- Thêm `post.logout.redirect.uris` cho client `hrm-frontend`: `http://localhost:3000/login##http://localhost:3000/*`

### Frontend — thay đổi

- `lib/auth.ts`: lưu `id_token` vào JWT token + session (cần cho Keycloak logout)
- `components/top-bar.tsx`: logout gọi Keycloak end-session endpoint với `id_token_hint`
- `.env.local`: thêm `NEXT_PUBLIC_KEYCLOAK_ISSUER`

### Seed data (V7 migration)

| Bảng | Số lượng |
|------|---------|
| `personnel.employees` | 30 nhân viên (từ 10 → 30, trải đều các khoa/phòng) |
| `attendance.attendance_records` | 143 bản ghi (tháng 6/2026, trừ T7/CN) |
| `attendance.leave_requests` | 8 đơn (ANNUAL, SICK, PERSONAL, MATERNITY) |
| `payroll.payroll_records` | 23 bản lương (tháng 5 PAID + tháng 6 DRAFT) |

### Trạng thái cuối session

- ✅ Backend chạy trong Docker với JWT validation đúng (Keycloak service name)
- ✅ Đăng nhập `admin.hrm` / `Admin@123` hoạt động
- ✅ Logout xóa cả NextAuth session + Keycloak SSO session
- ✅ 30 nhân viên, 64 phòng ban, 143 chấm công, 8 đơn nghỉ, 23 bản lương trong DB
- ⏳ Cần verify: data hiển thị đúng trên Personnel, Org-chart, Attendance, Payroll pages sau khi đăng nhập đúng tài khoản

---

## [2026-06-26] — FEAT: Notification system + Attendance UX redesign + Docker dev mode

**Người thực hiện:** NhatMInh2002  
**Branch:** feat/phase2-personnel-profile (tiếp theo từ main)

### Backend — Notification System

| File | Nội dung |
|---|---|
| `notification/Notification.java` | JPA entity → `personnel.notifications` |
| `notification/NotificationEventListener.java` | @Async @EventListener cho 3 event: LEAVE_SUBMITTED, LEAVE_STATUS_CHANGED, CHECKIN |
| `notification/AttendanceReminderScheduler.java` | @Scheduled: 7:45 nhắc check-in, 15:45 nhắc check-out (T2-T6, Asia/Ho_Chi_Minh) |
| `shared-kernel/event/` | 3 event records dùng String (không enum) tránh circular dependency |
| `V15__create_notifications.sql` | Bảng notifications + index recipient_unread |

### Backend — Auth

- `AuthController`: `POST /auth/change-password` — inject `Authentication auth` lấy email từ principal
- `AuthService.changePassword()`: BCrypt verify + encode mật khẩu mới

### Frontend — TopBar

- Avatar initials + dropdown: Hồ sơ / Đổi mật khẩu / Nghỉ phép / Lương cá nhân / Đăng xuất
- `ChangePasswordModal`: strength bar 4 mức, eye toggle, rule checklist
- `NotificationBell`: polling 30s, badge unread, click-to-read, đọc tất cả
- `lib/notifications.ts`: client functions cho 4 endpoints

### Frontend — Dashboard

- `auth.ts`: fix bug `session.role` chưa được set → admin luôn thấy employee view
- `dashboard/page.tsx`: role-based render (ADMIN/HR_MANAGER → AdminDashboard, EMPLOYEE → EmployeeDashboard)
- Fix công chuẩn: 22 ngày (T2-T6 only, bỏ T7)

### Frontend — Attendance

- Employee view: today card (giờ vào/ra/thời gian), stats (đủ 8h/thiếu giờ/thiếu dấu/tổng giờ), calendar màu theo giờ thực tế (≥8h xanh, <8h vàng, thiếu đỏ, phép tím), bảng lịch sử
- Admin/HR view: giữ nguyên bảng danh sách theo ngày
- Màu calendar dựa giờ làm thực tế, không theo status backend

### Docker / Infra

- `Dockerfile.dev`: dev mode mount source, HMR
- `docker-compose.yml`: `WATCHPACK_POLLING=true` fix inotify không hoạt động Windows→WSL2
- `Dockerfile` production: `ARG BACKEND_URL=http://backend:8080` baked at build
- pgAdmin thêm vào compose (port 5050): `http://localhost:5050`
- `next.config.mjs`: thêm `/api/auth-backend/*` proxy + notifications module

### Trạng thái cuối session

- ✅ Check-in/check-out hoạt động, hiển thị đúng giờ làm
- ✅ Thông báo bell hoạt động (test bằng curl)
- ✅ Admin thấy AdminDashboard, nhân viên thấy EmployeeDashboard
- ✅ Docker HMR hoạt động — sửa file tsx tự reload ~1s
- ✅ pgAdmin accessible tại localhost:5050
- ⏳ Tiếp theo: Hồ sơ cá nhân nhân viên (branch feat/phase2-personnel-profile)

---

<!-- Template cho entry tiếp theo:

## [YYYY-MM-DD] — [LOẠI]: [Tiêu đề]

**Người quyết định:**  
**Nội dung:**  
**Tác động:**  
**Tài liệu liên quan:**  

-->
