package app.together.common.email.api;

/**
 * Transactional emails sent via the email service HTTP API.
 */
public enum EmailDispatchType {
    VERIFY_ACCOUNT,
    PASSWORD_RESET,
    TASK_ASSIGNED
}
