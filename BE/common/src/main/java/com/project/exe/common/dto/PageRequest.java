package com.project.exe.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Sort;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageRequest {

    @Builder.Default
    int page = 0;
    @Builder.Default
    int size = 10;
    @Builder.Default
    List<SortOrder> sort = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SortOrder {
        String property;
        Sort.Direction direction = Sort.Direction.ASC;
    }

    public org.springframework.data.domain.PageRequest toSpringPageRequest() {
        if (sort == null || sort.isEmpty()) {
            return org.springframework.data.domain.PageRequest.of(page, size);
        }
        Sort.Order[] orders = sort.stream()
            .map(o -> new Sort.Order(o.getDirection(), o.getProperty()))
            .toArray(Sort.Order[]::new);
        return org.springframework.data.domain.PageRequest.of(page, size, Sort.by(orders));
    }
}
