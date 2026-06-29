package vn.hrm.app.recruitment;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recruitment")
@RequiredArgsConstructor
public class RecruitmentController {

    private final RecruitmentService svc;

    // ── Job Postings ─────────────────────────────────────────────────────────

    @GetMapping("/postings")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listPostings(
            @RequestParam(defaultValue = "OPEN") String status) {
        return ResponseEntity.ok(ApiResponse.ok(svc.listPostings(status)));
    }

    @GetMapping("/postings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPosting(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(svc.getPosting(id)));
    }

    @PostMapping("/postings")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createPosting(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(svc.createPosting(body, user.getUsername())));
    }

    @PatchMapping("/postings/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updatePostingStatus(
            @PathVariable String id, @RequestParam String status) {
        svc.updatePostingStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Candidates ────────────────────────────────────────────────────────────

    @GetMapping("/candidates")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listCandidates(
            @RequestParam(required = false) String postingId,
            @RequestParam(required = false) String stage) {
        return ResponseEntity.ok(ApiResponse.ok(svc.listCandidates(postingId, stage)));
    }

    @PostMapping("/candidates")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addCandidate(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(svc.addCandidate(body, user.getUsername())));
    }

    @PatchMapping("/candidates/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> moveStage(
            @PathVariable String id,
            @RequestParam String stage,
            @RequestParam(required = false) String rejectReason) {
        svc.moveStage(id, stage, rejectReason);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Interviews ────────────────────────────────────────────────────────────

    @GetMapping("/candidates/{candidateId}/interviews")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listInterviews(
            @PathVariable String candidateId) {
        return ResponseEntity.ok(ApiResponse.ok(svc.listInterviews(candidateId)));
    }

    @PostMapping("/candidates/{candidateId}/interviews")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> scheduleInterview(
            @PathVariable String candidateId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(svc.scheduleInterview(candidateId, body, user.getUsername())));
    }

    @PatchMapping("/interviews/{id}/result")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updateInterviewResult(
            @PathVariable String id,
            @RequestParam String result,
            @RequestParam(required = false) Integer score,
            @RequestParam(required = false) String notes) {
        svc.updateInterviewResult(id, result, score, notes);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        return ResponseEntity.ok(ApiResponse.ok(svc.stats()));
    }
}
