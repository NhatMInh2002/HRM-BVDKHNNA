# Hướng dẫn luồng: Báo cáo chấm công · Hồ sơ lý lịch · Thu nhập tăng thêm

> Tài liệu cho phiên 2026-07-09 (branch `claude/salary-config-details-qeytz1`).
> Bao phủ 3 tính năng mới + nền tảng chung. Đối tượng: dev tiếp nhận và cán bộ TCCB vận hành.

---

## 0. Nền tảng chung (Giai đoạn 0)

### Lương cơ sở theo thời gian
Trước đây lương cơ sở `2.530.000đ` hard-code trong code. Nay lưu ở bảng `payroll.base_salary_configs`:

| Cột | Ý nghĩa |
|---|---|
| `amount` | Mức lương cơ sở |
| `effective_from` | Ngày bắt đầu hiệu lực (UNIQUE) |
| `legal_basis` | Căn cứ pháp lý (số Nghị định) |

**Đổi lương cơ sở khi có Nghị định mới** — không sửa code, chỉ chạy SQL:
```sql
INSERT INTO payroll.base_salary_configs (amount, effective_from, legal_basis)
VALUES (2600000, '2027-07-01', 'Nghị định XXX/2027/NĐ-CP');
```
`BaseSalaryService.getBaseSalary(date)` tự lấy mức có hiệu lực tại `date`. Bảng lương kỳ nào dùng lương cơ sở của kỳ đó.

### Mã hóa dữ liệu cá nhân (NĐ 13/2023)
Các cột nhạy cảm (`national_id`, `social_insurance_no`, `health_insurance_no`, `health_status`) được mã hóa **AES-256-GCM** ở tầng ứng dụng qua `@Convert(converter = EncryptedPiiConverter.class)`.

- Ciphertext có tiền tố `enc:v1:` — dữ liệu plaintext cũ vẫn đọc được (không tiền tố), khi ghi lại sẽ tự mã hóa.
- **Production BẮT BUỘC** đặt biến môi trường `HRM_ENCRYPTION_KEY` (chuỗi bất kỳ, dẫn xuất SHA-256 thành khóa 256-bit). Thiếu → dùng khóa dev + log cảnh báo (chỉ cho môi trường phát triển).

```bash
export HRM_ENCRYPTION_KEY="chuoi-bi-mat-manh-do-quan-tri-vien-dat"
```
> ⚠️ Đổi khóa sau khi đã có dữ liệu mã hóa sẽ khiến không giải mã được dữ liệu cũ. Cố định khóa ngay từ đầu.

---

## 1. Báo cáo Excel chấm công (Hạng mục A)

### Vận hành
Vào **Dashboard → Báo cáo & Thống kê**, chọn tháng/năm ở đầu trang, kéo xuống card *"Xuất báo cáo Excel chấm công"*. Quyền: `ADMIN`, `HR_MANAGER`.

### 10 báo cáo & endpoint

| # | Báo cáo | Endpoint |
|---|---|---|
| 1 | Bảng chấm công toàn viện (mẫu 01a-LĐTL) | `GET /attendance/export/monthly-grid.xlsx?year&month` |
| 2 | Bảng chấm công theo khoa/phòng | `GET /attendance/export/department-grid.xlsx?year&month&departmentId` |
| 3 | Đi muộn / về sớm | `GET /attendance/export/late-early.xlsx?year&month` |
| 4 | Vắng mặt không phép | `GET /attendance/export/unexcused-absence.xlsx?year&month` |
| 5 | Làm thêm giờ (OT) | `GET /attendance/export/overtime.xlsx?year&month` |
| 6 | Nghỉ phép đã duyệt theo loại | `GET /attendance/export/leave-by-type.xlsx?year&month` |
| 7 | Số dư phép năm | `GET /attendance/export/leave-balance.xlsx?year` |
| 8 | Đối soát ngày công ↔ bảng lương | `GET /attendance/export/payroll-reconciliation.xlsx?year&month` |
| 9 | So sánh chuyên cần giữa khoa/phòng | `GET /attendance/export/dept-comparison.xlsx?year&month` |
| 10 | Chi tiết chấm công 1 nhân viên | `GET /attendance/export/employee-detail.xlsx?employeeId&from&to` |

