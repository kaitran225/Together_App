package app.together.common.shared.constant;

/** Machine-readable API error codes (stable for clients). */
public final class ErrorCodes {

    private ErrorCodes() {}

    // Generic Error Codes
    public static final String BAD_REQUEST = "BAD_REQUEST";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String PERMISSION_DENIED = "PERMISSION_DENIED";
    public static final String CONFLICT = "CONFLICT";
    public static final String VALIDATION_FAILED = "VALIDATION_FAILED";
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";
    public static final String AI_SERVICE_ERROR = "AI_SERVICE_ERROR";
    public static final String EMAIL_VERIFICATION_INVALID = "EMAIL_VERIFICATION_INVALID";
    public static final String EMAIL_VERIFICATION_ALREADY_USED = "EMAIL_VERIFICATION_ALREADY_USED";
    public static final String EMAIL_VERIFICATION_EXPIRED = "EMAIL_VERIFICATION_EXPIRED";
    public static final String EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS = "EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS";
    public static final String EMAIL_VERIFICATION_NOT_FOUND = "EMAIL_VERIFICATION_NOT_FOUND";
    public static final String INVALID = "INVALID";

    // Authentication Error Codes
    public static final String INVALID_TOKEN = "INVALID_TOKEN";
    public static final String EXPIRED_TOKEN = "EXPIRED_TOKEN";
    public static final String UNAUTHORIZED_TOKEN = "UNAUTHORIZED_TOKEN";
    public static final String FORBIDDEN_TOKEN = "FORBIDDEN_TOKEN";
    public static final String CONFLICT_TOKEN = "CONFLICT_TOKEN";
    public static final String VALIDATION_FAILED_TOKEN = "VALIDATION_FAILED_TOKEN";
    public static final String INTERNAL_ERROR_TOKEN = "INTERNAL_ERROR_TOKEN";
    public static final String AI_SERVICE_ERROR_TOKEN = "AI_SERVICE_ERROR_TOKEN";


    // User Error Codes
    public static final String USER_NOT_FOUND = "USER_NOT_FOUND";
    public static final String USER_INVALID = "USER_INVALID";
    public static final String USER_EMAIL_INVALID = "USER_EMAIL_INVALID";
    public static final String USER_EMAIL_REQUIRED = "USER_EMAIL_REQUIRED";
    public static final String USER_EMAIL_ALREADY_EXISTS = "USER_EMAIL_ALREADY_EXISTS";
    public static final String USER_SSO_REQUIRED = "USER_SSO_REQUIRED";
    public static final String USER_SSO_INVALID = "USER_SSO_INVALID";
    public static final String USER_SSO_ALREADY_EXISTS = "USER_SSO_ALREADY_EXISTS";
    public static final String USER_NOT_ACTIVATED = "USER_NOT_ACTIVATED";
}
