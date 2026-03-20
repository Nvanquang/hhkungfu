package com.hhkungfu.backend.module.anime.enums;

public enum AgeRating {
    G,
    PG,
    PG_13,
    R,
    R_PLUS;

    public String getValue() {
        if (this == PG_13) return "PG-13";
        if (this == R_PLUS) return "R+";
        return this.name();
    }
}
