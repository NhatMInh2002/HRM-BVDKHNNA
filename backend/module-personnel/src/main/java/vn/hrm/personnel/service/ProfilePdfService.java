package vn.hrm.personnel.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import vn.hrm.personnel.dto.EmployeeProfileDto;
import vn.hrm.personnel.dto.EmployeeProfileDto.*;
import vn.hrm.shared.pdf.PdfFonts;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Xuất Sơ yếu lý lịch viên chức — mẫu HS02-VC/BNV (Thông tư 07/2019/TT-BNV).
 * Dùng lại kỹ thuật font Unicode tiếng Việt của PayslipPdfService.
 */
@Service
@RequiredArgsConstructor
public class ProfilePdfService {

    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final EmployeeProfileService profileService;
    private final JdbcTemplate jdbc;

    private BaseFont bf, bfBold;
    private Font h1, h2, section, label, value, valueBold, small, italic;

    public byte[] generate(UUID employeeId) throws Exception {
        Map<String, Object> e = jdbc.queryForMap("""
            SELECT e.full_name, e.employee_code, e.gender, e.date_of_birth, e.national_id,
                   e.phone, e.email, e.ethnicity, e.religion, e.hometown, e.address,
                   e.position, e.join_date, e.status, d.name AS dept_name
            FROM personnel.employees e
            LEFT JOIN personnel.departments d ON d.id = e.department_id
            WHERE e.id = ?""", employeeId);

        EmployeeProfileDto p = profileService.get(employeeId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 42, 42, 46, 46);
        PdfWriter.getInstance(doc, out);
        doc.open();
        initFonts();

        // ── Quốc hiệu ──
        Paragraph quocHieu = new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", h2);
        quocHieu.setAlignment(Element.ALIGN_CENTER);
        doc.add(quocHieu);
        Paragraph tieuNgu = new Paragraph("Độc lập - Tự do - Hạnh phúc", new Font(bfBold, 11));
        tieuNgu.setAlignment(Element.ALIGN_CENTER);
        tieuNgu.setSpacingAfter(4);
        doc.add(tieuNgu);
        Paragraph line = new Paragraph("―――――――――", small);
        line.setAlignment(Element.ALIGN_CENTER);
        line.setSpacingAfter(10);
        doc.add(line);

        Paragraph mauSo = new Paragraph("Mẫu HS02-VC/BNV", italic);
        mauSo.setAlignment(Element.ALIGN_RIGHT);
        doc.add(mauSo);

        Paragraph title = new Paragraph("SƠ YẾU LÝ LỊCH VIÊN CHỨC", h1);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingBefore(6);
        title.setSpacingAfter(12);
        doc.add(title);

        // ── I. Thông tin chung ──
        doc.add(sectionHeader("I. THÔNG TIN CHUNG"));
        PdfPTable info = twoCol();
        kv(info, "Họ và tên khai sinh:", str(e.get("full_name")));
        kv(info, "Mã viên chức:", str(e.get("employee_code")));
        kv(info, "Giới tính:", genderVn(str(e.get("gender"))));
        kv(info, "Ngày sinh:", date(e.get("date_of_birth")));
        kv(info, "Nơi sinh:", nz(p.birthPlace()));
        kv(info, "Quê quán:", str(e.get("hometown")));
        kv(info, "Dân tộc:", str(e.get("ethnicity")));
        kv(info, "Tôn giáo:", str(e.get("religion")));
        kv(info, "Số CCCD:", str(e.get("national_id")));
        kv(info, "Ngày cấp:", date(p.nationalIdIssueDate()));
        kv(info, "Nơi cấp CCCD:", nz(p.nationalIdIssuePlace()));
        kv(info, "Số sổ BHXH:", nz(p.socialInsuranceNo()));
        kv(info, "Điện thoại:", str(e.get("phone")));
        kv(info, "Email:", str(e.get("email")));
        kv(info, "Nơi ở hiện nay:", str(e.get("address")));
        kv(info, "Thành phần gia đình:", nz(p.familyOrigin()));
        kv(info, "Nghề nghiệp trước tuyển dụng:", nz(p.jobBeforeRecruitment()));
        kv(info, "Ngày tuyển dụng:", date(p.recruitmentDate()));
        kv(info, "Cơ quan tuyển dụng:", nz(p.recruitmentAgency()));
        kv(info, "Ngày vào cơ quan hiện tại:", date(e.get("join_date")));
        doc.add(info);

        // ── II. Chức danh, ngạch bậc, trình độ ──
        doc.add(sectionHeader("II. CHỨC DANH NGHỀ NGHIỆP - NGẠCH BẬC - TRÌNH ĐỘ"));
        PdfPTable prof = twoCol();
        kv(prof, "Chức vụ hiện tại:", str(e.get("position")));
        kv(prof, "Đơn vị công tác:", str(e.get("dept_name")));
        kv(prof, "Mã ngạch/CDNN:", nz(p.ngachCode()));
        kv(prof, "Bậc lương:", p.salaryGrade() != null ? String.valueOf(p.salaryGrade()) : "");
        kv(prof, "Hệ số lương:", p.salaryCoefficient() != null ? p.salaryCoefficient().toPlainString() : "");
        kv(prof, "Ngày hưởng:", date(p.salaryEffectiveDate()));
        kv(prof, "Giáo dục phổ thông:", nz(p.educationGeneral()));
        kv(prof, "Trình độ chuyên môn:", nz(p.professionalDegree()));
        kv(prof, "Lý luận chính trị:", nz(p.politicalTheory()));
        kv(prof, "Quản lý nhà nước:", nz(p.stateManagement()));
        kv(prof, "Ngoại ngữ:", nz(p.foreignLanguage()));
        kv(prof, "Tin học:", nz(p.informaticsLevel()));
        doc.add(prof);

        // ── III. Chính trị - Xã hội - Sức khỏe ──
        doc.add(sectionHeader("III. CHÍNH TRỊ - XÃ HỘI - SỨC KHỎE"));
        PdfPTable pol = twoCol();
        kv(pol, "Ngày vào Đảng:", date(p.partyJoinDate()));
        kv(pol, "Ngày chính thức:", date(p.partyOfficialDate()));
        kv(pol, "Ngày vào Đoàn/tổ chức CT-XH:", date(p.youthUnionJoinDate()));
        kv(pol, "Nhập ngũ:", date(p.militaryServiceFrom()));
        kv(pol, "Xuất ngũ:", date(p.militaryServiceTo()));
        kv(pol, "Thương binh hạng:", nz(p.warInvalidClass()));
        kv(pol, "Gia đình chính sách:", nz(p.policyFamilyType()));
        kv(pol, "Tình trạng sức khỏe:", nz(p.healthStatus()));
        kv(pol, "Chiều cao (cm):", p.heightCm() != null ? String.valueOf(p.heightCm()) : "");
        kv(pol, "Cân nặng (kg):", p.weightKg() != null ? String.valueOf(p.weightKg()) : "");
        kv(pol, "Nhóm máu:", nz(p.bloodType()));
        doc.add(pol);

        // ── IV. Quá trình đào tạo ──
        doc.add(sectionHeader("IV. QUÁ TRÌNH ĐÀO TẠO, BỒI DƯỠNG"));
        if (isEmpty(p.trainings())) {
            doc.add(emptyNote());
        } else {
            PdfPTable t = gridTable(new float[]{2.2f, 3.2f, 2.4f, 1.8f, 2.4f},
                    "Thời gian", "Cơ sở đào tạo", "Chuyên ngành", "Hình thức", "Văn bằng/CC");
            for (TrainingDto tr : p.trainings()) {
                cellBody(t, range(tr.fromDate(), tr.toDate()));
                cellBody(t, nz(tr.institution()));
                cellBody(t, nz(tr.field()));
                cellBody(t, nz(tr.form()));
                cellBody(t, nz(tr.degree()));
            }
            doc.add(t);
        }

        // ── V. Quá trình công tác ──
        doc.add(sectionHeader("V. QUÁ TRÌNH CÔNG TÁC"));
        if (isEmpty(p.workHistory())) {
            doc.add(emptyNote());
        } else {
            PdfPTable t = gridTable(new float[]{2.4f, 4.5f, 3.5f, 2f},
                    "Thời gian", "Đơn vị công tác", "Chức vụ/Công việc", "Ghi chú");
            for (WorkHistoryDto w : p.workHistory()) {
                cellBody(t, range(w.fromDate(), w.toDate()));
                cellBody(t, nz(w.unit()));
                cellBody(t, nz(w.position()));
                cellBody(t, nz(w.note()));
            }
            doc.add(t);
        }

        // ── VI. Khen thưởng / Kỷ luật ──
        doc.add(sectionHeader("VI. KHEN THƯỞNG - KỶ LUẬT"));
        List<AwardDto> awards = p.awards();
        List<AwardDto> khenThuong = awards == null ? List.of()
                : awards.stream().filter(a -> !"DISCIPLINE".equals(a.type())).toList();
        List<AwardDto> kyLuat = awards == null ? List.of()
                : awards.stream().filter(a -> "DISCIPLINE".equals(a.type())).toList();

        doc.add(subLabel("1. Khen thưởng"));
        if (khenThuong.isEmpty()) doc.add(emptyNote());
        else doc.add(awardTable(khenThuong));

        doc.add(subLabel("2. Kỷ luật"));
        if (kyLuat.isEmpty()) doc.add(emptyNote());
        else doc.add(awardTable(kyLuat));

        // ── VII. Quan hệ gia đình ──
        doc.add(sectionHeader("VII. QUAN HỆ GIA ĐÌNH"));
        List<FamilyRelationDto> family = p.familyRelations();
        List<FamilyRelationDto> self = family == null ? List.of()
                : family.stream().filter(f -> !"SPOUSE".equals(f.side())).toList();
        List<FamilyRelationDto> spouse = family == null ? List.of()
                : family.stream().filter(f -> "SPOUSE".equals(f.side())).toList();

        doc.add(subLabel("1. Bên bản thân (cha, mẹ, vợ/chồng, con, anh chị em ruột)"));
        if (self.isEmpty()) doc.add(emptyNote());
        else doc.add(familyTable(self));

        doc.add(subLabel("2. Bên vợ/chồng"));
        if (spouse.isEmpty()) doc.add(emptyNote());
        else doc.add(familyTable(spouse));

        // ── Đặc điểm & hoàn cảnh ──
        if (notBlank(p.personalHistory())) {
            doc.add(sectionHeader("VIII. ĐẶC ĐIỂM LỊCH SỬ BẢN THÂN"));
            doc.add(new Paragraph(p.personalHistory(), value));
        }
        if (notBlank(p.familyEconomy())) {
            doc.add(sectionHeader("IX. HOÀN CẢNH KINH TẾ GIA ĐÌNH"));
            doc.add(new Paragraph(p.familyEconomy(), value));
        }

        // ── Cam đoan & chữ ký ──
        Paragraph cam = new Paragraph(
                "Tôi xin cam đoan những lời khai trên đây là đúng sự thật và chịu trách nhiệm về lời khai của mình.",
                italic);
        cam.setSpacingBefore(14);
        doc.add(cam);

        PdfPTable sign = new PdfPTable(2);
        sign.setWidthPercentage(100);
        sign.setSpacingBefore(12);
        PdfPCell left = new PdfPCell(new Phrase("XÁC NHẬN CỦA CƠ QUAN\n(Ký, ghi rõ họ tên, đóng dấu)", small));
        PdfPCell right = new PdfPCell(new Phrase(
                "Nghệ An, ngày " + LocalDate.now().getDayOfMonth()
                        + " tháng " + LocalDate.now().getMonthValue()
                        + " năm " + LocalDate.now().getYear()
                        + "\nNGƯỜI KHAI\n(Ký, ghi rõ họ tên)", small));
        left.setBorder(Rectangle.NO_BORDER);
        right.setBorder(Rectangle.NO_BORDER);
        left.setHorizontalAlignment(Element.ALIGN_CENTER);
        right.setHorizontalAlignment(Element.ALIGN_CENTER);
        left.setPaddingTop(6);
        right.setPaddingTop(6);
        sign.addCell(left);
        sign.addCell(right);
        doc.add(sign);

        doc.close();
        return out.toByteArray();
    }

