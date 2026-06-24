#!/bin/bash
# Script test RBAC — verify từng role chỉ access được endpoint đúng
# Chạy sau khi backend + Keycloak đang chạy
# bash scripts/test_rbac.sh

KEYCLOAK_URL="http://localhost:8180"
API_URL="http://localhost:8080/api"
REALM="hrm"
CLIENT_ID="hrm-frontend"
CLIENT_SECRET="${KEYCLOAK_CLIENT_SECRET:-change_me}"  # set trong .env hoặc truyền vào

PASS=0
FAIL=0

get_token() {
  local USER=$1 PASS=$2
  curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$USER&password=$PASS&grant_type=password&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET" \
    | jq -r '.access_token'
}

check() {
  local DESC=$1 TOKEN=$2 METHOD=$3 URL=$4 EXPECT=$5
  local HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X $METHOD "$API_URL$URL" \
    -H "Authorization: Bearer $TOKEN")
  if [ "$HTTP" = "$EXPECT" ]; then
    echo "  ✓ $DESC ($HTTP)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $DESC (expected $EXPECT, got $HTTP)"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Lấy tokens ==="
T_ADMIN=$(get_token "admin.hrm" "Admin@123")
T_HR=$(get_token "hr.manager" "Hr@123456")
T_DEPT=$(get_token "dept.mgr.01" "Dept@123456")
T_ACC=$(get_token "accountant" "Acc@123456")
T_EMP=$(get_token "employee.test" "Emp@123456")

for LABEL in ADMIN HR DEPT ACC EMP; do
  VAR="T_$LABEL"
  VAL=${!VAR}
  if [ "$VAL" = "null" ] || [ -z "$VAL" ]; then
    echo "  ! Không lấy được token $LABEL — kiểm tra mật khẩu hoặc client_secret"
  else
    echo "  ✓ Token $LABEL OK"
  fi
done

echo ""
echo "=== Module Nhân sự ==="
check "ADMIN xem danh sách nhân viên"      "$T_ADMIN" GET "/personnel/employees" "200"
check "HR_MANAGER xem danh sách"           "$T_HR"    GET "/personnel/employees" "200"
check "DEPT_MANAGER xem danh sách"         "$T_DEPT"  GET "/personnel/employees" "200"
check "EMPLOYEE bị từ chối danh sách"      "$T_EMP"   GET "/personnel/employees" "403"
check "ADMIN thêm nhân viên (body rỗng=400)" "$T_ADMIN" POST "/personnel/employees" "400"
check "EMPLOYEE thêm nhân viên bị từ chối" "$T_EMP"  POST "/personnel/employees" "403"
check "DEPT_MANAGER thêm nhân viên bị từ chối" "$T_DEPT" POST "/personnel/employees" "403"

echo ""
echo "=== Module Bảng lương ==="
check "ADMIN xem bảng lương"               "$T_ADMIN" GET "/payroll?year=2026&month=6" "200"
check "HR_MANAGER xem bảng lương"          "$T_HR"    GET "/payroll?year=2026&month=6" "200"
check "ACCOUNTANT xem bảng lương"          "$T_ACC"   GET "/payroll?year=2026&month=6" "200"
check "DEPT_MANAGER bị từ chối bảng lương" "$T_DEPT"  GET "/payroll?year=2026&month=6" "403"
check "EMPLOYEE bị từ chối bảng lương"     "$T_EMP"   GET "/payroll?year=2026&month=6" "403"
check "ADMIN xuất Excel"                   "$T_ADMIN" GET "/payroll/export.xlsx?year=2026&month=6" "200"
check "ACCOUNTANT xuất Excel"              "$T_ACC"   GET "/payroll/export.xlsx?year=2026&month=6" "200"
check "HR_MANAGER tạo bảng lương (400=OK)" "$T_HR"    POST "/payroll/generate" "400"
check "ACCOUNTANT không tạo bảng lương"    "$T_ACC"   POST "/payroll/generate" "403"

echo ""
echo "=== Module Chấm công ==="
check "ADMIN xem chấm công hôm nay"        "$T_ADMIN" GET "/attendance/daily?date=$(date +%Y-%m-%d)" "200"
check "DEPT_MANAGER xem chấm công (khoa)"  "$T_DEPT"  GET "/attendance/daily?date=$(date +%Y-%m-%d)" "200"
check "EMPLOYEE bị từ chối chấm công"      "$T_EMP"   GET "/attendance/daily?date=$(date +%Y-%m-%d)" "403"
check "ACCOUNTANT bị từ chối chấm công"    "$T_ACC"   GET "/attendance/daily?date=$(date +%Y-%m-%d)" "403"

echo ""
echo "============================================="
echo "KẾT QUẢ: $PASS pass / $((PASS+FAIL)) test"
echo "============================================="
if [ $FAIL -gt 0 ]; then
  echo "FAIL: $FAIL test thất bại"
  exit 1
fi