### Ký hiệu bảng chấm công (báo cáo 1, 2)
`x` = đủ công · `M` = đi muộn · `1/2` = nửa công · `P` = nghỉ phép · `V` = vắng.

### Quy ước giờ hành chính
Vào 08:00, ra 17:00 (`Asia/Ho_Chi_Minh`) — cùng ngưỡng với `ReportService`. OT = số giờ vượt 8h/ngày.

### Nguồn code
`module-attendance`: `service/AttendanceExcelService.java`, `controller/AttendanceReportController.java`. Frontend: `lib/attendance.ts` (10 hàm `export*`), `app/dashboard/reports/page.tsx` (`AttendanceExportCard`).

---

## 2. Hồ sơ lý lịch HS02-VC/BNV (Hạng mục B)

### Vận hành
Trong bảng **Nhân sự**, mỗi dòng có nút 📄 xanh lá (icon tài liệu) → mở modal *Sơ yếu lý lịch* với 7 tab:

1. **Thông tin chung** — nơi sinh, ngày/nơi cấp CCCD, số BHXH/BHYT, thành phần gia đình, tuyển dụng
2. **Ngạch bậc & trình độ** — mã ngạch, bậc/hệ số lương, trình độ, lý luận chính trị, QLNN, ngoại ngữ, tin học
3. **Chính trị · Sức khỏe** — ngày vào Đảng/Đoàn, quân ngũ, chính sách, sức khỏe/chiều cao/cân nặng/nhóm máu, đặc điểm bản thân
4. **Đào tạo** — bảng quá trình đào tạo, bồi dưỡng
5. **Công tác** — bảng quá trình công tác
6. **Khen thưởng · Kỷ luật** — 2 danh sách riêng
7. **Quan hệ gia đình** — bên bản thân + bên vợ/chồng

Nút **"Xuất PDF"** (góc trên) tải Sơ yếu lý lịch theo mẫu HS02-VC/BNV. Chỉ `ADMIN`/`HR_MANAGER` sửa được; các role khác xem (fieldset disabled).

### Cơ chế lưu
`PUT /personnel/employees/{id}/profile` lưu kiểu **replace-all** cho 4 danh sách con (xóa hết rồi ghi lại theo thứ tự) — client không cần diff từng dòng. Dòng thiếu trường bắt buộc (đơn vị/cơ sở đào tạo/họ tên...) bị bỏ qua khi lưu.

### API
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/personnel/employees/{id}/profile` | Đọc hồ sơ |
| PUT | `/personnel/employees/{id}/profile` | Lưu hồ sơ |
| GET | `/personnel/employees/{id}/profile/pdf` | Xuất PDF HS02 |

### Nguồn code
`module-personnel`: `service/EmployeeProfileService.java`, `service/ProfilePdfService.java`, `controller/EmployeeProfileController.java`, 4 entity `EmployeeWorkHistory/Training/FamilyRelation/Award`. Frontend: `components/personnel/employee-profile-modal.tsx`, `lib/personnel.ts`.

---

## 3. Thu nhập tăng thêm — TNTT (Hạng mục C)

### Công thức (Điều 34/35 quy chế chi tiêu nội bộ)
```
TNTT = lương cơ sở × tổng hệ số × %xếp loại × (ngày công thực tế / chuẩn) × số lần chi trả

Tổng hệ số = HS trách nhiệm (chính + 25% × phụ)
           + HS trình độ điều chỉnh (× hệ số CCHN/liên thông × %đặc thù khoa/phòng)
           + HS kiêm nhiệm đoàn thể
           + HS kiêm nhiệm khoa/phòng (= HS trình độ điều chỉnh × %phụ trội × %thời gian)
