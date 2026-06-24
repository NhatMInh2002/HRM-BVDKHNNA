#!/bin/bash
# Script tạo roles + tài khoản test trong Keycloak
# Chạy sau khi Keycloak đã khởi động: bash scripts/keycloak_setup_roles.sh
#
# Yêu cầu: curl, jq
# Keycloak admin: admin / admin  (mặc định docker-compose)

KEYCLOAK_URL="http://localhost:8180"
REALM="hrm"
ADMIN_USER="admin"
ADMIN_PASS="admin"

echo "=== Lấy access token admin ==="
TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_USER&password=$ADMIN_PASS&grant_type=password&client_id=admin-cli" \
  | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "FAIL: Không lấy được token. Kiểm tra Keycloak đang chạy tại $KEYCLOAK_URL"
  exit 1
fi
echo "OK: Token lấy thành công"

auth() { echo "-H \"Authorization: Bearer $TOKEN\""; }

# ============================================================
# 1. Tạo roles (bỏ qua nếu đã tồn tại)
# ============================================================
echo ""
echo "=== Tạo realm roles ==="

for ROLE in ADMIN HR_MANAGER DEPARTMENT_MANAGER EMPLOYEE ACCOUNTANT; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "$KEYCLOAK_URL/admin/realms/$REALM/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$ROLE\"}")
  if [ "$HTTP" = "201" ]; then
    echo "  ✓ Tạo role $ROLE"
  elif [ "$HTTP" = "409" ]; then
    echo "  - Role $ROLE đã tồn tại"
  else
    echo "  ! Lỗi tạo role $ROLE: HTTP $HTTP"
  fi
done

# Helper: lấy role ID
get_role_id() {
  curl -s "$KEYCLOAK_URL/admin/realms/$REALM/roles/$1" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.id'
}

# ============================================================
# 2. Tạo tài khoản test
# ============================================================
echo ""
echo "=== Tạo tài khoản test ==="

create_user() {
  local USERNAME=$1
  local PASSWORD=$2
  local FIRST=$3
  local LAST=$4
  local EMAIL=$5

  # Tạo user
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    "$KEYCLOAK_URL/admin/realms/$REALM/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"$USERNAME\",
      \"email\": \"$EMAIL\",
      \"firstName\": \"$FIRST\",
      \"lastName\": \"$LAST\",
      \"enabled\": true,
      \"emailVerified\": true,
      \"credentials\": [{\"type\": \"password\", \"value\": \"$PASSWORD\", \"temporary\": false}]
    }")

  if [ "$HTTP" = "201" ]; then
    echo "  ✓ Tạo user $USERNAME ($EMAIL)"
  elif [ "$HTTP" = "409" ]; then
    echo "  - User $USERNAME đã tồn tại"
  else
    echo "  ! Lỗi tạo user $USERNAME: HTTP $HTTP"
  fi

  # Lấy user ID
  echo $(curl -s "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$USERNAME&exact=true" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
}

assign_role() {
  local USER_ID=$1
  local ROLE_NAME=$2
  local ROLE_ID=$(get_role_id $ROLE_NAME)
  curl -s -o /dev/null -X POST \
    "$KEYCLOAK_URL/admin/realms/$REALM/users/$USER_ID/role-mappings/realm" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "[{\"id\": \"$ROLE_ID\", \"name\": \"$ROLE_NAME\"}]"
  echo "  → Gán role $ROLE_NAME cho user"
}

# admin.hrm — ADMIN
UID=$(create_user "admin.hrm" "Admin@123" "Admin" "HRM" "admin.hrm@bvnghean.vn")
assign_role "$UID" "ADMIN"

# hr.manager — HR_MANAGER
UID=$(create_user "hr.manager" "Hr@123456" "Trưởng" "Tổ chức" "hr.manager@bvnghean.vn")
assign_role "$UID" "HR_MANAGER"

# dept.mgr.01 — DEPARTMENT_MANAGER (Trưởng khoa Nội)
UID=$(create_user "dept.mgr.01" "Dept@123456" "Nguyễn Văn" "A" "dept.mgr.01@bvnghean.vn")
assign_role "$UID" "DEPARTMENT_MANAGER"
assign_role "$UID" "EMPLOYEE"

# accountant — ACCOUNTANT
UID=$(create_user "accountant" "Acc@123456" "Kế" "Toán" "accountant@bvnghean.vn")
assign_role "$UID" "ACCOUNTANT"
assign_role "$UID" "EMPLOYEE"

# employee.test — EMPLOYEE
UID=$(create_user "employee.test" "Emp@123456" "Nhân" "Viên" "employee.test@bvnghean.vn")
assign_role "$UID" "EMPLOYEE"

# ============================================================
# 3. Tóm tắt
# ============================================================
echo ""
echo "=== HOÀN TẤT ==="
echo ""
echo "Tài khoản test:"
echo "  admin.hrm      / Admin@123    → ADMIN"
echo "  hr.manager     / Hr@123456    → HR_MANAGER"
echo "  dept.mgr.01    / Dept@123456  → DEPARTMENT_MANAGER + EMPLOYEE"
echo "  accountant     / Acc@123456   → ACCOUNTANT + EMPLOYEE"
echo "  employee.test  / Emp@123456   → EMPLOYEE"
echo ""
echo "Kiểm tra: $KEYCLOAK_URL/admin  (admin/admin)"
