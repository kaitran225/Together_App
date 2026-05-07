package com.project.exe.common.mapper;

import com.project.exe.common.dto.FlashcardReviewDto;
import com.project.exe.common.entity.FlashcardReview;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface FlashcardReviewMapper {

    FlashcardReviewDto toDto(FlashcardReview entity);

    @Mapping(target = "reviewId", ignore = true)
    FlashcardReview toEntity(FlashcardReviewDto dto);

    @Mapping(target = "reviewId", ignore = true)
    void updateEntity(@MappingTarget FlashcardReview entity, FlashcardReviewDto dto);

    FlashcardReview copy(FlashcardReview entity);

    FlashcardReview deepCopy(FlashcardReview entity);
}
