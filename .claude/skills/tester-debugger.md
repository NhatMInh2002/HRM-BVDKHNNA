# Skill: Tester & Debugger

## Role
Đảm bảo mọi tính năng hoạt động đúng trước khi merge và sau khi deploy. Reproduce lỗi trước khi fix — không đoán mò.

## Khi nào dùng
- Viết test cho feature mới
- Có bug report từ người dùng hoặc QA
- Sau mỗi deploy để smoke test
- Trước UAT (User Acceptance Testing) với phòng HR

---

## Testing Strategy theo Layer

### Unit Tests (module logic)
**Framework:** JUnit 5 + Mockito (backend), Vitest (frontend)  
**Target:** Business logic phức tạp — đặc biệt payroll calculations

```java
// Template unit test cho payroll
@Test
void shouldCalculatePITCorrectly_givenIncomeAbove80M() {
    // Arrange
    PayrollInput input = PayrollInput.builder()
        .grossIncome(90_000_000L)   // 90 triệu
        .dependents(1)
        .build();
    
    // Act
    PayrollResult result = payrollService.calculate(input);
    
    // Assert — verify từng thành phần
    assertThat(result.getBhxhEmployee()).isEqualTo(7_200_000L);  // 8%
    assertThat(result.getPit()).isEqualTo(...);                   // tính lũy tiến
}
```

**Quy tắc:** Test payroll PHẢI có test case cho từng bậc thuế TNCN (7 bậc).

### Integration Tests (API + DB)
**Framework:** Spring Boot Test + Testcontainers (PostgreSQL, Redis thật)  
**KHÔNG mock DB** — đã có incident khi mock test pass nhưng prod fail.

```java
@SpringBootTest
@Testcontainers
class LeaveRequestApiTest {
    // Test toàn bộ flow: API call → Service → DB → Response
}
```

### E2E Tests (browser)
**Framework:** Playwright  
**Scope:** Happy path cho 5 workflow quan trọng nhất:
1. Login via SSO → xem dashboard
2. Nhân viên nộp đơn nghỉ → Manager duyệt → Email notification
3. HR tạo bảng lương tháng → Approve → Export PDF
4. Check-in bằng QR code (mobile)
5. HR tìm kiếm nhân viên → xem hồ sơ → download hợp đồng

---

## Debug Workflow (4 bước bắt buộc)

### Bước 1 — REPRODUCE (không skip bước này)
Trước khi đọc code, reproduce lỗi:
- Lỗi xảy ra ở bước nào? Input gì?
- Có tái hiện được 100% không, hay chỉ thỉnh thoảng?
- Môi trường nào? (local / staging / prod)

Nếu không reproduce được → hỏi thêm thông tin, KHÔNG đoán fix.

### Bước 2 — ISOLATE
Thu hẹp phạm vi:
- Check log (ELK Stack) — timestamp lỗi, stacktrace, request ID
- Check audit log — ai làm gì, lúc nào
- Dùng binary search: lỗi ở frontend hay backend? Service nào? Function nào?

```bash
# Lấy log theo request ID
curl http://elk:5601/api/... -d '{"query": {"match": {"requestId": "xxx"}}}'
```

### Bước 3 — DIAGNOSE
Tìm nguyên nhân gốc (root cause), không chỉ symptom:
- "Lương tính sai" → tại sao? Sai công thức, sai input, sai rounding?
- "Không duyệt được đơn" → permission, state machine, hay DB constraint?

Viết ra hypothesis trước: *"Tôi nghĩ lỗi do X vì Y"* → verify.

### Bước 4 — FIX + GUARD
- Fix root cause, không patch symptom
- Viết test reproduce lỗi TRƯỚC khi fix (test phải fail → rồi fix → test pass)
- Ghi vào CHANGELOG loại `FIX`
- Nếu lỗi liên quan security → escalate ngay, ghi vào CHANGELOG loại `SECURITY`

---

## Checklist Smoke Test sau Deploy

```
□ Login SSO hoạt động
□ Dashboard load < 3 giây
□ Tạo nhân viên mới thành công
□ Chấm công check-in/out ghi đúng
□ Đơn nghỉ phép: nộp → duyệt → cập nhật số dư
□ Bảng lương tháng hiện tại load được
□ Export Excel/PDF hoạt động
□ Không có lỗi 500 trong log 5 phút đầu
```

## Lỗi Phổ Biến cần Watch

| Triệu chứng | Nguyên nhân hay gặp | Nơi kiểm tra |
|---|---|---|
| Lương tính sai cuối tháng | OT không được tính, timezone sai | Attendance logs + Payroll engine |
| SSO loop redirect | Session Redis hết hạn hoặc SAML config sai | Spring Security log |
| Chấm công GPS fail | Bán kính quá chặt, IP office thay đổi | Attendance Service config |
| Approval không gửi email | SMTP config, email template lỗi | Workflow Service + email log |
| Export PDF timeout | Bảng lương quá lớn, query N+1 | Report Service + DB slow query log |
