package vn.hrm.attendance.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import vn.hrm.attendance.dto.LeaveRequestDto;
import vn.hrm.attendance.dto.LeaveRequestResponse;
import vn.hrm.attendance.service.LeaveService;
import vn.hrm.shared.dto.ApiResponse;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/attendance/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<LeaveRequestResponse> createLeaveRequest(
        @Valid @RequestBody LeaveRequestDto dto,
        @AuthenticationPrincipal Jwt jwt
    ) {
        String createdBy = resolveUsername(jwt);
        return ApiResponse.ok(leaveService.createLeaveRequest(dto, createdBy));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<List<LeaveRequestResponse>> getPendingRequests() {
        return ApiResponse.ok(leaveService.getPendingRequests());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<LeaveRequestResponse>> getMyLeaveRequests(
        @RequestParam UUID employeeId
    ) {
        return ApiResponse.ok(leaveService.getMyLeaveRequests(employeeId));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<LeaveRequestResponse> approveLeave(
        @PathVariable UUID id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ApiResponse.ok(leaveService.approveLeave(id, resolveUsername(jwt)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<LeaveRequestResponse> rejectLeave(
        @PathVariable UUID id,
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ApiResponse.ok(leaveService.rejectLeave(id, resolveUsername(jwt)));
    }

    private String resolveUsername(Jwt jwt) {
        return jwt.getClaimAsString("preferred_username") != null
            ? jwt.getClaimAsString("preferred_username")
            : jwt.getSubject();
    }
}
