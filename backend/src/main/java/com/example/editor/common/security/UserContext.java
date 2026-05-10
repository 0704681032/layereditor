package com.example.editor.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility to extract the current authenticated user ID from Spring Security context.
 */
public final class UserContext {

    private UserContext() {}

    /**
     * Get the current user's ID from the security context.
     * Falls back to user ID 1 for backward compatibility during migration.
     */
    public static Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return 1L; // TODO: Replace with actual user ID lookup when user management is implemented
        }
        return 1L;
    }
}