    // ── Bảng con ──

    private PdfPTable awardTable(List<AwardDto> list) {
        PdfPTable t = gridTable(new float[]{1.2f, 4.5f, 2.3f, 2.5f},
                "Năm", "Danh hiệu / Hình thức", "Số quyết định", "Cấp quyết định");
        for (AwardDto a : list) {
            cellBody(t, a.year() != null ? String.valueOf(a.year()) : "");
            cellBody(t, nz(a.title()));
            cellBody(t, nz(a.decisionNo()));
            cellBody(t, nz(a.level()));
        }
        return t;
    }

    private PdfPTable familyTable(List<FamilyRelationDto> list) {
        PdfPTable t = gridTable(new float[]{1.8f, 3f, 1.4f, 4f},
                "Quan hệ", "Họ và tên", "Năm sinh", "Nghề nghiệp / Nơi ở hiện nay");
        for (FamilyRelationDto f : list) {
            cellBody(t, nz(f.relation()));
            cellBody(t, nz(f.fullName()));
            cellBody(t, f.birthYear() != null ? String.valueOf(f.birthYear()) : "");
            cellBody(t, nz(f.detail()));
        }
        return t;
    }

    // ── Khung dựng bảng/ô ──

    private void initFonts() {
        bf = PdfFonts.baseRegular();
        bfBold = PdfFonts.baseBold();
        h1 = new Font(bfBold, 15, Font.NORMAL, Color.decode("#1e3a5f"));
        h2 = new Font(bfBold, 12);
        section = new Font(bfBold, 11, Font.NORMAL, Color.decode("#1e40af"));
        label = new Font(bf, 9.5f, Font.NORMAL, Color.DARK_GRAY);
        value = new Font(bf, 9.5f);
        valueBold = new Font(bfBold, 9.5f);
        small = new Font(bf, 9);
        italic = PdfFonts.italic(9);
    }

