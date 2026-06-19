# Skill: Context Loader — Đọc đúng file, đúng lúc

## Nguyên tắc
Không đọc file nào nếu không cần. CLAUDE.md đã đủ để bắt đầu hầu hết task.

## Quyết định đọc thêm

```
Task là gì?
│
├── Hỏi "làm gì tiếp theo" / tiến độ phase
│   → ĐỌC: docs/implementation/phased-plan.md (chỉ phần Phase hiện tại)
│
├── Có từ "pháp lý", "BHXH", "NĐ 13", "TT12", "thuế", "chữ ký số"
│   → ĐỌC: docs/compliance/regulatory-checklist.md
│
├── Có từ "tại sao", "kiến trúc", "ADR", "quyết định"
│   → ĐỌC: docs/adr/ADR-001-architecture-evaluation.md
│
├── Làm UI / màn hình / component
│   → ĐỌC: .claude/skills/ui-ux-designer.md
│
├── Viết API / service / DB / payroll logic
│   → ĐỌC: .claude/skills/backend-engineer.md
│
├── Review code / kiểm tra chất lượng
│   → ĐỌC: .claude/skills/project-manager-reviewer.md
│
├── Debug / test / smoke test
│   → ĐỌC: .claude/skills/tester-debugger.md
│
└── Kết thúc phiên / lưu lại
    → ĐỌC: .claude/skills/memory.md
```

## Khi nào KHÔNG đọc thêm gì
- Task đơn giản: trả lời câu hỏi, giải thích code, sửa lỗi nhỏ
- Đã đọc file đó trong session này — không đọc lại
- CLAUDE.md đã có đủ thông tin để trả lời

## Tối ưu token khi đọc file dài
Khi file > 100 dòng, chỉ đọc phần cần:
- `phased-plan.md` → chỉ đọc Phase hiện tại (xem "Trạng thái hiện tại" trong CLAUDE.md)
- `regulatory-checklist.md` → chỉ đọc section liên quan đến task
- ADR → chỉ đọc "Decision" và "Action Items", bỏ qua "Options Considered" nếu không cần so sánh
