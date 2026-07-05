package vn.hrm.payroll.dto;

import java.math.BigDecimal;
import java.util.List;

/** Danh mục hệ số tra cứu cho form "Lương tăng thêm" — tránh gõ tay số liệu thô. */
public record IncrementCoefficientOptionsResponse(
        List<CoefficientOption> responsibilityOptions,
        List<CoefficientOption> qualificationOptions,
        List<CoefficientOption> concurrentUnionOptions,
        List<RatingOption> ratingOptions
) {
    public record CoefficientOption(int id, String label, BigDecimal coefficient) {}

    public record RatingOption(String code, String label, BigDecimal percentage) {}
}
