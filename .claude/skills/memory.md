# Skill: Session Memory

## Khi nào dùng
Cuối mỗi phiên làm việc, hoặc khi người dùng nói "lưu lại", "ghi nhớ", "kết thúc hôm nay".

## Quy trình

### Bước 1 — Thu thập những gì đã làm
Trước khi lưu, tóm tắt:
- Những quyết định kỹ thuật mới (architecture, API contract, DB schema)
- Những thay đổi so với kế hoạch ban đầu
- Những vấn đề phát sinh và cách giải quyết
- Những việc còn dang dở (in-progress)

### Bước 2 — Cập nhật CHANGELOG
Thêm entry mới vào `docs/changelog/CHANGELOG.md`:
```markdown
## [YYYY-MM-DD] — [LOẠI]: [Tiêu đề ngắn]

**Người thực hiện:** [tên/role]
**Nội dung:** [mô tả ngắn]
**Tác động:** [module/file nào bị ảnh hưởng]
**Việc còn lại:** [nếu có]
```

Loại thay đổi: `FEAT` | `FIX` | `ARCH` | `DOCS` | `CONFIG` | `SECURITY`

### Bước 3 — Cập nhật checklist liên quan
- Nếu hoàn thành task trong `docs/implementation/phased-plan.md` → đổi `⬜` thành `✅`
- Nếu hoàn thành mục trong `docs/compliance/regulatory-checklist.md` → đổi `⬜` thành `✅`

### Bước 4 — Cập nhật memory agent
Nếu có thông tin mới ảnh hưởng đến các session sau:
- Quyết định kiến trúc mới → cập nhật `CLAUDE.md` phần Key Technical Decisions
- ADR mới → tạo file `docs/adr/ADR-XXX-*.md`
- Thông tin về team/người dùng → cập nhật memory file tương ứng

### Bước 5 — Tóm tắt cho người dùng
Trình bày ngắn gọn:
```
✅ Đã hoàn thành: [danh sách]
📝 Đã ghi nhớ:    [file nào được cập nhật]
⏳ Còn lại:       [việc chưa xong]
🔜 Tiếp theo:     [bước tiếp theo đề xuất]
```

## Quy tắc
- KHÔNG lưu code patterns hoặc logic cụ thể vào memory — chúng đã có trong code
- CHỈ lưu quyết định, ràng buộc, và context không đọc được từ code
- Nếu thay đổi ảnh hưởng Google Sheets log → nhắc người dùng sync
