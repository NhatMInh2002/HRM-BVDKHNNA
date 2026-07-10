package vn.hrm.shared.pdf;

import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Bảo đảm font Unicode nhúng trong classpath render đúng dấu tiếng Việt.
 * Nếu ai đó xóa/đổi tên file font, test này sẽ đỏ trước khi PDF thật bị vỡ dấu
 * trên máy chủ bệnh viện.
 */
class PdfFontsTest {

    private static final String VN =
        "Phiếu lương — Sơ yếu lý lịch viên chức: ệ ữ ấ ọ ỷ Đ 12.345.678 ₫";

    @Test
    void embeddedFont_rendersVietnameseDiacritics() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4);
        PdfWriter.getInstance(doc, out);
        doc.open();
        doc.add(new Paragraph(VN, PdfFonts.regular(12)));
        doc.add(new Paragraph(VN, PdfFonts.bold(12)));
        doc.add(new Paragraph(VN, PdfFonts.italic(12)));
        doc.close();

        byte[] pdf = out.toByteArray();
        assertTrue(pdf.length > 2000, "PDF phải được sinh ra với nội dung");

        String text = new PdfTextExtractor(new PdfReader(pdf)).getTextFromPage(1);
        assertTrue(text.contains("Sơ yếu lý lịch viên chức"),
            "Chuỗi tiếng Việt có dấu phải trích xuất được nguyên vẹn");
        assertTrue(text.contains("ệ ữ ấ ọ ỷ"),
            "Các nguyên âm có dấu phải hiển thị đúng, không bị rỗng");
        assertTrue(text.contains("₫"), "Ký hiệu đồng ₫ phải hiển thị đúng");
    }

    @Test
    void baseFonts_areLoaded() {
        assertTrue(PdfFonts.baseRegular() != null);
        assertTrue(PdfFonts.baseBold() != null);
        assertTrue(PdfFonts.baseItalic() != null);
    }
}
