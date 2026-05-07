package com.project.exe.common.util;

/** String helpers. */
public final class StringUtils {

    private StringUtils() {}

    public static boolean isBlank(CharSequence cs) {
        if (cs == null) return true;
        int len = cs.length();
        for (int i = 0; i < len; i++) {
            if (!Character.isWhitespace(cs.charAt(i))) return false;
        }
        return true;
    }

    public static boolean isNotBlank(CharSequence cs) {
        return !isBlank(cs);
    }

    public static boolean isEmpty(CharSequence cs) {
        return cs == null || cs.length() == 0;
    }

    public static boolean isNotEmpty(CharSequence cs) {
        return !isEmpty(cs);
    }

    public static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public static String trimToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    public static String defaultIfBlank(String s, String defaultVal) {
        return isBlank(s) ? defaultVal : s;
    }

    public static String defaultIfEmpty(String s, String defaultVal) {
        return isEmpty(s) ? defaultVal : s;
    }

    public static boolean hasText(CharSequence cs) {
        return isNotBlank(cs);
    }
}
