package com.hhkungfu.backend.module.anime.repository;

import com.hhkungfu.backend.module.anime.entity.Anime;
import org.springframework.data.jpa.domain.Specification;

public class AnimeSpecifications {

    public static Specification<Anime> hasDeletedAtNull() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isNull(root.get("deletedAt"));
    }

    public static Specification<Anime> titleViContainsIgnoreCase(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            // Normalize search term: remove diacritics and convert to lowercase
            String normalizedSearch = normalizeString(search.trim());
            String searchTerm = "%" + normalizedSearch + "%";

            // Use unaccent function if available, otherwise use normalized comparison
            try {
                // Try using PostgreSQL unaccent function
                return criteriaBuilder.like(
                    criteriaBuilder.function("unaccent", String.class, criteriaBuilder.lower(root.get("titleVi"))),
                    searchTerm
                );
            } catch (Exception e) {
                // Fallback to normalized comparison
                return criteriaBuilder.like(criteriaBuilder.lower(root.get("titleVi")), searchTerm);
            }
        };
    }

    /**
     * Normalize string: remove Vietnamese diacritics and convert to lowercase
     */
    private static String normalizeString(String str) {
        if (str == null || str.isEmpty()) return "";
        return java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase();
    }

    public static Specification<Anime> searchByTitleVi(String search) {
        return Specification.where(hasDeletedAtNull())
                .and(titleViContainsIgnoreCase(search));
    }
}