    private Paragraph sectionHeader(String text) {
        Paragraph p = new Paragraph(text, section);
        p.setSpacingBefore(11);
        p.setSpacingAfter(5);
        return p;
    }

    private Paragraph subLabel(String text) {
        Paragraph p = new Paragraph(text, italic);
        p.setSpacingBefore(5);
        p.setSpacingAfter(3);
        return p;
    }

    private Paragraph emptyNote() {
        Paragraph p = new Paragraph("(Chưa có dữ liệu)", italic);
        p.setSpacingAfter(3);
        return p;
    }

    private PdfPTable twoCol() {
        PdfPTable t = new PdfPTable(new float[]{1.6f, 2.4f, 1.6f, 2.4f});
        t.setWidthPercentage(100);
        t.setSpacingAfter(3);
        return t;
    }

    private void kv(PdfPTable t, String k, String v) {
        PdfPCell ck = new PdfPCell(new Phrase(k, label));
        ck.setBorder(Rectangle.NO_BORDER);
        ck.setPaddingBottom(3);
        PdfPCell cv = new PdfPCell(new Phrase(v != null ? v : "", valueBold));
        cv.setBorder(Rectangle.BOTTOM);
        cv.setBorderColor(Color.decode("#e2e8f0"));
        cv.setPaddingBottom(3);
        t.addCell(ck);
        t.addCell(cv);
    }

