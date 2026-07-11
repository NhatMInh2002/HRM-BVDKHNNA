package vn.hrm.shared.pdf;

import com.lowagie.text.Font;
import com.lowagie.text.pdf.BaseFont;

import java.awt.Color;
import java.io.InputStream;

/**
 * Nguồn font Unicode dùng chung cho mọi PDF (phiếu lương, sơ yếu lý lịch HS02-VC,
 * đơn nghỉ phép...). Font Liberation Serif được <b>nhúng làm classpath resource</b>
 * trong shared-kernel nên luôn có sẵn khi chạy — không phụ thuộc font cài trên máy
 * chủ. Liberation Serif tương thích metric Times New Roman và phủ đủ dấu tiếng Việt
 * (Latin Extended Additional) + ký hiệu đồng ₫.
 *
 * <p>BaseFont được nạp một lần và cache tĩnh (thread-safe, OpenPDF cho phép dùng lại
 * một BaseFont trên nhiều Document/luồng).
 */
public final class PdfFonts {

    private PdfFonts() {}

    private static final String REGULAR = "/fonts/LiberationSerif-Regular.ttf";
    private static final String BOLD    = "/fonts/LiberationSerif-Bold.ttf";
    private static final String ITALIC  = "/fonts/LiberationSerif-Italic.ttf";

    private static final BaseFont BF_REGULAR = load(REGULAR, BaseFont.HELVETICA);
    private static final BaseFont BF_BOLD    = load(BOLD,    BaseFont.HELVETICA_BOLD);
    private static final BaseFont BF_ITALIC  = load(ITALIC,  BaseFont.HELVETICA_OBLIQUE);

    /** BaseFont thường — dùng để tạo {@link Font} với cỡ/màu tùy ý. */
    public static BaseFont baseRegular() { return BF_REGULAR; }

    /** BaseFont đậm. */
    public static BaseFont baseBold() { return BF_BOLD; }

    /** BaseFont nghiêng. */
    public static BaseFont baseItalic() { return BF_ITALIC; }

    public static Font regular(float size) { return new Font(BF_REGULAR, size); }

    public static Font regular(float size, Color color) {
        return new Font(BF_REGULAR, size, Font.NORMAL, color);
    }

    public static Font bold(float size) { return new Font(BF_BOLD, size); }

    public static Font bold(float size, Color color) {
        return new Font(BF_BOLD, size, Font.NORMAL, color);
    }

    public static Font italic(float size) { return new Font(BF_ITALIC, size, Font.ITALIC); }

    public static Font italic(float size, Color color) {
        return new Font(BF_ITALIC, size, Font.ITALIC, color);
    }

    /**
     * Nạp font TTF từ classpath vào bộ nhớ với mã hóa IDENTITY_H (Unicode) và nhúng
     * hẳn vào PDF. Nếu vì lý do nào đó không đọc được resource, lùi về font built-in
     * tương ứng (mất dấu tiếng Việt nhưng không làm hỏng luồng xuất PDF).
     */
    private static BaseFont load(String resource, String builtinFallback) {
        try (InputStream in = PdfFonts.class.getResourceAsStream(resource)) {
            if (in == null) {
                return BaseFont.createFont(builtinFallback, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            }
            byte[] bytes = in.readAllBytes();
            // Đọc từ mảng byte trong bộ nhớ — không cần file trên đĩa.
            return BaseFont.createFont(resource, BaseFont.IDENTITY_H, BaseFont.EMBEDDED,
                    BaseFont.CACHED, bytes, null);
        } catch (Exception e) {
            try {
                return BaseFont.createFont(builtinFallback, BaseFont.CP1252, BaseFont.NOT_EMBEDDED);
            } catch (Exception ignored) {
                throw new IllegalStateException("Không nạp được font PDF: " + resource, e);
            }
        }
    }
}
