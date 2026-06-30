# Kế hoạch Phân quyền (RBAC) — HRM BVHN Đa khoa Nghệ An

> Tài liệu này định nghĩa các vai trò, quyền hạn và lộ trình triển khai RBAC.  
> Cập nhật: 2026-06-24 | Áp dụng từ: Phase 2

---

## 1. Vai trò (Roles)

### Định nghĩa role trong hệ thống (JWT tự quản lý)

| Role | Mã | Mô tả | Đối tượng |
|---|---|---|---|
| **Quản trị hệ thống** | `ADMIN` | Toàn quyền mọi chức năng | IT / Ban Giám đốc |
| **Quản lý nhân sự** | `HR_MANAGER` | Quản lý nhân viên, lương, chấm công toàn viện | Phòng Tổ chức cán bộ |
| **Trưởng khoa/phòng** | `DEPARTMENT_MANAGER` | Xem và quản lý nhân viên trong khoa/phòng mình | Trưởng khoa, Trưởng phòng |
| **Nhân viên** | `EMPLOYEE` | Xem thông tin cá nhân, xin nghỉ phép, xem lương bản thân | Toàn bộ cán bộ |
| **Kế toán** | `ACCOUNTANT` | Xem và xuất bảng lương, không sửa | Phòng Tài chính kế toán |

---

## 2. Ma trận phân quyền

### 2.1 Module Nhân sự

| Chức năng | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE | ACCOUNTANT |
|---|:---:|:---:|:---:|:---:|:---:|
| Xem danh sách toàn viện | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem danh sách trong khoa mình | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xem hồ sơ cá nhân | ✅ | ✅ | ✅* | ✅** | ❌ |
| Thêm nhân viên mới | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sửa thông tin nhân viên | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cho thôi việc (soft delete) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem phòng ban | ✅ | ✅ | ✅ | ✅ | ❌ |
| Quản lý danh mục | ✅ | ✅ | ❌ | ❌ | ❌ |

> \* DEPT_MANAGER chỉ xem nhân viên trong khoa/phòng của mình  
> \*\* EMPLOYEE chỉ xem hồ sơ của bản thân

### 2.2 Module Chấm công

| Chức năng | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE | ACCOUNTANT |
|---|:---:|:---:|:---:|:---:|:---:|
| Xem bảng chấm công toàn viện | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem bảng chấm công trong khoa | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chấm công cho nhân viên | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tự chấm công (check-in/out) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Duyệt đơn nghỉ phép | ✅ | ✅ | ✅* | ❌ | ❌ |
| Gửi đơn nghỉ phép | ✅ | ✅ | ✅ | ✅ | ✅ |
| Xem đơn của bản thân | ✅ | ✅ | ✅ | ✅ | ✅ |

> \* DEPT_MANAGER chỉ duyệt đơn nghỉ của nhân viên trong khoa mình

### 2.3 Module Bảng lương

| Chức năng | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE | ACCOUNTANT |
|---|:---:|:---:|:---:|:---:|:---:|
| Xem bảng lương toàn viện | ✅ | ✅ | ❌ | ❌ | ✅ |
| Xem lương cá nhân | ✅ | ✅ | ✅* | ✅** | ✅* |
| Tạo bảng lương tháng | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cấu hình lương (hệ số, phụ cấp) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xuất Excel bảng lương | ✅ | ✅ | ❌ | ❌ | ✅ |
| Xuất phiếu lương PDF cá nhân | ✅ | ✅ | ✅* | ✅** | ❌ |

> \* Chỉ trong phạm vi khoa/phòng mình  
> \*\* Chỉ của bản thân

### 2.4 Module Tuyển dụng

| Chức năng | ADMIN | HR_MANAGER | DEPT_MANAGER | EMPLOYEE | ACCOUNTANT |
|---|:---:|:---:|:---:|:---:|:---:|
| Tạo/sửa vị trí tuyển dụng | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem danh sách ứng viên | ✅ | ✅ | ✅* | ❌ | ❌ |
| Đánh giá ứng viên | ✅ | ✅ | ✅* | ❌ | ❌ |

> \* Chỉ cho vị trí trong khoa/phòng mình

---

## 3. Navigation theo Role

