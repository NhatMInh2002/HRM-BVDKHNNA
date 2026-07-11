# Developer Guide — HRM HNĐK Nghệ An

Hướng dẫn này giúp developer mới **clone code và chạy được project trên máy local** trong khoảng **15 phút**. Làm theo đúng thứ tự mục 1 → 7 là chạy được; các mục 8 trở đi là tài liệu tham khảo thêm (test account chi tiết, gọi API, chạy bằng Docker, quy trình Git, CI/CD, troubleshooting).

---

## Mục lục

**Bắt đầu nhanh — clone đến khi chạy được:**

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Clone & cấu trúc project](#2-clone--cấu-trúc-project)
3. [Cấu hình biến môi trường](#3-cấu-hình-biến-môi-trường)
4. [Khởi động hạ tầng (Docker: PostgreSQL, Redis, MinIO)](#4-khởi-động-hạ-tầng-docker-postgresql-redis-minio)
5. [Chạy backend (hot-reload)](#5-chạy-backend-hot-reload)
6. [Chạy frontend (hot-reload)](#6-chạy-frontend-hot-reload)
7. [Đăng nhập & kiểm tra nhanh](#7-đăng-nhập--kiểm-tra-nhanh)

**Tham khảo thêm:**

8. [Tài khoản test & phân quyền](#8-tài-khoản-test--phân-quyền)
9. [Gọi API trực tiếp bằng JWT](#9-gọi-api-trực-tiếp-bằng-jwt)
10. [Chạy full stack bằng Docker](#10-chạy-full-stack-bằng-docker)
11. [Quy trình làm việc với Git](#11-quy-trình-làm-việc-với-git)
12. [CI/CD](#12-cicd)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| Java (JDK) | 21 | Eclipse Temurin khuyến nghị |
| Maven | 3.9+ | không bắt buộc — dùng `mvnw`/`mvnw.cmd` trong `backend/` nếu chưa cài |
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

## 3. Cấu hình biến môi trường

### 3.1 Root — file `.env` (copy từ `.env.example`)

```bash
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

**Chạy được ngay, không cần sửa gì** — `.env.example` đã đặt sẵn giá trị dev **khớp** với default backend:

```env
POSTGRES_PASSWORD=hrm_dev_pass
MINIO_ROOT_PASSWORD=hrm_minio_pass
JWT_SECRET=hrm-bvnghean-secret-key-2025-must-be-at-least-32-chars
NEXTAUTH_SECRET=doi-thanh-chuoi-random-cho-nextauth
```

> ⚠️ **Bẫy hay gặp:** `.env` khởi tạo mật khẩu cho **container** Postgres/MinIO, còn backend hot-reload lại dùng mật khẩu **default trong `application.yml`** (vì backend không đọc `.env` — xem 3.3). Hai giá trị `POSTGRES_PASSWORD`/`MINIO_ROOT_PASSWORD` ở trên **phải khớp** default đó, nếu không backend báo `password authentication failed for user "hrm"`.
>
> Nếu bạn **đã lỡ** chạy `docker compose up` với mật khẩu khác trước đó: sửa `.env` thôi **chưa đủ** — mật khẩu chỉ được ghi lần đầu tạo volume. Phải xóa volume rồi tạo lại: `docker compose down -v` (xem mục 4).

`.env` chỉ dùng cho `docker compose` — `docker compose up postgres redis minio -d` (mục 4) đọc các giá trị này để khởi tạo container.

### 3.2 Frontend — tạo file `frontend/.env.local`

```env
BACKEND_URL=http://localhost:8080
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<giống NEXTAUTH_SECRET ở trên>
```

### 3.3 Backend — không cần file riêng, nhưng lưu ý về `.env`

Backend **không** đọc `.env` — Spring Boot chỉ dùng default trong `backend/app/src/main/resources/application.yml`:

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

> ⚠️ **Vì Spring Boot không tự nạp `.env`**, nếu bạn đổi `MINIO_ROOT_PASSWORD` ở mục 3.1 khác giá trị mặc định trong `application.yml` (`hrm_minio_pass`) mà chạy backend qua `mvnw spring-boot:run` (mục 5) **không export lại biến đó**, upload avatar/chữ ký/file đính kèm sẽ lỗi 403/500 vì backend và container MinIO đang dùng mật khẩu khác nhau. Cách export đúng xem ở mục 5.

Auth tự quản lý: `POST /api/auth/login` nhận `email` + `password`, so khớp BCrypt với `employees.password_hash`, trả về JWT ký bằng `JWT_SECRET`. Không có Keycloak/Azure AD nào tham gia ở giai đoạn hiện tại (xem `docs/implementation/phased-plan.md` — SSO/AD FS là việc của Phase 5, chưa triển khai).

---

## 4. Khởi động hạ tầng (Docker: PostgreSQL, Redis, MinIO)

> 📌 **Hai chế độ chạy — đừng nhầm:**
> - **Dev (hot-reload — mục 4→6, khuyến nghị):** chỉ **PostgreSQL, Redis, MinIO** chạy trong Docker. **Frontend & backend chạy trực tiếp trên máy** (`npm run dev`, `mvnw spring-boot:run`) — **KHÔNG** phải container. Vì vậy `docker compose ps` **chỉ hiện 3 container** là **đúng**, không phải thiếu file.
> - **Full Docker (mục 10):** mọi thứ chạy trong container (`docker compose up --build -d`), frontend ở cổng **4000**. Dùng khi test production-like.

Khởi động 3 dịch vụ hạ tầng:

```bash
docker compose up postgres redis minio -d
```

Chờ healthy trước khi qua bước tiếp theo:

```bash
docker compose ps        # đúng: thấy 3 container (postgres/redis/minio), STATUS = "healthy"
```

> Lỡ chạy trước đó bằng mật khẩu khác (backend báo `password authentication failed`)? Reset volume: `docker compose down -v` rồi `docker compose up postgres redis minio -d` lại.

**Services và port:**

| Service | URL / Port | Tài khoản |
|---|---|---|
| PostgreSQL | `localhost:5432` DB: `hrm` | `hrm` / `hrm_dev_pass` |
| Redis | `localhost:6379` | — |
| MinIO Console | http://localhost:9001 | `hrm_minio` / `hrm_minio_pass` |
| pgAdmin (tùy chọn, `docker compose up pgadmin -d`) | http://localhost:5050 | xem `.env` → `PGADMIN_DEFAULT_EMAIL` |
| Nginx (tùy chọn, xem mục 10) | https://localhost | TLS tự ký, dùng cho test production-like |

> OpenSearch hiện **tắt** trong `docker-compose.yml` (tốn ~512MB RAM) — tìm kiếm nhân viên dùng `LIKE` query trong PostgreSQL.

---

## 5. Chạy backend (hot-reload)

> 💡 **Không cần cài Maven** — dùng wrapper `mvnw` (macOS/Linux) hoặc `mvnw.cmd` (Windows) trong `backend/`, nó tự tải Maven 3.9.6 về. Nếu máy đã cài sẵn Maven hệ thống thì thay `./mvnw` / `.\mvnw.cmd` bằng `mvn`.

### 5.1 Lần đầu — build & cài các module vào local repo (`.m2`)

Đây là dự án **multi-module**: module `app` phụ thuộc `shared-kernel`, `module-personnel`, `module-attendance`, `module-payroll`. Phải build & cài chúng vào `.m2` **một lần** trước, nếu không sẽ lỗi:
`Could not resolve dependencies for project vn.hrm:app ... shared-kernel ... (absent)`.

```bash
cd backend
./mvnw clean install -DskipTests          # Windows PowerShell: .\mvnw.cmd clean install -DskipTests
```

> Về sau chỉ cần cài lại (`install`) khi bạn **sửa code** trong `shared-kernel` / `module-*`. Sửa riêng trong `app` thì không cần.

### 5.2 Chạy backend

```bash
# macOS/Linux
./mvnw spring-boot:run -pl app
# Windows PowerShell (chú ý .\ ở đầu)
.\mvnw.cmd spring-boot:run -pl app
```

> Muốn gộp một lệnh (tự build cả module phụ thuộc mỗi lần chạy) thì thêm `-am`:
> `./mvnw -pl app -am spring-boot:run` (Windows: `.\mvnw.cmd -pl app -am spring-boot:run`).

Flyway tự chạy migration khi backend khởi động — không cần thao tác DB thủ công. Chạy đúng khi thấy dòng `Started ... in X seconds`.

Backend chạy tại http://localhost:8080, context path `/api`. Health check: http://localhost:8080/api/actuator/health

> ⚠️ **Nếu `.env` đổi `MINIO_ROOT_PASSWORD` khác default `hrm_minio_pass`:** backend hot-reload không đọc `.env` nên phải export cùng giá trị trước khi chạy, nếu không upload file lỗi 403/500:
> `export MINIO_ROOT_PASSWORD=...` (Windows: `$env:MINIO_ROOT_PASSWORD = "..."`). Giữ giá trị mặc định trong `.env.example` thì bỏ qua bước này.

---

## 6. Chạy frontend (hot-reload)

Mở terminal mới (giữ backend ở mục 5 đang chạy):

```bash
cd frontend
npm install        # lần đầu hoặc sau khi pull code mới
npm run dev
```

Mở trình duyệt: http://localhost:3000

---

## 7. Đăng nhập & kiểm tra nhanh

Truy cập http://localhost:3000 sẽ tự động redirect sang `/login`. Đăng nhập bằng tài khoản admin mặc định (form thường, không có SSO):

- **Email:** `admin@bvnghean.vn`
- **Mật khẩu:** `Admin@2025`

Sau khi đăng nhập, mở F12 → Application → Cookies → `next-auth.session-token` phải có giá trị.

**Checklist xác nhận chạy đúng:**

- [ ] http://localhost:8080/api/actuator/health → `{"status":"UP"}`
- [ ] http://localhost:3000 → redirect về `/login`
- [ ] Đăng nhập bằng `admin@bvnghean.vn` → vào `/dashboard` thành công
- [ ] SideNav hiện đúng menu theo role (ADMIN thấy đủ tất cả mục)
- [ ] Vào `/dashboard/personnel`, danh sách nhân viên load được (xác nhận kết nối Postgres OK)
- [ ] Thử upload avatar ở `/dashboard/profile` (xác nhận kết nối MinIO OK — xem cảnh báo mục 3.3 nếu lỗi)

Qua được hết checklist trên nghĩa là môi trường local đã chạy đầy đủ. Các mục dưới đây là tài liệu tham khảo thêm khi cần.

---

## 8. Tài khoản test & phân quyền

Tài khoản được seed sẵn qua Flyway migration (`V14__add_password_hash.sql` và các seed khác) — không cần tạo tay.

### 8.1 Tài khoản mặc định

| Email | Mật khẩu | Role | Quyền hạn |
|---|---|---|---|
| `admin@bvnghean.vn` | `Admin@2025` | `ADMIN` | Toàn quyền: xem/thêm/sửa/xóa tất cả module |

Các tài khoản khác (HR_MANAGER, DEPT_HEAD, ACCOUNTANT...) được gán quyền qua giao diện **Phân quyền** (`/dashboard/settings`, chỉ ADMIN truy cập) — chọn nhân viên, tick các permission tương ứng (`SYSTEM_ADMIN`, `LEAVE_APPROVE_HR`, `LEAVE_APPROVE_DEPT`, `PAYROLL_MANAGE`...), hệ thống tự suy ra `hrmRole` từ tập quyền (xem `PermissionController.deriveRole()`).

### 8.2 Roles và quyền hạn chi tiết

| Role | Xem DS nhân viên | Thêm/Sửa NV | Cho thôi việc | Xem lương | Duyệt nghỉ phép |
|---|:---:|:---:|:---:|:---:|:---:|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `HR_MANAGER` | ✅ | ✅ | ❌ | ✅ | ✅ (cấp 2) |
| `DEPT_HEAD` / `DEPARTMENT_MANAGER` | ✅ (phòng ban) | ❌ | ❌ | ❌ | ✅ (cấp 1, phòng mình) |
| `ACCOUNTANT` | ❌ | ❌ | ❌ | ✅ | ❌ |
| `EMPLOYEE` | ❌ | ❌ | ❌ | ❌ (chỉ xem lương mình) | ❌ |

> `DEPT_HEAD` và `DEPARTMENT_MANAGER` là hai tên gọi tương đương cho cùng vai trò trưởng phòng — cả hai đều được công nhận ở cả frontend (`useRoles.ts`, `side-nav.tsx`) lẫn backend (`@PreAuthorize`).

---

## 9. Gọi API trực tiếp bằng JWT

Lấy token bằng curl (hoặc dùng cookie session từ bước đăng nhập UI ở mục 7):

```bash
TOKEN=$(curl -sf -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bvnghean.vn","password":"Admin@2025"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN   # paste vào Postman hoặc dùng trực tiếp trong curl
```

Ví dụ gọi API:

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

Khi muốn **cả frontend + backend cũng chạy trong Docker** (test production-like, không cần cài Java/Maven/Node ở host):

```bash
# Build image (tự build jar + next standalone TRONG Docker) và chạy tất cả
docker compose up --build -d

# Xem log
docker compose logs -f backend
docker compose logs -f frontend

# Kiểm tra: đủ 5 container (postgres, redis, minio, backend, frontend)
docker compose ps

# Dừng tất cả
docker compose down

# Dừng và xóa volume (reset database)
docker compose down -v
```

> ⏳ **Lần `--build` đầu tiên chậm (~3–5 phút):** backend build bằng `backend/Dockerfile` (multi-stage) — tự tải dependency Maven và compile jar bên trong image, nên **không cần** cài Maven hay build jar trước ở host. Các lần sau dùng cache nên nhanh.
>
> ✅ Xong sẽ thấy **5 container** ở `docker compose ps`; mở **http://localhost:4000** (frontend). Đây chính là câu trả lời cho "không thấy frontend/backend trong Docker" — ở chế độ dev (mục 4) chúng chạy ngoài Docker, còn muốn thấy chúng là container thì dùng lệnh này.

**Cổng khi chạy qua Docker (khác với hot-reload ở mục 5–6):**

| Service | Cổng host | Ghi chú |
|---|---|---|
| Backend | `8080` | giống hot-reload |
| Frontend | **`4000`** → http://localhost:4000 | container map `4000:3000` — **không phải 3000** như mục 6 |
| Nginx (nếu bật) | `80` / `443` → https://localhost | reverse proxy trỏ vào frontend/backend ở trên |

Đẩy code mới lên container đang chạy mà không rebuild image (nhanh hơn nhiều, xem thêm trong memory `feedback-deploy-workflow`):

```bash
# Backend  (Windows: .\mvnw.cmd package -q -DskipTests)
cd backend && ./mvnw package -q -DskipTests
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

### `mvn : The term 'mvn' is not recognized` (Windows) / `mvn: command not found`

Máy chưa cài Maven hệ thống. **Không cần cài** — dùng wrapper trong `backend/`:
`.\mvnw.cmd spring-boot:run -pl app` (Windows, chú ý `.\` ở đầu) hoặc `./mvnw spring-boot:run -pl app` (macOS/Linux). Xem mục 5.

### Backend lỗi `Could not resolve dependencies ... shared-kernel / module-* ... (absent)`

Bạn chạy `spring-boot:run -pl app` khi các module phụ thuộc **chưa được cài vào `.m2`**. Cài chúng trước (chỉ 1 lần):
`cd backend && .\mvnw.cmd clean install -DskipTests` (Windows) hoặc `./mvnw clean install -DskipTests`. Xem mục 5.1. Cách khác: chạy kèm `-am`, ví dụ `.\mvnw.cmd -pl app -am spring-boot:run`.

### `docker compose ps` không thấy container `frontend`/`backend`

**Đúng như thiết kế** ở chế độ dev (mục 4): frontend & backend chạy hot-reload trực tiếp trên máy, chỉ Postgres/Redis/MinIO ở trong Docker. Muốn chạy cả hai trong Docker thì dùng full-Docker (mục 10): `docker compose up --build -d` (frontend ở cổng 4000).

### Backend lỗi `password authentication failed for user "hrm"`

Mật khẩu Postgres trong volume (đặt lần đầu từ `.env`) lệch với mật khẩu backend dùng (`hrm_dev_pass` default). Đặt `POSTGRES_PASSWORD=hrm_dev_pass` trong `.env` **và** reset volume: `docker compose down -v && docker compose up postgres redis minio -d`. Xem mục 3.1.

### Backend lỗi `401 Unauthorized`

Token hết hạn. Lấy token mới theo hướng dẫn ở mục 9.

### Upload file / xem trước file đính kèm lỗi treo hoặc 500

MinIO chưa chạy hoặc bị dừng, hoặc mật khẩu MinIO của backend lệch với container (xem cảnh báo mục 3.3). Kiểm tra:

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
