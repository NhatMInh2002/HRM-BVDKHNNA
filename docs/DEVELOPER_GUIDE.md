# Developer Guide — HRM HNĐK Nghệ An

Hướng dẫn này giúp developer mới chạy được project trong vòng **15 phút**.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Clone & cấu trúc project](#2-clone--cấu-trúc-project)
3. [Biến môi trường](#3-biến-môi-trường)
4. [Khởi động môi trường dev](#4-khởi-động-môi-trường-dev)
5. [Tài khoản test](#5-tài-khoản-test)
6. [Chạy backend local (hot-reload)](#6-chạy-backend-local-hot-reload)
7. [Chạy frontend local (hot-reload)](#7-chạy-frontend-local-hot-reload)
8. [Kiểm tra nhanh hệ thống](#8-kiểm-tra-nhanh-hệ-thống)
9. [Gọi API với JWT](#9-gọi-api-với-jwt)
10. [Chạy full stack bằng Docker](#10-chạy-full-stack-bằng-docker)
11. [Quy trình làm việc với Git](#11-quy-trình-làm-việc-với-git)
12. [CI/CD](#12-cicd)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Java (JDK) | 21 | Eclipse Temurin khuyến nghị |
| Maven | 3.9+ | hoặc dùng `./mvnw` trong thư mục `backend/` |
| Node.js | 20 LTS | |
| npm | 10+ | đi kèm Node.js 20 |
| Docker Desktop | 4.x | cần bật WSL2 trên Windows |
| Git | 2.x | |

---

## 2. Clone & cấu trúc project

```bash
git clone https://github.com/NhatMInh2002/HRM-BVDKHNNA.git
cd HRM-BVDKHNNA
```

```
HRM/
├── backend/              ← Spring Boot 3 (Java 21), Modular Monolith
│   ├── app/              ← entry point (SecurityConfig, AuthService, application.yml)
│   │                       + các feature service gọn: auth/2FA, admin, audit,
│   │                         leave approval, notification, onboarding, KPI,
│   │                         recruitment, report, storage
│   ├── module-personnel/ ← nhân sự, phòng ban, hợp đồng
│   ├── module-attendance/← chấm công, nghỉ phép
│   ├── module-payroll/   ← lương
│   └── shared-kernel/    ← entity cha, exception, audit log
├── frontend/             ← Next.js 15 (App Router) + NextAuth
│   └── src/
│       ├── app/          ← pages & layouts
│       ├── components/   ← UI components
│       └── lib/          ← auth.ts, api.ts
├── nginx/                ← reverse proxy + TLS (production-like)
├── docs/                 ← tài liệu kiến trúc, phased-plan
├── docker-compose.yml    ← tất cả services
└── .claude/launch.json   ← cấu hình dev servers
```

---

## 3. Biến môi trường

### Backend — `backend/app/src/main/resources/application.yml`

Không cần file `.env` riêng. Các biến quan trọng có giá trị mặc định cho dev:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/hrm}
    username: ${DB_USERNAME:hrm}
    password: ${DB_PASSWORD:hrm_dev_pass}
app:
  jwt:
    secret: ${JWT_SECRET:...}   # ký JWT tự quản lý — không phụ thuộc IdP ngoài
```

Auth tự quản lý: `POST /api/auth/login` nhận `email` + `password`, so khớp BCrypt với `employees.password_hash`, trả về JWT ký bằng `JWT_SECRET`. Không có Keycloak/Azure AD nào tham gia ở giai đoạn hiện tại (xem `docs/implementation/phased-plan.md` — SSO/AD FS là việc của Phase 5, chưa triển khai).

### Root — file `.env` (copy từ `.env.example`)

```env
POSTGRES_PASSWORD=hrm_dev_pass
JWT_SECRET=<chuỗi random tối thiểu 32 ký tự>
NEXTAUTH_SECRET=<chuỗi random bất kỳ, ví dụ: openssl rand -base64 32>
MINIO_ROOT_PASSWORD=hrm_minio_dev
```

> ⚠️ **`.env` chỉ được `docker-compose` đọc.** Spring Boot **không** tự nạp file này — khi chạy backend bằng `mvn spring-boot:run` (mục 6, ngoài Docker) mà không export biến môi trường tương ứng, app sẽ dùng default cứng trong `application.yml` (vd. MinIO secret-key mặc định là `hrm_minio_pass`, khác với `MINIO_ROOT_PASSWORD` bạn đặt trong `.env` cho container MinIO) → tính năng upload avatar/chữ ký/file đính kèm sẽ lỗi 403/500 mà không rõ nguyên nhân. Xem cách export ở mục 6.

### Frontend — tạo file `frontend/.env.local`

```env
BACKEND_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<giống NEXTAUTH_SECRET ở trên>
```

---

## 4. Khởi động môi trường dev

**Bước đầu tiên luôn phải chạy infrastructure (PostgreSQL, Redis, MinIO):**

```bash
docker compose up postgres redis minio -d
```

Chờ healthy:

```bash
docker compose ps        # cột STATUS phải là "healthy"
```

**Services và port:**

| Service | URL / Port | Tài khoản |
|---|---|---|
| PostgreSQL | `localhost:5432` DB: `hrm` | `hrm` / `hrm_dev_pass` |
| Redis | `localhost:6379` | — |
| MinIO Console | http://localhost:9001 | `hrm_minio` / `hrm_minio_dev` |
| pgAdmin | http://localhost:5050 | xem `.env` → `PGADMIN_DEFAULT_EMAIL` |
| Nginx (reverse proxy, tùy chọn) | https://localhost | TLS tự ký, dùng cho test production-like |

> OpenSearch hiện **tắt** trong `docker-compose.yml` (tốn ~512MB RAM) — tìm kiếm nhân viên dùng `LIKE` query trong PostgreSQL.

---

## 5. Tài khoản test

Tài khoản được seed sẵn qua Flyway migration (`V14__add_password_hash.sql` và các seed khác) — không cần tạo tay.

### 5.1 Tài khoản mặc định

| Email | Mật khẩu | Role | Quyền hạn |
|---|---|---|---|
| `admin@bvnghean.vn` | `Admin@2025` | `ADMIN` | Toàn quyền: xem/thêm/sửa/xóa tất cả module |

Các tài khoản khác (HR_MANAGER, DEPT_HEAD, ACCOUNTANT...) được gán quyền qua giao diện **Phân quyền** (`/dashboard/settings`, chỉ ADMIN truy cập) — chọn nhân viên, tick các permission tương ứng (`SYSTEM_ADMIN`, `LEAVE_APPROVE_HR`, `LEAVE_APPROVE_DEPT`, `PAYROLL_MANAGE`...), hệ thống tự suy ra `hrmRole` từ tập quyền (xem `PermissionController.deriveRole()`).

### 5.2 Roles và quyền hạn chi tiết

| Role | Xem DS nhân viên | Thêm/Sửa NV | Cho thôi việc | Xem lương | Duyệt nghỉ phép |
|---|:---:|:---:|:---:|:---:|:---:|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `HR_MANAGER` | ✅ | ✅ | ❌ | ✅ | ✅ (cấp 2) |
| `DEPT_HEAD` / `DEPARTMENT_MANAGER` | ✅ (phòng ban) | ❌ | ❌ | ❌ | ✅ (cấp 1, phòng mình) |
| `ACCOUNTANT` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `EMPLOYEE` | ❌ | ❌ | ❌ | ❌ (chỉ xem lương mình) | ❌ |

> `DEPT_HEAD` và `DEPARTMENT_MANAGER` là hai tên gọi tương đương cho cùng vai trò trưởng phòng — cả hai đều được công nhận ở cả frontend (`useRoles.ts`, `side-nav.tsx`) lẫn backend (`@PreAuthorize`).

### 5.3 Lấy JWT token để test API (curl / Postman)

```bash
TOKEN=$(curl -sf -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bvnghean.vn","password":"Admin@2025"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN   # paste vào Postman hoặc dùng trực tiếp trong curl
```

Dùng token để gọi API:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/personnel/employees
```

---

## 6. Chạy backend local (hot-reload)

Nếu `.env` ở bước 3 dùng giá trị khác default trong `application.yml` (đặc biệt `MINIO_ROOT_PASSWORD`), export cùng giá trị đó trước khi chạy — nếu không, upload file sẽ auth-fail với MinIO trong Docker:

```bash
cd backend
export MINIO_ROOT_PASSWORD=hrm_minio_dev   # PowerShell: $env:MINIO_ROOT_PASSWORD = "hrm_minio_dev"
mvn spring-boot:run -pl app
# hoặc dùng wrapper nếu chưa cài Maven hệ thống: ./mvnw spring-boot:run -pl app (Windows: mvnw.cmd)
```

Backend chạy tại http://localhost:8080, context path `/api`. Health check: http://localhost:8080/api/actuator/health

---

## 7. Chạy frontend local (hot-reload)

```bash
cd frontend
npm install        # lần đầu hoặc sau khi pull code mới
npm run dev
```

Mở trình duyệt: http://localhost:3000

- Tự động redirect sang `/login`
- Đăng nhập bằng tài khoản test ở mục 5 (email + password — form thường, không có SSO)

---

## 8. Kiểm tra nhanh hệ thống

Sau khi đăng nhập, mở F12 → Application → Cookies → `next-auth.session-token` phải có giá trị.

Checklist:

- [ ] http://localhost:8080/api/actuator/health → `{"status":"UP"}`
- [ ] http://localhost:3000 → redirect về `/login`
- [ ] Đăng nhập → vào `/dashboard` thành công
- [ ] SideNav hiện đúng menu theo role

---

## 9. Gọi API với JWT

> Xem [mục 5.3](#53-lấy-jwt-token-để-test-api-curl--postman) để lấy token trước.

```bash
# Danh sách nhân viên (có phân trang + tìm kiếm)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/personnel/employees?page=0&size=10&keyword=nguyen"

# Tạo nhân viên mới (cần role ADMIN hoặc HR_MANAGER)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "NV001",
    "fullName": "Nguyễn Văn A",
    "email": "nva@bvnghean.vn",
    "phone": "0901234567",
    "position": "Điều dưỡng",
    "contractType": "INDEFINITE",
    "joinDate": "2024-01-01"
  }' \
  "http://localhost:8080/api/personnel/employees"

# Cho thôi việc (chỉ ADMIN)
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/personnel/employees/<id>/terminate"
```

**ContractType hợp lệ:** `INDEFINITE`, `FIXED_TERM_1Y`, `FIXED_TERM_2Y`, `PART_TIME`, `PROBATION`

---

## 10. Chạy full stack bằng Docker

Khi cần test production-like (không dùng hot-reload):

```bash
# Build và chạy tất cả
docker compose up --build -d

# Xem log
docker compose logs -f backend
docker compose logs -f frontend

# Dừng tất cả
docker compose down

# Dừng và xóa volume (reset database)
docker compose down -v
```

**Cổng khi chạy qua Docker (khác với hot-reload ở mục 6–7):**

| Service | Cổng host | Ghi chú |
|---|---|---|
| Backend | `8080` | giống hot-reload |
| Frontend | **`4000`** → http://localhost:4000 | container map `4000:3000` — **không phải 3000** như mục 7 |
| Nginx (nếu bật) | `80` / `443` → https://localhost | reverse proxy trỏ vào frontend/backend ở trên |

Đẩy code mới lên container đang chạy mà không rebuild image (nhanh hơn nhiều, xem thêm trong memory `feedback-deploy-workflow`):

```bash
# Backend
cd backend && mvn package -q -DskipTests
docker cp app/target/app-1.0.0-SNAPSHOT.jar hrm-backend:/app/app.jar
docker restart hrm-backend

# Frontend
cd frontend && npm run build
docker cp .next/standalone/. hrm-frontend:/app/
docker cp .next/static hrm-frontend:/app/.next/static
docker restart hrm-frontend
```

---

## 11. Quy trình làm việc với Git

```
main (protected)
└── develop (protected)
    ├── feat/xxx    ← feature branch
    ├── fix/xxx     ← bugfix branch
    └── chore/xxx   ← tooling, config
```

```bash
# Tạo branch mới từ develop
git checkout develop
git pull origin develop
git checkout -b feat/ten-tinh-nang

# Sau khi xong, push và tạo PR về develop
git push origin feat/ten-tinh-nang
gh pr create --base develop --title "feat: ..."
```

**Quy tắc commit (Conventional Commits):**

```
feat: thêm tính năng mới
fix: sửa lỗi
chore: thay đổi không ảnh hưởng logic
docs: cập nhật tài liệu
refactor: refactor code
test: thêm/sửa test
```

PR phải pass tất cả CI checks trước khi merge.

---

## 12. CI/CD

Mỗi PR chạy 3 workflow tự động, tổng cộng 9 check độc lập:

| Workflow | File | Check |
|---|---|---|
| Backend CI | `.github/workflows/ci-backend.yml` | `Build & Test` (Maven + unit test), `Coverage Gate (≥ 70%)` (JaCoCo) |
| Frontend CI | `.github/workflows/ci-frontend.yml` | `Lint, Type-check & Test` (ESLint + tsc + Vitest, `--passWithNoTests`), `Build` (Next.js) |
| Security Scan | `.github/workflows/security-scan.yml` | `OWASP Dependency Check (Backend)`, `NPM Audit (Frontend)`, `SAST — CodeQL` (java + javascript), `Secret Scan (Gitleaks)` |

> **Lưu ý:** Security scan cần secret `NVD_API_KEY` trong repo Settings → Secrets. Không có key vẫn chạy được nhưng chậm hơn.
>
> **Lưu ý:** Frontend hiện **chưa có test file nào** (`frontend/src/**/*.{test,spec}.*`) — bước Vitest chạy với `--passWithNoTests` nên luôn xanh dù không test gì. Coverage Gate 70% chỉ áp dụng cho backend (JaCoCo).

---

## 13. Troubleshooting

### Backend lỗi `401 Unauthorized`

Token hết hạn. Lấy token mới theo hướng dẫn ở mục 9.

### Upload file / xem trước file đính kèm lỗi treo hoặc 500

MinIO chưa chạy hoặc bị dừng. Kiểm tra:

```bash
docker ps --filter "name=hrm-minio"
docker start hrm-minio    # nếu đang Exited
```

### Port bị chiếm

```bash
# Windows — tìm process đang dùng port
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

### pgAdmin cứ load mãi không vào được (crash-loop)

Email trong `PGADMIN_DEFAULT_EMAIL` (docker-compose.yml) không hợp lệ — tránh các TLD dành riêng như `.local`, `.test`, `.localhost`. Dùng domain thật (ví dụ `dba@bvnghean.vn`).

### `./mvnw` lỗi `no main manifest attribute, in .mvn/wrapper/maven-wrapper.jar`

`.mvn/wrapper/maven-wrapper.jar` bị gitignore (chỉ commit `maven-wrapper.properties`) nên mỗi máy tự tải — nếu file cục bộ bị tải dở/hỏng, script `mvnw` (Unix) không tự sửa mà chỉ fallback sang `mvn` hệ thống (thường chưa cài).

- **Windows:** dùng `mvnw.cmd` thay vì `mvnw` — nó tự tải nguyên bộ Maven 3.9.6 về `%USERPROFILE%\.m2\wrapper\`, không phụ thuộc file jar này.
- **macOS/Linux:** xoá `backend/.mvn/wrapper/maven-wrapper.jar` rồi chạy lại `./mvnw` (script sẽ tự tải lại) hoặc cài Maven hệ thống (`brew install maven`).

### Reset toàn bộ database

```bash
docker compose down -v   # xóa tất cả volumes
docker compose up postgres redis minio -d
```

---

## Liên hệ

- **Tech Lead / câu hỏi architecture:** xem `docs/adr/ADR-001-architecture-evaluation.md`
- **Kế hoạch triển khai theo phase:** xem `docs/implementation/phased-plan.md`
