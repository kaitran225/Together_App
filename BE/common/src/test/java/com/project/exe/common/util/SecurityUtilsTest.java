package com.project.exe.common.util;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SecurityUtilsTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserSso_emptyWhenNoAuth() {
        Optional<String> sso = SecurityUtils.getCurrentUserSso();
        assertTrue(sso.isEmpty());
        assertFalse(SecurityUtils.isAuthenticated());
    }

    @Test
    void getCurrentUserSso_returnsSubjectWhenJwtPresent() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("user-sso-1");
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals(Optional.of("user-sso-1"), SecurityUtils.getCurrentUserSso());
        assertEquals("user-sso-1", SecurityUtils.getCurrentUserSsoOrNull());
        assertTrue(SecurityUtils.isAuthenticated());
    }

    @Test
    void requireCurrentUserSso_throwsWhenNoJwt() {
        assertThrows(IllegalStateException.class, SecurityUtils::requireCurrentUserSso);
    }

    @Test
    void requireCurrentUserSso_returnsSubjectWhenJwtPresent() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("sso-2");
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertEquals("sso-2", SecurityUtils.requireCurrentUserSso());
    }

    @Test
    void getCurrentUserInfo_anonymousWhenNoJwt() {
        SecurityUtils.CurrentUserInfo info = SecurityUtils.getCurrentUserInfo();
        assertNotNull(info);
        assertFalse(info.isAuthenticated());
        assertEquals(null, info.getUserSso());
        assertTrue(info.getClaims().isEmpty());
    }

    @Test
    void getCurrentUserInfo_populatedWhenJwtPresent() {
        Jwt jwt = mock(Jwt.class);
        when(jwt.getSubject()).thenReturn("sso-3");
        when(jwt.getClaimAsString("email")).thenReturn("a@b.com");
        when(jwt.getClaims()).thenReturn(Map.of("sub", "sso-3", "email", "a@b.com"));
        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(jwt);
        SecurityContextHolder.getContext().setAuthentication(auth);

        SecurityUtils.CurrentUserInfo info = SecurityUtils.getCurrentUserInfo();
        assertTrue(info.isAuthenticated());
        assertEquals("sso-3", info.getUserSso());
        assertEquals("a@b.com", info.getEmail());
        assertEquals(2, info.getClaims().size());
    }
}
