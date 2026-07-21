package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.QuizQuestionDto;
import app.together.common.workflow.entity.QuizQuestion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface QuizQuestionMapper {

    QuizQuestionDto toDto(QuizQuestion entity);

    @Mapping(target = "questionId", ignore = true)
    QuizQuestion toEntity(QuizQuestionDto dto);

    @Mapping(target = "questionId", ignore = true)
    void updateEntity(@MappingTarget QuizQuestion entity, QuizQuestionDto dto);

    QuizQuestion copy(QuizQuestion entity);

    QuizQuestion deepCopy(QuizQuestion entity);
}