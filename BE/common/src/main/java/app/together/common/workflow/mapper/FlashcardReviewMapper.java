package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.FlashcardReviewDto;
import app.together.common.workflow.entity.FlashcardReview;
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