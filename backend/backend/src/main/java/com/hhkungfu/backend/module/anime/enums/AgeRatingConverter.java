package com.hhkungfu.backend.module.anime.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class AgeRatingConverter implements AttributeConverter<AgeRating, String> {

    @Override
    public String convertToDatabaseColumn(AgeRating attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public AgeRating convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "G" -> AgeRating.G;
            case "PG" -> AgeRating.PG;
            case "PG-13" -> AgeRating.PG_13;
            case "R" -> AgeRating.R;
            case "R+" -> AgeRating.R_PLUS;
            default -> throw new IllegalArgumentException("Unknown database value: " + dbData);
        };
    }
}
