package vn.hrm.personnel.domain;

import java.io.Serializable;
import java.util.UUID;

public record EmployeePermissionId(UUID employeeId, String permission) implements Serializable {}
