package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.enums.ContractType;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.domain.enums.Gender;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

/**
 * Xuất danh sách nhân viên ra Excel theo phong cách bảng biểu hành chính:
 * tiêu đề bệnh viện — tên báo cáo — kỳ/điều kiện lọc, header có dấu tiếng Việt,
 * đóng khung, cố định dòng tiêu đề (freeze), và dòng chân xuất báo cáo.
 * Đồng bộ chuẩn với AttendanceExcelService.
 */
@Service
@RequiredArgsConstructor
public class EmployeeExcelService {

    private static final String HOSPITAL = "BỆNH VIỆN HỮU NGHỊ ĐA KHOA NGHỆ AN";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TS_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Map<Gender, String> GENDER_LABELS = new EnumMap<>(Gender.class);
    private static final Map<EmployeeStatus, String> STATUS_LABELS = new EnumMap<>(EmployeeStatus.class);
    private static final Map<ContractType, String> CONTRACT_TYPE_LABELS = new EnumMap<>(ContractType.class);
    static {
        GENDER_LABELS.put(Gender.MALE, "Nam");
        GENDER_LABELS.put(Gender.FEMALE, "Nữ");
        GENDER_LABELS.put(Gender.OTHER, "Khác");

        STATUS_LABELS.put(EmployeeStatus.ACTIVE, "Đang làm việc");
        STATUS_LABELS.put(EmployeeStatus.ON_LEAVE, "Nghỉ phép dài hạn");
        STATUS_LABELS.put(EmployeeStatus.PROBATION, "Thử việc");
        STATUS_LABELS.put(EmployeeStatus.TERMINATED, "Đã nghỉ việc");
        STATUS_LABELS.put(EmployeeStatus.RETIRED, "Nghỉ hưu");

        CONTRACT_TYPE_LABELS.put(ContractType.INDEFINITE, "Không xác định thời hạn");
        CONTRACT_TYPE_LABELS.put(ContractType.FIXED_TERM_1Y, "Hợp đồng 1 năm");
        CONTRACT_TYPE_LABELS.put(ContractType.FIXED_TERM_2Y, "Hợp đồng 2 năm");
        CONTRACT_TYPE_LABELS.put(ContractType.PROBATION, "Hợp đồng thử việc");
        CONTRACT_TYPE_LABELS.put(ContractType.PART_TIME, "Bán thời gian");
    }

    private static final String[] HEADERS = {
        "STT", "Mã NV", "Họ và tên", "Giới tính", "Ngày sinh", "Số điện thoại", "Email",
        "Chức vụ", "Khoa/Phòng", "Loại hợp đồng", "Trạng thái", "Ngày vào làm"
    };

    private final EmployeeRepository employeeRepo;

