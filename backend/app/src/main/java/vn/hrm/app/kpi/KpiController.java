package vn.hrm.app.kpi;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import java.util.Map;

@RestController
@RequestMapping("/kpi")
@RequiredArgsConstructor
public class KpiController {

    private final KpiService svc;

    // Periods
    @GetMapping("/periods")
    public ResponseEntity<?> periods() {
        return ResponseEntity.ok(ApiResponse.ok(svc.listPeriods()));
    }

    @PostMapping("/periods")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createPeriod(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(svc.createPeriod(body)));
    }

    // Goals
    @GetMapping("/periods/{periodId}/goals")
    public ResponseEntity<?> goals(
            @PathVariable String periodId,
            @RequestParam(required = false) String employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(svc.listGoals(periodId, employeeId)));
    }

    @PostMapping("/goals")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<?> createGoal(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(svc.createGoal(body)));
    }

    @PatchMapping("/goals/{goalId}/score")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<?> updateScore(
            @PathVariable String goalId,
            @RequestBody Map<String, Object> body) {
        svc.updateGoalScore(goalId, body);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // Evaluations
    @GetMapping("/periods/{periodId}/evaluations")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<?> evaluations(@PathVariable String periodId) {
        return ResponseEntity.ok(ApiResponse.ok(svc.listEvaluations(periodId)));
    }

    @GetMapping("/periods/{periodId}/evaluations/{employeeId}")
    public ResponseEntity<?> getEvaluation(
            @PathVariable String periodId,
            @PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(svc.getEvaluation(periodId, employeeId)));
    }

    @PostMapping("/periods/{periodId}/evaluations/{employeeId}")
    public ResponseEntity<?> upsertEvaluation(
            @PathVariable String periodId,
            @PathVariable String employeeId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(svc.upsertEvaluation(periodId, employeeId, body)));
    }

    // Stats
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> stats(@RequestParam(required = false) String periodId) {
        return ResponseEntity.ok(ApiResponse.ok(svc.stats(periodId)));
    }
}
