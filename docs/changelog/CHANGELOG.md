# HRM Project — Decision & Change Log

Mỗi khi có quyết định kiến trúc, thay đổi yêu cầu, hoặc điều chỉnh kế hoạch — ghi vào đây.  
Format: `## [YYYY-MM-DD] — [Loại thay đổi]: [Tiêu đề ngắn]`

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
- `V2__seed_departments.sql` — 64 phòng ban BVĐK Hà Nội NA
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

<!-- Template cho entry tiếp theo:

## [YYYY-MM-DD] — [LOẠI]: [Tiêu đề]

**Người quyết định:**  
**Nội dung:**  
**Tác động:**  
**Tài liệu liên quan:**  

-->