```
Cài đặt trong `SalaryIncrementCalculator.java`, kiểm chứng bằng `SalaryIncrementCalculatorTest` (6 ca).

### Luồng vận hành đầy đủ

```
┌─ 1. Cấu hình TNTT ────────────────┐   ┌─ 2. Duyệt ─────────┐   ┌─ 3. Sinh bảng lương ──────┐
│ Trang Cấu hình lương → tab        │   │ Lịch sử TNTT →     │   │ POST /payroll/generate    │
│ "Lương tăng thêm", chọn NV, nhập  │──▶│ nút "Duyệt để tính │──▶│ chỉ cộng bản APPROVED     │
│ hệ số → Lưu (status = DRAFT)      │   │ lương" (→APPROVED) │   │ vào gross của kỳ          │
└───────────────────────────────────┘   └────────────────────┘   └───────────────────────────┘
```

**Quan trọng:** cấu hình mới ở trạng thái `DRAFT` — **KHÔNG** được tính vào lương cho đến khi bấm **Duyệt**. Trên UI có badge *Chờ duyệt* (vàng) / *Đã duyệt* (xanh).

### Xử lý thuế & bảo hiểm
- TNTT **CHỊU thuế TNCN** (nằm trong gross, không phải phụ cấp miễn thuế).
- TNTT **KHÔNG tính đóng BHXH** (BHXH chỉ tính trên lương cơ bản pro-rata).
- Ngày công lấy từ **chấm công** (thống nhất một nguồn với lương cơ bản), không dùng số nhập tay trong cấu hình.

### Hệ số đặc thù khoa/phòng
Bảng `payroll.specialty_department_multipliers` map `department_id → percent`. Mặc định **100%** (không phụ trội). Cập nhật qua `PUT /payroll/specialty-multipliers/{departmentId}` khi TCCB xác nhận khoa nào 110-135%.

### API
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/payroll/salary-increment` | Lưu cấu hình TNTT (DRAFT) |
| PUT | `/payroll/salary-increment/config/{id}/approve` | Duyệt (DRAFT→APPROVED) |
| GET | `/payroll/salary-increment/{employeeId}` | Lịch sử |
| GET/PUT | `/payroll/specialty-multipliers/{departmentId}` | % đặc thù khoa |

### Nguồn code
`module-payroll`: `service/PayrollService.java` (`computeSalaryIncrement`, `approveSalaryIncrement`), `SalaryIncrementCalculator.java`, `controller/SpecialtyMultiplierController.java`. Frontend: `lib/payroll.ts` (`approveSalaryIncrement`), `app/dashboard/payroll/config/page.tsx`.

---

## 4. Việc còn cần Phòng TCCB xác nhận

| # | Nội dung | Trạng thái code |
|---|---|---|
| 1 | Danh sách **% đặc thù** từng khoa/phòng (110-135%) | Seed 100%, chờ nhập số thật |
| 2 | Cách tính **thuế/BHXH của TNTT** | Đang: chịu TNCN, miễn BHXH — cần xác nhận |
| 3 | Cơ chế **hồi tố/truy lĩnh** khi quyết định ký muộn | Chưa có, chờ quy tắc |
| 4 | Chu kỳ xếp loại thi đua (tháng/quý) & quota "dồn toa" | Hệ thống chỉ nhận kết quả đã duyệt |

Xem bộ 30 câu hỏi chi tiết trong lịch sử phiên làm việc / trao đổi với TCCB.

---

## 5. Chạy migration & kiểm thử

```bash
# Migration tự chạy khi khởi động app (Flyway V37-V40)
docker-compose up -d        # cần Docker + PostgreSQL

# Chạy unit test công thức TNTT (không cần DB)
cd backend
mvn -pl module-payroll -am test -Dtest=SalaryIncrementCalculatorTest -Dsurefire.failIfNoSpecifiedTests=false
```

> Môi trường CI/agent không có Docker nên chưa chạy integration test DB. Khi có DB, nên generate thử 1 kỳ lương cho 1 nhân viên có cấu hình TNTT đã duyệt để đối chiếu số liệu cuối.
