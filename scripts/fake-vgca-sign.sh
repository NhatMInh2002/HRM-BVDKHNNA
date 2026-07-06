#!/bin/bash
# Giả lập tool VGCASignService (ký số ngoài trình duyệt) để TEST luồng ký số
# VGCA của đơn nghỉ phép khi CHƯA có tool ký thật / chưa đăng ký dịch vụ VGCA
# với Ban Cơ yếu Chính phủ.
#
# ĐÂY KHÔNG PHẢI CHỮ KÝ SỐ THẬT — chỉ dùng để test luồng (Redis token,
# lưu trữ file, chuyển trạng thái đơn), không dùng cho production.
#
# Yêu cầu:
#   - Backend chạy với VGCA_ENABLED=true (an toàn để bật ở môi trường dev/test —
#     cờ này chỉ bật/tắt 2 endpoint nội bộ /files/vgca-source và
#     /files/vgca-upload, KHÔNG gọi ra dịch vụ Ban Cơ yếu Chính phủ nào)
#   - jq đã cài (dùng để đọc JSON response)
#   - Tài khoản DEPT_HEAD/NURSE_MANAGER (stage=dept) hoặc HR_MANAGER (stage=hr)
#   - stage=dept: đơn phải đang PENDING. stage=hr: đơn phải đang DEPT_APPROVED
#     (tức là đã chạy stage=dept xong trước đó)
#
# Cách dùng:
#   bash scripts/fake-vgca-sign.sh <leaveId> <dept|hr> <email> <password>

set -e

API_URL="${API_URL:-http://localhost:8080/api}"
LEAVE_ID="$1"
STAGE="$2"     # dept | hr
EMAIL="$3"
PASSWORD="$4"

if [ -z "$LEAVE_ID" ] || [ -z "$STAGE" ] || [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: bash scripts/fake-vgca-sign.sh <leaveId> <dept|hr> <email> <password>"
  exit 1
fi

echo "=== 1. Đăng nhập ($EMAIL) ==="
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RES" | jq -r '.data.token')
if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "  ✗ Đăng nhập thất bại: $LOGIN_RES"
  exit 1
fi
echo "  ✓ Token OK"

echo "=== 2. Khởi tạo phiên ký ($STAGE-sign-init) ==="
INIT_RES=$(curl -s -X POST "$API_URL/attendance/leave/$LEAVE_ID/$STAGE-sign-init" \
  -H "Authorization: Bearer $TOKEN")
SOURCE_URL=$(echo "$INIT_RES" | jq -r '.data.sourceUrl')
UPLOAD_URL=$(echo "$INIT_RES" | jq -r '.data.uploadHandler')
if [ "$SOURCE_URL" = "null" ] || [ -z "$SOURCE_URL" ]; then
  echo "  ✗ Không khởi tạo được phiên ký: $INIT_RES"
  echo "  (kiểm tra: VGCA_ENABLED=true chưa? role tài khoản đúng chưa? trạng thái đơn đúng chưa?)"
  exit 1
fi
echo "  ✓ sourceUrl=$SOURCE_URL"
echo "  ✓ uploadHandler=$UPLOAD_URL"

echo "=== 3. Tải văn bản nguồn (giả lập tool VGCA tải về) ==="
TMP_PDF=$(mktemp --suffix=.pdf)
curl -s "$SOURCE_URL" -o "$TMP_PDF"
echo "  ✓ Đã tải về $TMP_PDF ($(wc -c < "$TMP_PDF") bytes)"

echo "=== 4. Tải lên văn bản 'đã ký' (giả lập — KHÔNG phải chữ ký số thật) ==="
# Demo: upload lại nguyên file gốc để test round-trip trạng thái + lưu trữ.
# Muốn có dấu hiệu trực quan khác biệt, thay TMP_PDF bằng 1 file PDF khác
# trước dòng curl bên dưới (VD: đè thêm text bằng công cụ PDF khác).
UPLOAD_RES=$(curl -s -X POST "$UPLOAD_URL" \
  -F "uploadfile=@$TMP_PDF;type=application/pdf")
echo "  Kết quả: $UPLOAD_RES"

rm -f "$TMP_PDF"

echo ""
echo "=== Xong — vào trang Nghỉ phép trên UI để xác nhận đơn đã chuyển trạng thái + PDF đã cập nhật ==="
