package com.hhkungfu.backend.common.constant;

public final class RedisKeys {
    
    private RedisKeys() {}

    public static String rateLimitOtp(String email) { 
        return "ratelimit:otp:" + email; 
    }

    public static String otpAttempt(String userId, String otpType) {
        return "otp:attempt:" + userId + ":" + otpType;
    }

    public static String refresh(String userId) { 
        return "refresh:" + userId; 
    }

    public static String anime(Long id) {
        return "anime:" + id;
    }

    public static String animeSlug(String slug) {
        return "anime:slug:" + slug;
    }

    public static String animeFeatured() {
        return "anime:featured";
    }

    public static String userLogout(String userId) {
        return "user:logout:" + userId;
    }
}
