package vn.hrm.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveStatus;
import vn.hrm.attendance.dto.LeaveRequestDto;
import vn.hrm.attendance.dto.LeaveRequestResponse;
import vn.hrm.attendance.repository.LeaveRequestRepository;
import vn.hrm.shared.exception.HrmException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;

    @Transactional
    public LeaveRequestResponse createLeaveRequest(LeaveRequestDto dto, String createdBy) {
        if (dto.startDate().isAfter(dto.endDate())) {
            throw HrmException.badRequest("INVALID_DATE_RANGE",
                "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }

        long days = ChronoUnit.DAYS.between(dto.startDate(), dto.endDate()) + 1;

        LeaveRequest request = LeaveRequest.builder()
            .employeeId(dto.employeeId())
            .leaveType(dto.leaveType())
            .startDate(dto.startDate())
            .endDate(dto.endDate())
            .totalDays(BigDecimal.valueOf(days))
            .reason(dto.reason())
            .status(LeaveStatus.PENDING)
            .createdBy(createdBy)
            .build();

        return LeaveRequestResponse.from(leaveRequestRepository.save(request));
    }

    @Transactional
    public LeaveRequestResponse approveLeave(UUID id, String approvedBy) {
        LeaveRequest request = findById(id);
        if (request.getStatus() != LeaveStatus.PENDING) {
            throw HrmException.badRequest("LEAVE_NOT_PENDING",
                "Đơn nghỉ phép không ở trạng thái chờ duyệt");
        }
        request.setStatus(LeaveStatus.APPROVED);
        request.setApprovedBy(approvedBy);
        request.setApprovedAt(OffsetDateTime.now());
        return LeaveRequestResponse.from(leaveRequestRepository.save(request));
    }

    @Transactional
    public LeaveRequestResponse rejectLeave(UUID id, String approvedBy) {
        LeaveRequest request = findById(id);
        if (request.getStatus() != LeaveStatus.PENDING) {
            throw HrmException.badRequest("LEAVE_NOT_PENDING",
                "Đơn nghỉ phép không ở trạng thái chờ duyệt");
        }
        request.setStatus(LeaveStatus.REJECTED);
        request.setApprovedBy(approvedBy);
        request.setApprovedAt(OffsetDateTime.now());
        return LeaveRequestResponse.from(leaveRequestRepository.save(request));
    }

    public List<LeaveRequestResponse> getPendingRequests() {
        return leaveRequestRepository
            .findByStatusOrderByCreatedAtDesc(LeaveStatus.PENDING)
            .stream()
            .map(LeaveRequestResponse::from)
            .toList();
    }

    public List<LeaveRequestResponse> getMyLeaveRequests(UUID employeeId) {
        return leaveRequestRepository
            .findByEmployeeIdOrderByCreatedAtDesc(employeeId)
            .stream()
            .map(LeaveRequestResponse::from)
            .toList();
    }

    private LeaveRequest findById(UUID id) {
        return leaveRequestRepository.findById(id)
            .orElseThrow(() -> HrmException.notFound("LEAVE_NOT_FOUND",
                "Không tìm thấy đơn nghỉ phép: " + id));
    }
}
