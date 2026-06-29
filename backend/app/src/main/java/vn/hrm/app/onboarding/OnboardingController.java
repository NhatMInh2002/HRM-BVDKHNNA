package vn.hrm.app.onboarding;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import java.util.Map;

@RestController
@RequestMapping("/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService svc;

    @GetMapping("/templates")
    public ResponseEntity<?> listTemplates() {
        return ResponseEntity.ok(ApiResponse.success(svc.listTemplates()));
    }

    @GetMapping("/templates/{id}/tasks")
    public ResponseEntity<?> templateTasks(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(svc.listTemplateTasks(id)));
    }

    @GetMapping("/checklists")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<?> listChecklists(@RequestParam(required = false) String employeeId) {
        return ResponseEntity.ok(ApiResponse.success(svc.listChecklists(employeeId)));
    }

    @GetMapping("/checklists/{id}")
    public ResponseEntity<?> getChecklist(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(svc.getChecklist(id)));
    }

    @PostMapping("/checklists")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> createChecklist(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(svc.createChecklist(body)));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<?> updateTask(
            @PathVariable String taskId,
            @RequestParam String status,
            @RequestParam(required = false) String notes,
            @AuthenticationPrincipal UserDetails user) {
        String completedBy = null;
        if (user != null) {
            try {
                var emp = svc.getClass().getDeclaredField("jdbc");
                // completedBy resolved via username if needed
            } catch (Exception ignored) {}
        }
        svc.updateTaskStatus(taskId, status, notes, completedBy);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(ApiResponse.success(svc.stats()));
    }
}
