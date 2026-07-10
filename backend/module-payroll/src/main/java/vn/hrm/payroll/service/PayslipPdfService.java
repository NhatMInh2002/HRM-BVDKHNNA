package vn.hrm.payroll.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import vn.hrm.payroll.domain.PayrollRecord;
import vn.hrm.payroll.repository.PayrollRecordRepository;
import vn.hrm.shared.pdf.PdfFonts;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayslipPdfService {

    private final PayrollRecordRepository payrollRecordRepo;
    private final JdbcTemplate jdbc;

    public byte[] generatePayslip(UUID recordId) throws DocumentException, java.io.IOException {
        PayrollRecord rec = payrollRecordRepo.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiếu lương"));

        // Lấy thông tin nhân viên
        Map<String, Object> emp = jdbc.queryForMap(
                "SELECT e.full_name, e.employee_code, e.position, d.name as dept_name " +
                "FROM personnel.employees e LEFT JOIN personnel.departments d ON d.id = e.department_id " +
                "WHERE e.id = ?", rec.getEmployeeId());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 60, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // Fonts — DejaVu Sans hỗ trợ Unicode tiếng Việt
        BaseFont bf     = loadUnicodeFont();
        BaseFont bfBold = loadUnicodeFontBold();
        Font titleFont  = new Font(bfBold, 16, Font.NORMAL, Color.decode("#1e40af"));
        Font headerFont = new Font(bfBold, 10, Font.NORMAL, Color.DARK_GRAY);
        Font bodyFont   = new Font(bf,     9,  Font.NORMAL);
        Font boldFont   = new Font(bfBold, 9,  Font.NORMAL);
        Font totalFont  = new Font(bfBold, 11, Font.NORMAL, Color.decode("#15803d"));

        // Hospital header
        Paragraph hospital = new Paragraph("BỆNH VIỆN HỮU NGHỊ ĐA KHOA NGHỆ AN", titleFont);
        hospital.setAlignment(Element.ALIGN_CENTER);
        doc.add(hospital);

        Paragraph phieuLuong = new Paragraph(
                "PHIẾU LƯƠNG THÁNG " + rec.getPeriodMonth() + "/" + rec.getPeriodYear(),
                new Font(bf, 13, Font.BOLD));
        phieuLuong.setAlignment(Element.ALIGN_CENTER);
        phieuLuong.setSpacingBefore(4);
        phieuLuong.setSpacingAfter(16);
        doc.add(phieuLuong);

        // Employee info table
        PdfPTable infoTable = new PdfPTable(4);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1.5f, 2f, 1.5f, 2f});
        infoTable.setSpacingAfter(12);
        addInfoCell(infoTable, "Họ và tên:", headerFont, false);
        addInfoCell(infoTable, str(emp.get("full_name")), boldFont, false);
        addInfoCell(infoTable, "Mã NV:", headerFont, false);
        addInfoCell(infoTable, str(emp.get("employee_code")), boldFont, false);
        addInfoCell(infoTable, "Chức vụ:", headerFont, false);
        addInfoCell(infoTable, str(emp.get("position")), bodyFont, false);
        addInfoCell(infoTable, "Phòng ban:", headerFont, false);
        addInfoCell(infoTable, str(emp.get("dept_name")), bodyFont, false);
        addInfoCell(infoTable, "Ngày công chuẩn:", headerFont, false);
        addInfoCell(infoTable, String.valueOf(rec.getWorkingDays()), bodyFont, false);
        addInfoCell(infoTable, "Ngày công thực tế:", headerFont, false);
        addInfoCell(infoTable, String.valueOf(rec.getActualDays()), bodyFont, false);
        doc.add(infoTable);

        // Salary detail table
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{3f, 1.5f});

        // Header row
        addHeaderRow(t, "KHOẢN MỤC", "SỐ TIỀN (VNĐ)", headerFont, Color.decode("#1e40af"));

        // Thu nhap
        addSectionHeader(t, "A. THU NHẬP", headerFont, Color.decode("#dbeafe"));
        addRow(t, "1. Lương cơ bản (theo ngày thực tế)", fmt(rec.getBasicSalary()), bodyFont, boldFont, null);
        addRow(t, "2. Phụ cấp (ăn trưa + đi lại + điện thoại + khác)", fmt(rec.getTotalAllowance()), bodyFont, boldFont, null);
        addRow(t, "3. Lương tăng ca (OT)", fmt(rec.getOtPay()), bodyFont, boldFont, null);
        if (rec.getSalaryIncrement() != null
                && rec.getSalaryIncrement().compareTo(java.math.BigDecimal.ZERO) > 0)
            addRow(t, "4. Thu nhập tăng thêm (TNTT)", fmt(rec.getSalaryIncrement()), bodyFont, boldFont, null);
        addRow(t, "TỔNG THU NHẬP (GROSS)", fmt(rec.getGrossSalary()), boldFont, boldFont,
                Color.decode("#eff6ff"));

        // Khau tru
        addSectionHeader(t, "B. KHẤU TRỪ", headerFont, Color.decode("#fef2f2"));
        addRow(t, "1. BHXH người lao động (8%)", fmt(rec.getBhxhEmployee()), bodyFont, boldFont, null);
        addRow(t, "2. BHYT người lao động (1.5%)", fmt(rec.getBhytEmployee()), bodyFont, boldFont, null);
        addRow(t, "3. BHTN người lao động (1%)", fmt(rec.getBhtnEmployee()), bodyFont, boldFont, null);
        addRow(t, "4. Thuế TNCN", fmt(rec.getPit()), bodyFont, boldFont, null);
        if (rec.getOtherDeduction().compareTo(java.math.BigDecimal.ZERO) > 0)
            addRow(t, "5. Khác", fmt(rec.getOtherDeduction()), bodyFont, boldFont, null);
        addRow(t, "TỔNG KHẤU TRỪ", fmt(rec.getTotalDeduction()), boldFont, boldFont,
                Color.decode("#fff1f2"));

        // Net
        PdfPCell netLabel = new PdfPCell(new Phrase("LƯƠNG THỰC NHẬN (NET)", totalFont));
        netLabel.setPadding(8);
        netLabel.setBackgroundColor(Color.decode("#f0fdf4"));
        netLabel.setBorderColor(Color.decode("#15803d"));
        t.addCell(netLabel);

        PdfPCell netVal = new PdfPCell(new Phrase(fmt(rec.getNetSalary()), totalFont));
        netVal.setPadding(8);
        netVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        netVal.setBackgroundColor(Color.decode("#f0fdf4"));
        netVal.setBorderColor(Color.decode("#15803d"));
        t.addCell(netVal);

        doc.add(t);

        // Footer
        if (rec.getNote() != null && !rec.getNote().isBlank()) {
            doc.add(new Paragraph("Ghi chu: " + rec.getNote(), bodyFont));
        }

        Paragraph footer = new Paragraph(
                "Trạng thái: " + rec.getStatus()
                + (rec.getApprovedBy() != null ? " | Duyệt bởi: " + rec.getApprovedBy() : ""),
                new Font(bf, 8, Font.ITALIC, Color.GRAY));
        footer.setSpacingBefore(20);
        footer.setAlignment(Element.ALIGN_RIGHT);
        doc.add(footer);

        doc.close();
        return out.toByteArray();
    }

    // ── Excel export cho cả kỳ ────────────────────────────────────────────────

    public byte[] exportExcel(int year, int month) throws Exception {
        var records = payrollRecordRepo.findByPeriodYearAndPeriodMonth(
                (short) year, (short) month,
                org.springframework.data.domain.PageRequest.of(0, 1000)).getContent();

        try (var wb = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             var bos = new ByteArrayOutputStream()) {

            var sheet = wb.createSheet("Bang luong " + month + "-" + year);
            var headerStyle = wb.createCellStyle();
            var headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            String[] headers = {
                "STT", "Ma NV", "Ho ten", "Ky", "Luong CB", "Phu cap", "OT", "TNTT",
                "Gross", "BHXH", "BHYT", "BHTN", "Thue TNCN", "Tong khau tru",
                "Net (Thuc nhan)", "Ngay cong chuan", "Ngay cong thuc", "Trang thai"
            };

            var hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Fetch employee names
            for (int i = 0; i < records.size(); i++) {
                PayrollRecord r = records.get(i);
                String empInfo;
                try {
                    Map<String, Object> emp = jdbc.queryForMap(
                            "SELECT employee_code, full_name FROM personnel.employees WHERE id = ?",
                            r.getEmployeeId());
                    empInfo = str(emp.get("employee_code")) + " | " + str(emp.get("full_name"));
                } catch (Exception e) {
                    empInfo = r.getEmployeeId().toString();
                }

                var row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(i + 1);
                String[] parts = empInfo.split(" \\| ", 2);
                row.createCell(1).setCellValue(parts[0]);
                row.createCell(2).setCellValue(parts.length > 1 ? parts[1] : "");
                row.createCell(3).setCellValue(r.getPeriodMonth() + "/" + r.getPeriodYear());
                row.createCell(4).setCellValue(r.getBasicSalary().doubleValue());
                row.createCell(5).setCellValue(r.getTotalAllowance().doubleValue());
                row.createCell(6).setCellValue(r.getOtPay().doubleValue());
                row.createCell(7).setCellValue(r.getSalaryIncrement() != null ? r.getSalaryIncrement().doubleValue() : 0);
                row.createCell(8).setCellValue(r.getGrossSalary().doubleValue());
                row.createCell(9).setCellValue(r.getBhxhEmployee().doubleValue());
                row.createCell(10).setCellValue(r.getBhytEmployee().doubleValue());
                row.createCell(11).setCellValue(r.getBhtnEmployee().doubleValue());
                row.createCell(12).setCellValue(r.getPit().doubleValue());
                row.createCell(13).setCellValue(r.getTotalDeduction().doubleValue());
                row.createCell(14).setCellValue(r.getNetSalary().doubleValue());
                row.createCell(15).setCellValue(r.getWorkingDays());
                row.createCell(16).setCellValue(r.getActualDays());
                row.createCell(17).setCellValue(r.getStatus().name());
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(bos);
            return bos.toByteArray();
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void addInfoCell(PdfPTable t, String text, Font font, boolean shade) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4);
        cell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        if (shade) cell.setBackgroundColor(Color.decode("#f8fafc"));
        t.addCell(cell);
    }

    private void addHeaderRow(PdfPTable t, String col1, String col2, Font f, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(col1, new Font(f.getBaseFont(), f.getSize(), Font.BOLD, Color.WHITE)));
        c1.setBackgroundColor(bg); c1.setPadding(6);
        PdfPCell c2 = new PdfPCell(new Phrase(col2, new Font(f.getBaseFont(), f.getSize(), Font.BOLD, Color.WHITE)));
        c2.setBackgroundColor(bg); c2.setPadding(6); c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.addCell(c1); t.addCell(c2);
    }

    private void addSectionHeader(PdfPTable t, String label, Font f, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(label, new Font(f.getBaseFont(), f.getSize(), Font.BOLD)));
        cell.setColspan(2); cell.setBackgroundColor(bg); cell.setPadding(5);
        t.addCell(cell);
    }

    private void addRow(PdfPTable t, String label, String value, Font labelFont, Font valFont, Color bg) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, labelFont));
        c1.setPadding(5);
        if (bg != null) c1.setBackgroundColor(bg);
        PdfPCell c2 = new PdfPCell(new Phrase(value, valFont));
        c2.setPadding(5); c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        if (bg != null) c2.setBackgroundColor(bg);
        t.addCell(c1); t.addCell(c2);
    }

    private String fmt(java.math.BigDecimal v) {
        if (v == null) return "0";
        return NumberFormat.getNumberInstance(new Locale("vi", "VN")).format(v);
    }

    private String str(Object v) { return v != null ? v.toString() : ""; }

    // Font Unicode tiếng Việt nhúng sẵn trong classpath (shared-kernel) — xem PdfFonts.
    private BaseFont loadUnicodeFont() { return PdfFonts.baseRegular(); }

    private BaseFont loadUnicodeFontBold() { return PdfFonts.baseBold(); }
}
