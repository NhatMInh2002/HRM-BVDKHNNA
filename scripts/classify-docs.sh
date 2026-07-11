#!/usr/bin/env bash
# ============================================================
# Tự động phân loại file docs mới vào đúng thư mục con theo từ khóa tên file.
# Quét các file .md nằm LẠC ở gốc docs/ (trừ README.md) rồi chuyển vào:
#   guides/ · implementation/ · adr/ · changelog/ · compliance/ · security/
#
# Dùng:
#   - Thủ công:  bash scripts/classify-docs.sh
#   - Tự động:   gắn hook Stop trong .claude/settings.json (chạy cuối mỗi lượt)
#
# An toàn: chỉ đụng file .md ở NGAY gốc docs/ (maxdepth 1), không đụng thư mục con.
# File không khớp nhóm nào → giữ nguyên + cảnh báo để phân loại tay.
# Giữ lịch sử git bằng `git mv` khi file đã được track.
# ============================================================
set -euo pipefail

# Về gốc repo để đường dẫn docs/ luôn đúng dù hook chạy ở cwd nào
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

DOCS="docs"
[ -d "$DOCS" ] || exit 0

moved=0
unmatched=0

classify() {
  # $1 = tên file (lowercase). In ra thư mục đích, rỗng nếu không khớp.
  case "$1" in
    *adr*|*architecture-decision*)                 echo "adr" ;;
    *guide*|*flow*|*onboarding*|*huong-dan*|*tutorial*|*how-to*) echo "guides" ;;
    *plan*|*rbac*|*roadmap*|*phase*|*spec*|*design*) echo "implementation" ;;
    *changelog*|*session*|*nhat-ky*|*release*)     echo "changelog" ;;
    *compliance*|*regulatory*|*checklist*|*phap-ly*|*nd13*|*nd-13*|*tt12*) echo "compliance" ;;
    *security*|*assessment*|*pentest*|*audit*|*bao-mat*|*threat*|*vuln*)   echo "security" ;;
    *)                                             echo "" ;;
  esac
}

shopt -s nullglob
for f in "$DOCS"/*.md; do
  base="$(basename "$f")"
  [ "$base" = "README.md" ] && continue

  target="$(classify "$(echo "$base" | tr '[:upper:]' '[:lower:]')")"
  if [ -z "$target" ]; then
    echo "⚠️  docs/$base — không đoán được nhóm, cần phân loại tay."
    unmatched=$((unmatched + 1))
    continue
  fi

  mkdir -p "$DOCS/$target"
  dest="$DOCS/$target/$base"
  if [ -e "$dest" ]; then
    echo "⚠️  docs/$base — đã tồn tại $dest, bỏ qua để tránh ghi đè."
    continue
  fi

  if git ls-files --error-unmatch "$f" >/dev/null 2>&1; then
    git mv "$f" "$dest"
  else
    mv "$f" "$dest"
  fi
  echo "📄 docs/$base → docs/$target/$base"
  moved=$((moved + 1))
done

if [ "$moved" -gt 0 ]; then
  echo "✅ Đã phân loại $moved file docs. Nhớ cập nhật liên kết trong docs/README.md nếu cần."
fi
exit 0
