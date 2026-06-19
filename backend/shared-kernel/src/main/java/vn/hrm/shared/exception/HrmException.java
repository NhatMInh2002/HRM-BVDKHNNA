package vn.hrm.shared.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class HrmException extends RuntimeException {
    private final String errorCode;
    private final HttpStatus status;

    public HrmException(String errorCode, String message, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public static HrmException notFound(String resource, Object id) {
        return new HrmException("NOT_FOUND", resource + " không tìm thấy: " + id, HttpStatus.NOT_FOUND);
    }

    public static HrmException badRequest(String message) {
        return new HrmException("BAD_REQUEST", message, HttpStatus.BAD_REQUEST);
    }

    public static HrmException forbidden(String message) {
        return new HrmException("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }
}