    public byte[] exportExcel(String keyword, EmployeeStatus status, UUID departmentId) throws Exception {
        String kw = (keyword != null) ? keyword : "";
        var employees = employeeRepo.search(kw, status, departmentId,
                PageRequest.of(0, 5000, Sort.by("fullName"))).getContent();

        try (var wb = new XSSFWorkbook();
             var bos = new ByteArrayOutputStream()) {

            Styles st = new Styles(wb);
            Sheet sheet = wb.createSheet("Danh sách nhân viên");

            // ── Tiêu đề (bệnh viện — tên báo cáo — điều kiện lọc) ──
            writeTitle(sheet, st, "DANH SÁCH NHÂN VIÊN"
                    + (status != null ? " — " + STATUS_LABELS.getOrDefault(status, status.name()) : ""),
                    HEADERS.length);

            // ── Header ──
            Row hRow = sheet.createRow(3);
            for (int i = 0; i < HEADERS.length; i++) cell(hRow, i, HEADERS[i], st.header);

            // ── Dữ liệu ──
            int rowIdx = 4;
            for (int i = 0; i < employees.size(); i++) {
                Employee e = employees.get(i);
                Row row = sheet.createRow(rowIdx++);
                numCell(row, 0, i + 1, st.center);
                cell(row, 1, str(e.getEmployeeCode()), st.body);
                cell(row, 2, str(e.getFullName()), st.body);
                cell(row, 3, e.getGender() != null ? GENDER_LABELS.get(e.getGender()) : "", st.center);
                cell(row, 4, e.getDateOfBirth() != null ? e.getDateOfBirth().format(DATE_FMT) : "", st.center);
                cell(row, 5, str(e.getPhone()), st.body);
                cell(row, 6, str(e.getEmail()), st.body);
                cell(row, 7, str(e.getPosition()), st.body);
                cell(row, 8, e.getDepartment() != null ? str(e.getDepartment().getName()) : "", st.body);
                cell(row, 9, e.getContractType() != null ? CONTRACT_TYPE_LABELS.get(e.getContractType()) : "", st.body);
                cell(row, 10, e.getStatus() != null ? STATUS_LABELS.get(e.getStatus()) : "", st.center);
                cell(row, 11, e.getJoinDate() != null ? e.getJoinDate().format(DATE_FMT) : "", st.center);
            }

            // ── Chân báo cáo ──
            Row foot = sheet.createRow(rowIdx + 1);
            cell(foot, 0, "Tổng số: " + employees.size() + " nhân viên · Xuất lúc "
                    + LocalDateTime.now().format(TS_FMT), st.italic);

            // Cố định dòng tiêu đề khi cuộn + tự giãn cột
            sheet.createFreezePane(0, 4);
            for (int i = 0; i < HEADERS.length; i++) sheet.autoSizeColumn(i);

            wb.write(bos);
            return bos.toByteArray();
        }
    }

    // ── Khung dựng sheet (đồng bộ với AttendanceExcelService) ──

    private void writeTitle(Sheet sheet, Styles st, String title, int cols) {
        int span = Math.max(1, Math.min(cols, 20));
        cell(sheet.createRow(0), 0, HOSPITAL, st.hospital);
        cell(sheet.createRow(1), 0, title, st.title);
        if (span > 1) {
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, span - 1));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, span - 1));
        }
        sheet.createRow(2); // dòng trống ngăn cách
    }

    private void cell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        c.setCellStyle(style);
    }

    private void numCell(Row row, int col, double value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    private String str(String v) { return v != null ? v : ""; }

    /** Bộ style dùng chung cho một workbook. */
    private static final class Styles {
        final CellStyle hospital, title, header, body, center, italic;

        Styles(Workbook wb) {
            Font bold = wb.createFont();
            bold.setBold(true);
            Font boldBig = wb.createFont();
            boldBig.setBold(true); boldBig.setFontHeightInPoints((short) 13);
            Font it = wb.createFont();
            it.setItalic(true);

            hospital = wb.createCellStyle();
            hospital.setFont(bold);
            hospital.setAlignment(HorizontalAlignment.CENTER);

            title = wb.createCellStyle();
            title.setFont(boldBig);
            title.setAlignment(HorizontalAlignment.CENTER);

            header = wb.createCellStyle();
            header.setFont(bold);
            header.setAlignment(HorizontalAlignment.CENTER);
            header.setBorderBottom(BorderStyle.THIN);
            header.setBorderTop(BorderStyle.THIN);
            header.setBorderLeft(BorderStyle.THIN);
            header.setBorderRight(BorderStyle.THIN);
            header.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            header.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            body = wb.createCellStyle();
            body.setBorderBottom(BorderStyle.THIN);
            body.setBorderLeft(BorderStyle.THIN);
            body.setBorderRight(BorderStyle.THIN);

            center = wb.createCellStyle();
            center.cloneStyleFrom(body);
            center.setAlignment(HorizontalAlignment.CENTER);

            italic = wb.createCellStyle();
            italic.setFont(it);
        }
    }
}
