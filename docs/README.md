# Tài liệu dự án HRM — BV HNĐK Nghệ An

Chỉ mục toàn bộ tài liệu. Bắt đầu từ `CLAUDE.md` ở gốc repo để nắm bối cảnh, sau đó vào đây khi cần tài liệu chuyên sâu.

## Cấu trúc

```
docs/
├── adr/            — Quyết định kiến trúc (Architecture Decision Records)
├── changelog/      — Nhật ký thay đổi + log các phiên làm việc
├── compliance/     — Tuân thủ pháp lý (NĐ 13/2023, TT12/2022…)
├── guides/         — Hướng dẫn vận hành & phát triển
└── implementation/ — Kế hoạch triển khai & spec
```

## Mục lục theo chủ đề

### 🚀 Bắt đầu & phát triển
| Tài liệu | Nội dung |
|---|---|
| [guides/developer-guide.md](guides/developer-guide.md) | Clone code & chạy project local trong ~15 phút |
| [guides/user-access-flow.md](guides/user-access-flow.md) | Luồng người dùng đi qua hệ thống (đăng nhập → gọi API), sơ đồ Mermaid |
| [guides/testing-strategy.md](guides/testing-strategy.md) | Chiến lược kiểm thử, 50+ test case P0/P1/P2 |

### 💼 Nghiệp vụ
| Tài liệu | Nội dung |
|---|---|
| [guides/salary-attendance-profile-flow.md](guides/salary-attendance-profile-flow.md) | Luồng báo cáo chấm công, hồ sơ lý lịch PDF (HS02), thu nhập tăng thêm (TNTT) |

### 🏛️ Kiến trúc & kế hoạch
| Tài liệu | Nội dung |
|---|---|
| [adr/ADR-001-architecture-evaluation.md](adr/ADR-001-architecture-evaluation.md) | Đánh giá kiến trúc — chọn Modular Monolith |
| [implementation/phased-plan.md](implementation/phased-plan.md) | Kế hoạch triển khai theo phase |
| [implementation/rbac-plan.md](implementation/rbac-plan.md) | Kế hoạch phân quyền (RBAC) — vai trò, quyền, trạng thái |

### ⚖️ Pháp lý
| Tài liệu | Nội dung |
|---|---|
| [compliance/regulatory-checklist.md](compliance/regulatory-checklist.md) | Checklist tuân thủ quy định pháp lý |

### 📝 Lịch sử
| Tài liệu | Nội dung |
|---|---|
| [changelog/CHANGELOG.md](changelog/CHANGELOG.md) | Nhật ký quyết định & thay đổi |
| [changelog/sessions/](changelog/sessions/) | Log bàn giao từng phiên làm việc |

## Quy ước

- **Tên file:** kebab-case (`developer-guide.md`), riêng ADR giữ định dạng `ADR-NNN-tên.md`.
- **Ngôn ngữ:** tiếng Việt.
- Mỗi thay đổi kiến trúc/kế hoạch: ghi vào `changelog/CHANGELOG.md`.
- Kết thúc phiên làm việc lớn: thêm log vào `changelog/sessions/`.
