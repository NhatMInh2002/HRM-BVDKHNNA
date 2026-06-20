# Developer Guide — HRM BVĐK Hà Nội NA

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
│   ├── app/              ← entry point (chứa SecurityConfig, application.yml)
│   ├── module-personnel/ ← nhân sự
│   ├── module-attendance/← chấm công
│   ├── module-payroll/   ← lương
│   └── shared-kernel/    ← entity cha, exception, audit
├── frontend/             ← Next.js 15 (App Router)
│   └── src/
│       ├── app/          ← pages & layouts
│       ├── components/   ← UI components
│       └── lib/          ← auth.ts, api.ts
├── keycloak/             ← realm config auto-import
│   ├── hrm-realm.json    ← roles, clients, users mặc định
│   └── init-keycloak-schema.sql
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
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: ${KEYCLOAK_JWK_SET_URI:http://localhost:8180/realms/hrm/protocol/openid-connect/certs}
```

> Nếu Keycloak chạy trên Docker, backend local kết nối qua `localhost:8180` — không cần đổi gì.

### Frontend — tạo file `frontend/.env.local`

```env
KEYCLOAK_CLIENT_ID=hrm-frontend
KEYCLOAK_CLIENT_SECRET=<lấy từ Keycloak Admin hoặc hỏi team lead>
KEYCLOAK_ISSUER=http://localhost:8180/realms/hrm
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<chuỗi random bất kỳ, ví dụ: openssl rand -base64 32>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

> `KEYCLOAK_CLIENT_SECRET` lấy từ: Keycloak Admin (`localhost:8180`) → Realm `hrm` → Clients → `hrm-frontend` → Credentials tab.

---

## 4. Khởi động môi trường dev

**Bước đầu tiên luôn phải chạy infrastructure (PostgreSQL, Redis, Keycloak, MinIO, OpenSearch):**

```bash
# Chạy toàn bộ infrastructure (trừ backend/frontend)
docker compose up postgres redis keycloak minio opensearch -d
```

Chờ Keycloak healthy (~60 giây lần đầu):

```bash
docker compose ps        # cột STATUS phải là "healthy"
docker logs hrm-keycloak --tail 20
```

Khi thấy `Keycloak 24.0.4 on /` trong log là xong.

**Services và port:**

| Service | URL / Port | Tài khoản |
|---|---|---|
| PostgreSQL | `localhost:5432` DB: `hrm` | `hrm` / `hrm_dev_pass` |
| Redis | `localhost:6379` | — |
| Keycloak Admin | http://localhost:8180 | `admin` / `admin_dev_pass` |
| MinIO Console | http://localhost:9001 | `hrm_minio` / `hrm_minio_dev` |
| OpenSearch | http://localhost:9200 | — (security disabled) |

---

## 5. Tài khoản test

> Tất cả tài khoản dưới đây được import **tự động** khi Keycloak khởi động từ `keycloak/hrm-realm.json`.  
> Không cần tạo tay. Nếu mất → xem mục [Reset toàn bộ database](#reset-toàn-bộ-database).

---

### 5.1 Tài khoản ứng dụng HRM (đăng nhập SSO)

| Username | Mật khẩu ban đầu | Role | Quyền hạn |
|---|---|---|---|
| `admin.hrm` | `Admin@123` | `ADMIN` | Toàn quyền: xem/thêm/sửa/xóa tất cả module |
| `hr.manager` | `Hr@123456` | `HR_MANAGER` | Quản lý nhân sự, lương, chấm công — không terminate nhân viên |

> **Lần đầu đăng nhập** Keycloak sẽ yêu cầu đổi mật khẩu. Đặt mật khẩu mới bất kỳ, độ dài ≥ 8 ký tự.

**Thêm tài khoản test mới (nếu cần):**

```bash
# Lấy admin token Keycloak
ADMIN_TOKEN=$(curl -sf -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli&grant_type=password&username=admin&password=admin_dev_pass" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Tạo user mới
curl -X POST http://localhost:8180/admin/realms/hrm/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dept.manager",
    "enabled": true,
    "credentials": [{"type":"password","value":"Dev@123456","temporary":true}],
    "realmRoles": ["DEPARTMENT_MANAGER"]
  }'
```

---

### 5.2 Tài khoản hạ tầng (services nội bộ)

| Service | URL | Username | Password | Ghi chú |
|---|---|---|---|---|
| Keycloak Admin | http://localhost:8180 | `admin` | `admin_dev_pass` | Quản lý realm, client, user |
| PostgreSQL | `localhost:5432` | `hrm` | `hrm_dev_pass` | DB: `hrm` |
| MinIO Console | http://localhost:9001 | `hrm_minio` | `hrm_minio_dev` | Object storage |
| OpenSearch | http://localhost:9200 | — | — | Security tắt trong dev |
| Redis | `localhost:6379` | — | — | Không có auth trong dev |

---

### 5.3 Roles và quyền hạn chi tiết

| Role | Xem DS nhân viên | Thêm/Sửa NV | Cho thôi việc | Xem lương | Duyệt nghỉ phép |
|---|:---:|:---:|:---:|:---:|:---:|
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `HR_MANAGER` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `DEPARTMENT_MANAGER` | ✅ (phòng ban) | ❌ | ❌ | ❌ | ✅ (phòng mình) |
| `EMPLOYEE` | ❌ | ❌ | ❌ | ❌ (chỉ xem lương mình) | ❌ |

---

### 5.4 Lấy JWT token để test API (curl / Postman)

```bash
# Đăng nhập với admin.hrm (sau khi đã đổi mật khẩu lần đầu)
TOKEN=$(curl -sf -X POST \
  http://localhost:8180/realms/hrm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=hrm-frontend" \
  -d "client_secret=<KEYCLOAK_CLIENT_SECRET>" \
  -d "username=admin.hrm" \
  -d "password=<mật_khẩu_mới>" \
  -d "grant_type=password" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN   # paste vào Postman hoặc dùng trực tiếp trong curl
```

> `KEYCLOAK_CLIENT_SECRET` lấy từ file `frontend/.env.local` hoặc Keycloak Admin → Realm `hrm` → Clients → `hrm-frontend` → Credentials tab.

Dùng token để gọi API:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/personnel/employees
```

---

## 6. Chạy backend local (hot-reload)

> **Yêu cầu:** Java 21 phải được cài. Maven thì **không cần cài riêng** — dùng Maven Wrapper có sẵn trong repo.

### Cách A — Maven Wrapper (khuyến nghị, không cần cài Maven)

```powershell
cd D:\Workspace\HRM\backend
.\mvnw -pl app spring-boot:run
```

### Cách B — Dùng `mvn` toàn cục (nếu đã cài Maven 3.9+)

```powershell
cd D:\Workspace\HRM\backend
mvn -pl app spring-boot:run
```

> Nếu thấy `'mvn' is not recognized` → dùng Cách A, hoặc cài Maven:
> 1. Tải [apache-maven-3.9.x-bin.zip](https://maven.apache.org/download.cgi), giải nén vào `C:\tools\maven`
> 2. Thêm vào PATH (chạy PowerShell với quyền Admin):
>    ```powershell
>    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\tools\maven\bin", "Machine")
>    ```
> 3. Mở terminal mới, kiểm tra: `mvn -version`

### Cách C — Docker (không cần Java/Maven trên máy)

Nếu không muốn cài bất cứ thứ gì, chạy backend bên trong Docker:

```powershell
cd D:\Workspace\HRM
docker compose up --build backend -d
docker compose logs -f backend
```

---

Chờ log `Started HrmApplication` → backend đang chạy tại `http://localhost:8080`.

Kiểm tra health:

```powershell
curl http://localhost:8080/actuator/health
# → {"status":"UP"}
```

---

## 7. Chạy frontend local (hot-reload)

```bash
cd frontend
npm install        # lần đầu hoặc sau khi pull code mới
npm run dev
```

Mở trình duyệt: http://localhost:3000

- Tự động redirect sang `/login`
- Click **"Đăng nhập với SSO"** → Keycloak login page
- Đăng nhập bằng tài khoản test ở bước 5

---

## 8. Kiểm tra nhanh hệ thống

Sau khi đăng nhập, mở F12 → Application → Cookies → `next-auth.session-token` phải có giá trị.

Checklist:

- [ ] http://localhost:8180 → Keycloak Admin mở được
- [ ] http://localhost:8080/actuator/health → `{"status":"UP"}`
- [ ] http://localhost:3000 → redirect về `/login`
- [ ] Đăng nhập SSO → vào `/dashboard` thành công
- [ ] SideNav hiện đúng menu theo role

---

## 9. Gọi API với JWT

> Xem [mục 5.4](#54-lấy-jwt-token-để-test-api-curl--postman) để lấy token trước.

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
    "email": "nva@bvhn.vn",
    "phone": "0901234567",
    "position": "Điều dưỡng",
    "contractType": "INDEFINITE",
    "startDate": "2024-01-01"
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

Mỗi PR chạy 3 workflow tự động:

| Workflow | File | Kiểm tra |
|---|---|---|
| Backend CI | `.github/workflows/ci-backend.yml` | Build Maven, unit test, JaCoCo coverage |
| Frontend CI | `.github/workflows/ci-frontend.yml` | TypeScript check, lint, Vitest |
| Security Scan | `.github/workflows/security-scan.yml` | OWASP dependency check, npm audit |

> **Lưu ý:** Security scan cần secret `NVD_API_KEY` trong repo Settings → Secrets. Không có key vẫn chạy được nhưng chậm hơn.

---

## 13. Troubleshooting

### Keycloak không khởi động được

```bash
docker logs hrm-keycloak --tail 50
```

Thường gặp: `schema "keycloak" does not exist` → postgres chưa chạy xong.

```bash
# Reset và chạy lại đúng thứ tự
docker compose down -v
docker compose up postgres -d
# Chờ postgres healthy rồi mới chạy keycloak
docker compose up keycloak -d
```

### Backend lỗi `401 Unauthorized`

Token hết hạn (mặc định 5 phút). Lấy token mới theo hướng dẫn ở mục 9.

### Backend lỗi `Could not resolve token issuer`

Backend đang kết nối sai URL Keycloak. Kiểm tra `application.yml`:

```yaml
# Đúng (dùng jwk-set-uri, KHÔNG dùng issuer-uri khi backend chạy local)
spring.security.oauth2.resourceserver.jwt.jwk-set-uri: http://localhost:8180/realms/hrm/protocol/openid-connect/certs
```

### Frontend lỗi `KEYCLOAK_CLIENT_SECRET` missing

File `.env.local` chưa có hoặc sai secret. Xem lại mục 3.

### Port bị chiếm

```bash
# Windows — tìm process đang dùng port
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```

### Reset toàn bộ database

```bash
docker compose down -v   # xóa tất cả volumes
docker compose up postgres redis keycloak minio opensearch -d
```

---

## Liên hệ

- **Tech Lead / câu hỏi architecture:** xem `docs/adr/ADR-001-architecture-evaluation.md`
- **Kế hoạch triển khai theo phase:** xem `docs/implementation/phased-plan.md`
- **Báo lỗi / tính năng mới:** tạo Issue trên GitHub