    private PdfPTable gridTable(float[] widths, String... headers) {
        PdfPTable t = new PdfPTable(widths);
        t.setWidthPercentage(100);
        t.setSpacingBefore(2);
        t.setSpacingAfter(4);
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, new Font(bfBold, 9, Font.NORMAL, Color.WHITE)));
            c.setBackgroundColor(Color.decode("#1e40af"));
            c.setPadding(4);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            t.addCell(c);
        }
        return t;
    }

    private void cellBody(PdfPTable t, String text) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", small));
        c.setPadding(4);
        t.addCell(c);
    }

    // ── Helpers ──

    private String range(LocalDate a, LocalDate b) {
        String s = a != null ? a.format(DMY) : "…";
        String e = b != null ? b.format(DMY) : "nay";
        return s + " - " + e;
    }

    private String date(Object o) {
        if (o == null) return "";
        if (o instanceof java.sql.Date d) return d.toLocalDate().format(DMY);
        if (o instanceof LocalDate d) return d.format(DMY);
        return o.toString();
    }

    private String genderVn(String g) {
        return switch (g == null ? "" : g) {
            case "MALE" -> "Nam";
            case "FEMALE" -> "Nữ";
            default -> g;
        };
    }

    private String str(Object v) { return v != null ? v.toString() : ""; }
    private String nz(String v) { return v != null ? v : ""; }
    private boolean notBlank(String v) { return v != null && !v.isBlank(); }
    private boolean isEmpty(List<?> l) { return l == null || l.isEmpty(); }
}
