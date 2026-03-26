package com.hhkungfu.backend.module.video.enums;

public enum VideoQuality {
    Q_360P("360p"), 
    Q_720P("720p"), 
    Q_1080P("1080p");

    private final String value;

    VideoQuality(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
