package vn.hrm.attendance.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
        Authentication auth
    ) {
        return ApiResponse.ok(leaveService.createLeaveRequest(dto, auth.getName()));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<LeaveRequestResponse>> getMyLeaveRequests(
        @RequestParam UUID employeeId
    ) {
        return ApiResponse.ok(leaveService.getMyLeaveRequests(employeeId));
    }

    // Duyệt/từ chối đơn nghỉ phép: xem LeaveApprovalController (2 cấp — trưởng
    // khoa/phòng rồi TCCB, đúng quy trình "Giấy xin phép" trên iOffice). Các
    // endpoint duyệt 1 bước từng có ở đây đã bị xoá vì cho phép bỏ qua bước
    // lãnh đạo khoa/phòng ký duyệt.
}
