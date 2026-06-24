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

    public static HrmException notFound(String errorCode, String message) {
        return new HrmException(errorCode, message, HttpStatus.NOT_FOUND);
    }

    public static HrmException badRequest(String errorCode, String message) {
        return new HrmException(errorCode, message, HttpStatus.BAD_REQUEST);
    }

    public static HrmException forbidden(String message) {
        return new HrmException("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }
}