```
ADMIN / HR_MANAGER:
  ├── Tổng quan
  ├── Cán bộ nhân viên
  ├── Phòng ban / Khoa
  ├── Danh mục
  ├── Chấm công
  ├── Nghỉ phép
  ├── Bảng lương
  ├── Cấu hình lương
  └── Tuyển dụng

DEPARTMENT_MANAGER:
  ├── Tổng quan
  ├── Cán bộ nhân viên (chỉ khoa mình)
  ├── Phòng ban / Khoa (xem)
  ├── Chấm công (khoa mình)
  ├── Nghỉ phép (duyệt khoa mình)
  └── Bảng lương (xem khoa mình)

EMPLOYEE:
  ├── Tổng quan
  ├── Chấm công (của bản thân)
  ├── Nghỉ phép (gửi đơn, xem đơn mình)
  └── Lương cá nhân

ACCOUNTANT:
  ├── Tổng quan
  ├── Bảng lương (xem + xuất Excel)
  └── Chấm công (xem)
```

---

## 4. Triển khai kỹ thuật

### 4.1 Backend — Spring Security

```java
// SecurityConfig.java — thêm method security
@EnableMethodSecurity

// Controller — ví dụ
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
@PostMapping("/employees")
public ResponseEntity<EmployeeResponse> create(...) { }

@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER')")
@GetMapping("/employees")
public ResponseEntity<Page<EmployeeResponse>> list(...) { }

// Department scoping — kiểm tra trong Service
public Page<Employee> searchEmployees(EmployeeSearchRequest req, Authentication auth) {
    if (hasRole(auth, "DEPARTMENT_MANAGER")) {
        // Chỉ trả nhân viên cùng departmentId với manager
        req.setDepartmentId(getManagerDepartmentId(auth));
    }
    return employeeRepository.search(req);
}
```

### 4.2 Frontend — Next.js

```tsx
// hooks/useRoles.ts
export function useRoles() {
  const { data: session } = useSession()
  const roles = session?.roles ?? []
  return {
    isAdmin: roles.includes('ADMIN'),
    isHR: roles.includes('HR_MANAGER') || roles.includes('ADMIN'),
    isDeptManager: roles.includes('DEPARTMENT_MANAGER'),
    isEmployee: roles.includes('EMPLOYEE'),
    isAccountant: roles.includes('ACCOUNTANT'),
    canWrite: roles.some(r => ['ADMIN', 'HR_MANAGER'].includes(r)),
    canManagePayroll: roles.some(r => ['ADMIN', 'HR_MANAGER', 'ACCOUNTANT'].includes(r)),
  }
}

// Side-nav — lọc menu theo role
const canAccess = (required: string[]) =>
  required.length === 0 || required.some(r => roles.includes(r))
```

### 4.3 Tài khoản test cần tạo

| Tài khoản | Role | Mục đích |
|---|---|---|
| `admin.hrm` | `ADMIN` | Quản trị hệ thống |
| `hr.manager` | `HR_MANAGER` | Phòng Tổ chức cán bộ |
| `dept.manager.{code}` | `DEPARTMENT_MANAGER` | Trưởng các khoa/phòng |
| `accountant.hrm` | `ACCOUNTANT` | Phòng Tài chính |
| `{ma_can_bo}` | `EMPLOYEE` | Toàn bộ cán bộ |

---

## 5. Lộ trình triển khai

| Phase | Nội dung | Deadline |
|---|---|---|
| **Phase 1** (hiện tại) | `canWrite = !!session` — mọi user đã đăng nhập | Đã xong |
| **Phase 2** | Backend `@PreAuthorize` + Frontend role check + Side-nav lọc menu | Sprint tiếp theo |
| **Phase 3** | Department scoping (DEPT_MANAGER chỉ thấy khoa mình) | Sau Phase 2 |
| **Phase 4** | Employee self-service portal | Khi có SSO toàn viện |

### Checklist Phase 2

- [ ] Thêm `@PreAuthorize` vào tất cả controller endpoints
- [ ] Tạo `useRoles()` hook frontend
- [ ] Cập nhật `side-nav.tsx` lọc menu theo role thực
- [ ] Thay `canWrite = !!session` → `canWrite = isAdmin || isHR`
- [ ] Tạo tài khoản test cho từng role (qua Phân quyền/employee_permissions)
- [ ] Test matrix: mỗi role → thử truy cập tất cả endpoints
