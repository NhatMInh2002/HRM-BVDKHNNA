package vn.hrm.payroll.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.hrm.payroll.domain.SpecialtyDepartmentMultiplier;
import vn.hrm.payroll.repository.SpecialtyDepartmentMultiplierRepository;
import vn.hrm.shared.dto.ApiResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Quản lý hệ số đặc thù khoa/phòng (%) áp lên hệ số trình độ TNTT.
 * Reference data để UI gợi ý giá trị specialtyMultiplierPercent khi cấu hình
 * TNTT theo từng nhân viên. Mặc định 100% (không phụ trội) đến khi TCCB xác nhận.
 */
@RestController
@RequestMapping("/payroll/specialty-multipliers")
@RequiredArgsConstructor
public class SpecialtyMultiplierController {

    private final SpecialtyDepartmentMultiplierRepository repo;

    public record SpecialtyMultiplierDto(UUID departmentId, BigDecimal percent, String note) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<List<SpecialtyMultiplierDto>>> list() {
        List<SpecialtyMultiplierDto> data = repo.findAll().stream()
                .map(m -> new SpecialtyMultiplierDto(m.getDepartmentId(), m.getPercent(), m.getNote()))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<SpecialtyMultiplierDto>> get(@PathVariable UUID departmentId) {
        return repo.findByDepartmentId(departmentId)
                .map(m -> ResponseEntity.ok(ApiResponse.ok(
                        new SpecialtyMultiplierDto(m.getDepartmentId(), m.getPercent(), m.getNote()))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.ok(
                        new SpecialtyMultiplierDto(departmentId, new BigDecimal("100"), null))));
    }

    @PutMapping("/{departmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<SpecialtyMultiplierDto>> upsert(
            @PathVariable UUID departmentId,
            @RequestBody SpecialtyMultiplierDto dto,
            Authentication auth) {
        SpecialtyDepartmentMultiplier m = repo.findByDepartmentId(departmentId)
                .orElseGet(() -> SpecialtyDepartmentMultiplier.builder().departmentId(departmentId).build());
        m.setPercent(dto.percent() != null ? dto.percent() : new BigDecimal("100"));
        m.setNote(dto.note());
        m.setUpdatedBy(auth.getName());
        SpecialtyDepartmentMultiplier saved = repo.save(m);
        return ResponseEntity.ok(ApiResponse.ok(
                new SpecialtyMultiplierDto(saved.getDepartmentId(), saved.getPercent(), saved.getNote())));
    }
}
