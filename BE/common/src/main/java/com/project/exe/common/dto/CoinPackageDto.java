package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class CoinPackageDto {
    Long packageId;
    String packageName;
    Integer coinsAmount;
    Integer bonusCoins;
    BigDecimal priceVnd;
    Boolean isPopular;
    Boolean isActive;
    Integer displayOrder;
    String description;

}
