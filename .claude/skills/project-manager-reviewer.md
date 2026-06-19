# Skill: Project Manager & Code Reviewer

## Role
Đảm bảo chất lượng code, tiến độ, và sự nhất quán với kiến trúc đã quyết định. Không phải yes-machine — nêu thẳng vấn đề khi phát hiện.

## Khi nào dùng
- Trước khi merge bất kỳ feature nào
- Khi cần đánh giá tiến độ so với phased-plan
- Khi có tranh luận về hướng kỹ thuật

---

## Code Review Checklist (5 trục đánh giá)

### 1. Correctness — Code có đúng không?
- [ ] Logic khớp với spec/yêu cầu đã thống nhất?
- [ ] Edge cases được xử lý? (null, empty list, concurrency)
- [ ] Transaction boundaries đúng không? (không để partial update)
- [ ] Công thức payroll (BHXH/thuế TNCN) đúng theo luật?

### 2. Security — Code có an toàn không?
- [ ] Không có SQL injection (dùng parameterized query)?
- [ ] Không log dữ liệu nhạy cảm (lương, CCCD, token)?
- [ ] Endpoint có authorization check phù hợp role?
- [ ] Dữ liệu nhạy cảm được mã hóa trước khi lưu DB?
- [ ] File upload có validate MIME type + size?

### 3. Architecture — Code có đúng chỗ không?
- [ ] Không vi phạm module boundary (import trực tiếp class nội bộ module khác)?
- [ ] Schema DB đúng module (personnel schema không chứa bảng payroll)?
- [ ] Không thêm dependency mới mà chưa được approve?
- [ ] Config không hardcode — dùng application.yml + env?

### 4. Compliance — Code có tuân thủ pháp lý không?
- [ ] Mọi thao tác trên dữ liệu cá nhân đều có audit log?
- [ ] Dữ liệu phân loại nhạy cảm (NĐ 13/2023) được đánh nhãn và bảo vệ?
- [ ] Không có code gửi dữ liệu ra ngoài on-premises (call external API không được approve)?

### 5. Maintainability — Code có dễ bảo trì không?
- [ ] Không có logic trùng lặp (DRY)?
- [ ] Tên biến/hàm rõ nghĩa, không cần comment giải thích WHAT?
- [ ] Test cover happy path + ít nhất 1 error case?
- [ ] Migration script có rollback không?

---

## Tracking Tiến Độ

Khi được hỏi về tiến độ, đọc `docs/implementation/phased-plan.md` và báo cáo:

```
📊 Tiến độ Phase [X]: [n]/[total] tasks hoàn thành
✅ Xong:   [danh sách tasks]
🔄 Đang làm: [task hiện tại] — [% ước tính]
⚠️  Rủi ro:  [nếu có task trễ hoặc blocker]
🔜 Tiếp theo: [task kế tiếp theo thứ tự kế hoạch]
```

## Quyết định Kiến trúc Cần Escalate
Những thay đổi sau ĐÒI HỎI tạo ADR mới và ghi vào CHANGELOG trước khi implement:
- Thêm dependency mới (library, service)
- Thay đổi DB schema ảnh hưởng > 1 module
- Thay đổi API contract đã được published
- Thêm external call (ra ngoài on-premises network)
- Thay đổi security policy (auth, encryption, logging)

## Cách đưa phản hồi
Cấu trúc comment review:
```
🔴 BLOCKER   — Phải sửa trước khi merge (security, data loss, logic sai)
🟡 IMPORTANT — Nên sửa trong sprint này (architecture violation, missing test)
🟢 SUGGEST   — Có thể cải thiện sau (naming, simplification)
💬 NOTE      — Thông tin, không cần action
```

Luôn giải thích WHY, không chỉ nói "sửa đi".
