package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Collections;
import java.util.List;


@Entity
@Table(name = "coin_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class CoinPackage extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    @EqualsAndHashCode.Include
    Long packageId;

    @Column(name = "package_name", nullable = false)
    String packageName;

    @Column(name = "coins_amount", nullable = false)
    Integer coinsAmount;

    @Column(name = "bonus_coins")
    Integer bonusCoins;

    @Column(name = "price_vnd", nullable = false, precision = 10, scale = 2)
    Long priceVnd;

    @Column(name = "is_popular")
    Boolean isPopular;

    @Column(name = "is_active")
    Boolean isActive;

    @Column(name = "display_order")
    Integer displayOrder;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "features", columnDefinition = "TEXT")
    @Convert(converter = StringListConverter.class)
    List<String> features;

    /** JPA converter: JSON text ↔ List<String> */
    @Converter
    public static class StringListConverter implements AttributeConverter<List<String>, String> {
        private static final ObjectMapper MAPPER = new ObjectMapper();

        @Override
        public String convertToDatabaseColumn(List<String> attribute) {
            if (attribute == null || attribute.isEmpty()) return "[]";
            try { return MAPPER.writeValueAsString(attribute); }
            catch (Exception e) { return "[]"; }
        }

        @Override
        public List<String> convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.isBlank()) return Collections.emptyList();
            try { return MAPPER.readValue(dbData, new TypeReference<>() {}); }
            catch (Exception e) { return Collections.emptyList(); }
        }
    }
}
