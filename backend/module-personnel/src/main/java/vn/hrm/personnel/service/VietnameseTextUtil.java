package vn.hrm.personnel.service;

import java.text.Normalizer;
import java.util.regex.Pattern;

/** Chuẩn hoá tiếng Việt (bỏ dấu, thường hoá) để so khớp mờ văn bản OCR. */
final class VietnameseTextUtil {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private VietnameseTextUtil() {}

    static String normalize(String s) {
        if (s == null) return "";
        String decomposed = Normalizer.normalize(s, Normalizer.Form.NFD);
        String noDiacritics = DIACRITICS.matcher(decomposed).replaceAll("");
        return noDiacritics.replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase()
                .replaceAll("[^a-z0-9%\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
