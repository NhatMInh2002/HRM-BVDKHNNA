package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.EmployeeDocument;
import vn.hrm.personnel.domain.enums.OcrStatus;
import vn.hrm.personnel.repository.DepartmentRepository;
import vn.hrm.personnel.repository.EmployeeDocumentRepository;
import vn.hrm.shared.port.FileStoragePort;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OCR (Tesseract, chạy on-prem — không gọi cloud) + so khớp hệ số cho hồ sơ
 * TCCB upload. Chỉ tạo GỢI Ý (matched_*): TCCB luôn phải xác nhận trước khi
 * áp dụng vào cấu hình lương — không tự động ghi đè.
 *
 * Yêu cầu hạ tầng: cài `tesseract` + gói ngôn ngữ `vie` trên máy chủ backend.
 * Hiện chỉ hỗ trợ OCR ảnh (jpg/png) — PDF cần chuyển sang ảnh trước (chưa hỗ trợ
 * rasterize PDF trong bản này để tránh thêm dependency poppler/PDFBox).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentOcrService {

    private static final Pattern PERCENT_PATTERN = Pattern.compile("(\\d{1,3})\\s*%");
    private static final List<String> IMAGE_EXTENSIONS = List.of("jpg", "jpeg", "png", "bmp", "tiff", "tif");

    private final FileStoragePort fileStoragePort;
    private final EmployeeDocumentRepository documentRepo;
    private final DepartmentRepository departmentRepo;
    private final JdbcTemplate jdbc;

    @Async
    @Transactional
    public void processAsync(UUID documentId) {
        EmployeeDocument doc = documentRepo.findById(documentId).orElse(null);
        if (doc == null) return;

        try {
            String key = extractKey(doc.getFileUrl());
            byte[] bytes = fileStoragePort.readBytes(key);
            if (bytes == null) {
                doc.setOcrStatus(OcrStatus.FAILED);
                doc.setExtractedText("Không đọc được file từ storage (key=" + key + ")");
                documentRepo.save(doc);
                return;
            }

            String ext = extension(doc.getFileName());
            if (!IMAGE_EXTENSIONS.contains(ext)) {
                doc.setOcrStatus(OcrStatus.SKIPPED);
                doc.setExtractedText("Chưa hỗ trợ OCR trực tiếp cho định dạng ." + ext
                        + " — vui lòng upload dưới dạng ảnh (JPG/PNG) hoặc chuyển đổi PDF sang ảnh trước.");
                documentRepo.save(doc);
                return;
            }

            String text = runTesseract(bytes, ext);
            doc.setExtractedText(text);
            doc.setOcrStatus(OcrStatus.DONE);
            match(doc, text);
            documentRepo.save(doc);

        } catch (Exception e) {
            log.warn("OCR thất bại cho document {}: {}", documentId, e.getMessage());
            doc.setOcrStatus(OcrStatus.FAILED);
            doc.setExtractedText("Lỗi OCR: " + e.getMessage()
                    + " — kiểm tra đã cài `tesseract` + gói ngôn ngữ `vie` trên máy chủ chưa.");
            documentRepo.save(doc);
        }
    }

    private String runTesseract(byte[] bytes, String ext) throws Exception {
        Path tmpIn = Files.createTempFile("hrm-ocr-", "." + ext);
        try {
            Files.copy(new ByteArrayInputStream(bytes), tmpIn, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            ProcessBuilder pb = new ProcessBuilder("tesseract", tmpIn.toString(), "stdout", "-l", "vie");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes());
            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new RuntimeException("Tesseract timeout sau 60s");
            }
            if (process.exitValue() != 0) {
                throw new RuntimeException("Tesseract exit code " + process.exitValue() + ": " + output);
            }
            return output;
        } finally {
            Files.deleteIfExists(tmpIn);
        }
    }

    /** So khớp văn bản OCR với bảng hệ số tương ứng theo doc_type — chỉ gợi ý, không tự áp dụng. */
    private void match(EmployeeDocument doc, String rawText) {
        String text = VietnameseTextUtil.normalize(rawText);

        switch (doc.getDocType()) {
            case APPOINTMENT_DECISION -> matchCoefficientTable(doc, text,
                    "SELECT position_name AS label, coefficient FROM payroll.responsibility_coefficients ORDER BY LENGTH(position_name) DESC");

            case DEGREE_CERTIFICATE, PRACTICE_LICENSE -> matchCoefficientTable(doc, text,
                    "SELECT qualification_name AS label, coefficient FROM payroll.qualification_coefficients ORDER BY LENGTH(qualification_name) DESC");

            case CONCURRENT_DECISION -> matchConcurrentDecision(doc, text);

            case LABOR_CONTRACT, MERIT_RATING, TIMESHEET -> {
                // Chưa có logic so khớp tự động — lưu văn bản OCR để TCCB đọc thủ công.
                doc.setMatchConfidence(null);
            }
        }
    }

    private void matchCoefficientTable(EmployeeDocument doc, String normalizedText, String sql) {
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        for (Map<String, Object> row : rows) {
            String label = (String) row.get("label");
            String normalizedLabel = VietnameseTextUtil.normalize(label);
            // So khớp theo từng cụm từ trong tên (phân tách bởi "/" hoặc ",") — tránh yêu cầu khớp cả câu dài
            for (String part : normalizedLabel.split("[,/]")) {
                String trimmed = part.trim();
                if (trimmed.length() >= 4 && normalizedText.contains(trimmed)) {
                    doc.setMatchedLabel(label);
                    doc.setMatchedCoefficient((BigDecimal) row.get("coefficient"));
                    doc.setMatchConfidence(trimmed.length() >= 8 ? "HIGH" : "LOW");
                    return;
                }
            }
        }
        doc.setMatchConfidence(null);
    }

    private void matchConcurrentDecision(EmployeeDocument doc, String normalizedText) {
        departmentRepo.findAll().stream()
                .filter(d -> d.getCode() == null || !d.getCode().startsWith("GRP-"))
                .filter(d -> {
                    String n = VietnameseTextUtil.normalize(d.getName());
                    return n.length() >= 4 && normalizedText.contains(n);
                })
                .findFirst()
                .ifPresent(d -> {
                    doc.setMatchedDepartmentId(d.getId());
                    doc.setMatchedLabel(d.getName());
                });

        boolean isBsDs = normalizedText.contains("bac si") || normalizedText.contains("duoc si");
        boolean isDdKtv = normalizedText.contains("dieu duong") || normalizedText.contains("ky thuat vien");
        if (isBsDs) doc.setMatchedRoleType("BS_DS");
        else if (isDdKtv) doc.setMatchedRoleType("DD_KTV");

        Matcher m = PERCENT_PATTERN.matcher(normalizedText);
        if (m.find()) {
            doc.setMatchedTimePercent(new BigDecimal(m.group(1)));
        }

        doc.setMatchConfidence(doc.getMatchedDepartmentId() != null && doc.getMatchedRoleType() != null ? "LOW" : null);
    }

    private String extractKey(String fileUrl) {
        int idx = fileUrl.indexOf("key=");
        return idx >= 0 ? fileUrl.substring(idx + 4) : fileUrl;
    }

    private String extension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
