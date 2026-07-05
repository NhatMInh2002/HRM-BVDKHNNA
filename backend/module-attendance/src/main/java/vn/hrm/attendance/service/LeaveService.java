package vn.hrm.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.attendance.domain.LeaveRequest;
import vn.hrm.attendance.domain.enums.LeaveStatus;
import vn.hrm.attendance.dto.LeaveRequestDto;
import vn.hrm.attendance.dto.LeaveRequestResponse;
import vn.hrm.attendance.repository.LeaveRequestRepository;
import vn.hrm.shared.event.LeaveSubmittedEvent;
import vn.hrm.shared.exception.HrmException;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final ApplicationEventPublisher eventPublisher;

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
            .attachmentUrl(dto.attachmentUrl())
            .attachmentName(dto.attachmentName())
            .status(LeaveStatus.PENDING)
            .createdBy(createdBy)
            .build();

        LeaveRequest saved = leaveRequestRepository.save(request);
        eventPublisher.publishEvent(new LeaveSubmittedEvent(
            saved.getId(), saved.getEmployeeId(), saved.getLeaveType().name(),
            saved.getStartDate(), saved.getEndDate(), saved.getTotalDays().intValue()
        ));
        return LeaveRequestResponse.from(saved);
    }

    public List<LeaveRequestResponse> getMyLeaveRequests(UUID employeeId) {
        return leaveRequestRepository
            .findByEmployeeIdOrderByCreatedAtDesc(employeeId)
            .stream()
            .map(LeaveRequestResponse::from)
            .toList();
    }
}
