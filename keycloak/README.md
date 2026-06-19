# Keycloak — HRM Realm Setup

Realm `hrm` được **tự động import** khi chạy `docker compose up`.

## Accounts mặc định (dev only)

| Username | Password | Roles |
|---|---|---|
| `admin.hrm` | `Admin@123` | ADMIN, HR_MANAGER, EMPLOYEE |
| `hr.manager` | `Hr@123456` | HR_MANAGER, EMPLOYEE |

> **Lưu ý:** Password đánh dấu `temporary=true` → bắt buộc đổi lần đầu đăng nhập.

## Truy cập Keycloak Admin Console

http://localhost:8180 → admin / admin_dev_pass

## Clients

| Client ID | Loại | Dùng cho |
|---|---|---|
| `hrm-frontend` | Public (PKCE) | Next.js — Authorization Code Flow |
| `hrm-backend` | Bearer-only | Spring Boot — validate JWT |

## Roles

| Role | Mô tả |
|---|---|
| `ADMIN` | Toàn quyền hệ thống |
| `HR_MANAGER` | Quản lý hồ sơ, chấm công, lương |
| `DEPARTMENT_MANAGER` | Duyệt nghỉ phép phòng ban |
| `EMPLOYEE` | Xem thông tin cá nhân |

## Đổi sang production

1. Thay `start-dev` → `start` trong docker-compose.yml
2. Cấu hình SSL: `KC_HTTPS_CERTIFICATE_FILE` + `KC_HTTPS_CERTIFICATE_KEY_FILE`
3. Đổi `sslRequired: "external"` → `"all"` trong realm json
4. Xóa users mặc định, tạo user qua AD/LDAP federation
