package com.project.exe.common.exception;

import com.project.exe.common.dto.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleNotFound_returns404AndFailResponse() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Task", 1L);
        ResponseEntity<ApiResponse<Void>> res = handler.handleNotFound(ex);
        assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
        assertNotNull(res.getBody());
        assertFalse(res.getBody().isSuccess());
        assertEquals("Task not found: 1", res.getBody().getMessage());
        assertEquals("NOT_FOUND", res.getBody().getErrorCode());
    }

    @Test
    void handleBadRequest_returns400AndErrorCode() {
        BadRequestException ex = new BadRequestException("Invalid", "BAD_REQUEST");
        ResponseEntity<ApiResponse<Void>> res = handler.handleBadRequest(ex);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Invalid", res.getBody().getMessage());
        assertEquals("BAD_REQUEST", res.getBody().getErrorCode());
    }

    @Test
    void handleUnauthorized_returns401() {
        UnauthorizedException ex = new UnauthorizedException("Not logged in");
        ResponseEntity<ApiResponse<Void>> res = handler.handleUnauthorized(ex);
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Not logged in", res.getBody().getMessage());
    }

    @Test
    void handleForbidden_returns403() {
        ForbiddenException ex = new ForbiddenException("Forbidden");
        ResponseEntity<ApiResponse<Void>> res = handler.handleForbidden(ex);
        assertEquals(HttpStatus.FORBIDDEN, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Forbidden", res.getBody().getMessage());
    }

    @Test
    void handleConflict_returns409() {
        ConflictException ex = new ConflictException("Already exists");
        ResponseEntity<ApiResponse<Void>> res = handler.handleConflict(ex);
        assertEquals(HttpStatus.CONFLICT, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Already exists", res.getBody().getMessage());
    }

    @Test
    void handleValidation_returns400AndValidationFailed() {
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.getFieldErrors()).thenReturn(
            List.of(new FieldError("dto", "title", "must not be blank")));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse<Void>> res = handler.handleValidation(ex);
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertNotNull(res.getBody());
        assertTrue(res.getBody().getMessage().contains("title"));
        assertEquals("VALIDATION_FAILED", res.getBody().getErrorCode());
    }

    @Test
    void handleException_returns500AndInternalError() {
        Exception ex = new RuntimeException("Unexpected");
        ResponseEntity<ApiResponse<Void>> res = handler.handleException(ex);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, res.getStatusCode());
        assertNotNull(res.getBody());
        assertEquals("Unexpected", res.getBody().getMessage());
        assertEquals("INTERNAL_ERROR", res.getBody().getErrorCode());
    }
}
