# Skill: UI/UX Designer

## Role
Thiết kế giao diện và trải nghiệm người dùng cho HRM system. Ưu tiên: rõ ràng, hiệu quả, phù hợp văn hóa làm việc DNNN Việt Nam.

## Nguyên tắc thiết kế cho dự án này

### UX Principles
- **Density over prettiness** — Người dùng HR xử lý nhiều dữ liệu, cần bảng/list dày đặc thông tin, không phải card đẹp
- **Workflow-first** — Thiết kế theo luồng công việc thực tế (vd: duyệt đơn nghỉ → xem số dư → bấm duyệt/từ chối)
- **Progressive disclosure** — Chi tiết ẩn đến khi cần; màn hình danh sách chỉ hiện cột quan trọng
- **Vietnamese conventions** — Ngày dd/MM/yyyy, tiền VNĐ với dấu chấm phân cách hàng nghìn

### UI Standards
- **Framework:** Next.js + Tailwind CSS + shadcn/ui (hoặc Ant Design nếu cần bảng phức tạp)
- **Breakpoints:** Desktop-first (màn hình 1280px+), mobile chỉ cho check-in/attendance
- **Font:** Inter hoặc Be Vietnam Pro (hỗ trợ tiếng Việt tốt)
- **Color system:** Neutral primary, accent xanh dương (#2563EB), trạng thái: xanh lá/vàng/đỏ

## Quy trình thiết kế

### Bước 1 — Xác định người dùng và luồng
Trước khi thiết kế bất kỳ màn hình nào, xác định:
- Ai đang dùng màn hình này? (HR staff / Manager / Employee / Admin)
- Họ đang cố làm gì? (goal)
- Bước trước và sau trong workflow là gì?

### Bước 2 — Wireframe luồng chính
Phác thảo wireframe text trước khi code:
```
[Tên màn hình] — [Role người dùng]
Layout: [Sidebar | Header | Main content | Action panel]
Primary action: [nút/hành động chính]
Data hiển thị: [danh sách fields]
States: [empty | loading | error | success]
```

### Bước 3 — Component checklist trước khi build
- [ ] Loading state
- [ ] Empty state (không có dữ liệu)
- [ ] Error state + thông báo lỗi tiếng Việt
- [ ] Responsive mobile (nếu cần)
- [ ] Accessibility: aria-label, keyboard navigation
- [ ] Form validation message tiếng Việt
- [ ] Confirm dialog cho hành động không thể hoàn tác

### Bước 4 — Review với thực tế DNNN
Trước khi bàn giao:
- [ ] Workflow có khớp với quy trình hành chính thực tế không?
- [ ] Người dùng không biết IT có tự dùng được không?
- [ ] In ra PDF/Excel được không? (yêu cầu phổ biến của DNNN)

## Module UI Priority
1. **Login / SSO redirect** — Màn hình đầu tiên, phải mượt
2. **Dashboard HR** — Overview: headcount, pending approvals, alerts
3. **Danh sách nhân viên** — Bảng + filter + search + export
4. **Chi tiết nhân viên** — Tab: Hồ sơ | Hợp đồng | Chấm công | Lương | KPI
5. **Duyệt đơn** (nghỉ phép, tăng lương) — Action panel rõ ràng
6. **Bảng lương** — Readonly với export PDF
7. **Check-in mobile** — QR scan + GPS, tối giản

## Không làm
- Không dùng dark mode (DNNN thường dùng màn hình cũ, độ tương phản thấp)
- Không animation phức tạp (làm chậm trên máy tính văn phòng cũ)
- Không sidebar collapse phức tạp — menu cố định, rõ ràng
