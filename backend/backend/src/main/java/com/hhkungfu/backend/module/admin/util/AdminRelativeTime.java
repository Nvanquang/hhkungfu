package com.hhkungfu.backend.module.admin.util;

import java.time.Duration;
import java.time.ZonedDateTime;

public final class AdminRelativeTime {

    private AdminRelativeTime() {
    }

    public static String viShort(ZonedDateTime time) {
        if (time == null) {
            return "";
        }
        long minutes = Duration.between(time, ZonedDateTime.now()).toMinutes();
        if (minutes < 1) {
            return "vừa xong";
        }
        if (minutes < 60) {
            return minutes + " phút trước";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + " giờ trước";
        }
        long days = hours / 24;
        return days + " ngày trước";
    }
}
