package vn.hrm.app.leave;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.hrm.app.storage.StorageService;
import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveType;

import java.awt.Color;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeavePdfService {

    private final StorageService storageService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Map<LeaveType, String> LEAVE_TYPE_LABELS = Map.of(
        LeaveType.ANNUAL,                "Nghỉ phép năm",
        LeaveType.SICK,                  "Nghỉ ốm",
        LeaveType.MATERNITY,             "Nghỉ thai sản",
        LeaveType.PATERNITY,             "Nghỉ thai sản (nam)",
        LeaveType.PERSONAL_MARRIAGE,     "Nghỉ bản thân kết hôn",
        LeaveType.PERSONAL_CHILD_MARRIAGE, "Nghỉ con kết hôn",
        LeaveType.UNPAID,                "Nghỉ không lương",
        LeaveType.COMPENSATORY,          "Nghỉ bù"
    );

    /**
     * Sinh PDF đơn nghỉ phép và lưu vào MinIO.
     * @return key của file trong MinIO
     */
    public String generateAndStore(
            LeaveRequest leave,
            String employeeName,
            String employeeCode,
            String departmentName,
            String position,
            String deptHeadName,
            String hrOfficerName,
            byte[] employeeSignatureBytes,
            byte[] deptHeadSignatureBytes,
            byte[] hrOfficerSignatureBytes) {

        try {
            byte[] pdfBytes = generate(leave, employeeName, employeeCode, departmentName, position,
                deptHeadName, hrOfficerName,
                employeeSignatureBytes, deptHeadSignatureBytes, hrOfficerSignatureBytes);

            String key = "documents/leave-pdf/" + leave.getId() + ".pdf";
            storageService.uploadBytes(pdfBytes, key, "application/pdf");
            return key;
        } catch (Exception e) {
            log.error("Lỗi sinh PDF đơn nghỉ phép {}: {}", leave.getId(), e.getMessage(), e);
            throw new RuntimeException("Không thể tạo PDF: " + e.getMessage(), e);
        }
    }

    private byte[] generate(
            LeaveRequest leave,
            String employeeName, String employeeCode,
            String departmentName, String position,
            String deptHeadName, String hrOfficerName,
            byte[] empSig, byte[] deptSig, byte[] hrSig) throws Exception {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 60, 60, 60, 60);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // Fonts — dùng font built-in, tiếng Việt cần BaseFont hỗ trợ Unicode
        BaseFont bf;
        BaseFont bfBold;
        try {
            bf     = BaseFont.createFont("fonts/times.ttf",     BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            bfBold = BaseFont.createFont("fonts/timesbd.ttf",   BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        } catch (Exception ex) {
            bf     = BaseFont.createFont(BaseFont.HELVETICA,     BaseFont.CP1252, false);
            bfBold = BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, false);
        }

        Font fontNormal  = new Font(bf,   11, Font.NORMAL);
        Font fontBold    = new Font(bfBold, 11, Font.BOLD);
        Font fontTitle   = new Font(bfBold, 13, Font.BOLD);
        Font fontSmall   = new Font(bf,   9,  Font.NORMAL);
        Font fontSmallB  = new Font(bfBold, 9, Font.BOLD);
        Color headerColor = new Color(0, 84, 166);

        // ── Header bệnh viện ──────────────────────────────────────────
        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{1, 1});

        PdfPCell leftHeader = new PdfPCell();
        leftHeader.setBorder(Rectangle.NO_BORDER);
        leftHeader.addElement(phrase("SỞ Y TẾ NGHỆ AN", fontSmallB));
        Paragraph hospitalName = new Paragraph("BỆNH VIỆN HỮU NGHỊ ĐA KHOA NGHỆ AN", new Font(bfBold, 10, Font.BOLD));
        hospitalName.setAlignment(Element.ALIGN_CENTER);
        leftHeader.addElement(hospitalName);
        Paragraph underline = new Paragraph("────────────────────", fontSmall);
        underline.setAlignment(Element.ALIGN_CENTER);
        leftHeader.addElement(underline);
        header.addCell(leftHeader);

        PdfPCell rightHeader = new PdfPCell();
        rightHeader.setBorder(Rectangle.NO_BORDER);
        rightHeader.addElement(phrase("CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM", new Font(bfBold, 10, Font.BOLD)));
        rightHeader.addElement(phrase("Độc lập - Tự do - Hạnh phúc", fontSmall));
        rightHeader.addElement(phrase("────────────────────", fontSmall));
        rightHeader.setHorizontalAlignment(Element.ALIGN_CENTER);
        header.addCell(rightHeader);
        doc.add(header);

        doc.add(Chunk.NEWLINE);

        // ── Tiêu đề ──────────────────────────────────────────────────
        Paragraph title = new Paragraph("ĐƠN XIN NGHỈ PHÉP", fontTitle);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);
        doc.add(Chunk.NEWLINE);

        // ── Thông tin nhân viên ───────────────────────────────────────
        doc.add(para("Kính gửi: Ban Giám đốc Bệnh viện Hữu Nghị Đa Khoa Nghệ An", fontNormal));
        doc.add(Chunk.NEWLINE);

        doc.add(infoLine("Họ và tên:", employeeName, fontNormal, fontBold));
        doc.add(infoLine("Mã cán bộ:", employeeCode, fontNormal, fontBold));
        doc.add(infoLine("Chức vụ:", position != null ? position : "—", fontNormal, fontNormal));
        doc.add(infoLine("Đơn vị:", departmentName != null ? departmentName : "—", fontNormal, fontNormal));
        doc.add(Chunk.NEWLINE);

        // ── Nội dung đơn ─────────────────────────────────────────────
        String leaveTypeLabel = LEAVE_TYPE_LABELS.getOrDefault(leave.getLeaveType(), leave.getLeaveType().name());
        doc.add(infoLine("Loại nghỉ phép:", leaveTypeLabel, fontNormal, fontNormal));
        doc.add(infoLine("Từ ngày:", leave.getStartDate().format(DATE_FMT), fontNormal, fontNormal));
        doc.add(infoLine("Đến ngày:", leave.getEndDate().format(DATE_FMT), fontNormal, fontNormal));
        doc.add(infoLine("Số ngày nghỉ:", leave.getTotalDays().toPlainString() + " ngày", fontNormal, fontBold));

        if (leave.getReason() != null && !leave.getReason().isBlank()) {
            doc.add(infoLine("Lý do:", leave.getReason(), fontNormal, fontNormal));
        }

        doc.add(Chunk.NEWLINE);
        doc.add(para("Kính đề nghị Ban Giám đốc và các đơn vị liên quan xem xét, chấp thuận.", fontNormal));
        doc.add(Chunk.NEWLINE);
        doc.add(Chunk.NEWLINE);

        // ── Bảng 3 chữ ký ────────────────────────────────────────────
        PdfPTable sigTable = new PdfPTable(3);
        sigTable.setWidthPercentage(100);
        sigTable.setWidths(new float[]{1, 1, 1});

        addSignatureCell(sigTable, "NGƯỜI ĐỀ NGHỊ", employeeName, empSig, fontSmallB, fontSmall);
        addSignatureCell(sigTable, "TRƯỞNG KHOA/PHÒNG", deptHeadName, deptSig, fontSmallB, fontSmall);
        addSignatureCell(sigTable, "P. TỔ CHỨC CÁN BỘ", hrOfficerName, hrSig, fontSmallB, fontSmall);

        doc.add(sigTable);

        // ── Footer ngày tháng ─────────────────────────────────────────
        doc.add(Chunk.NEWLINE);
        String today = leave.getHrApprovedAt() != null
            ? "Ngày " + leave.getHrApprovedAt().getDayOfMonth()
              + " tháng " + leave.getHrApprovedAt().getMonthValue()
              + " năm " + leave.getHrApprovedAt().getYear()
            : "";
        Paragraph dateLine = new Paragraph("Nghệ An, " + today, fontSmall);
        dateLine.setAlignment(Element.ALIGN_RIGHT);
        doc.add(dateLine);

        doc.close();
        return out.toByteArray();
    }

    private void addSignatureCell(PdfPTable table, String title, String name,
                                   byte[] sigBytes, Font titleFont, Font nameFont) throws Exception {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(8);

        Paragraph t = new Paragraph(title, titleFont);
        t.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(t);

        Paragraph sub = new Paragraph("(Ký và ghi rõ họ tên)", new Font(nameFont.getBaseFont(), 8, Font.ITALIC));
        sub.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(sub);

        // Ảnh chữ ký
        if (sigBytes != null && sigBytes.length > 0) {
            try {
                Image sig = Image.getInstance(sigBytes);
                sig.scaleToFit(120, 50);
                sig.setAlignment(Element.ALIGN_CENTER);
                cell.addElement(sig);
            } catch (Exception ignored) {}
        } else {
            // Khoảng trống cho chữ ký tay
            cell.addElement(new Paragraph("\n\n\n", nameFont));
        }

        Paragraph namePara = new Paragraph(name != null ? name : "", nameFont);
        namePara.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(namePara);

        table.addCell(cell);
    }

    private Paragraph phrase(String text, Font font) {
        return new Paragraph(text, font);
    }

    private Paragraph para(String text, Font font) {
        return new Paragraph(text, font);
    }

    private Paragraph infoLine(String label, String value, Font labelFont, Font valueFont) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label + " ", labelFont));
        p.add(new Chunk(value, valueFont));
        return p;
    }
}
