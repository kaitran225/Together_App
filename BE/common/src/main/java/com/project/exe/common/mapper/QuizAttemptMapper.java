package com.project.exe.common.mapper;

import com.project.exe.common.dto.QuizAttemptDto;
import com.project.exe.common.entity.QuizAttempt;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface QuizAttemptMapper {

    QuizAttemptDto toDto(QuizAttempt entity);

    @Mapping(target = "attemptId", ignore = true)
    QuizAttempt toEntity(QuizAttemptDto dto);

    @Mapping(target = "attemptId", ignore = true)
    void updateEntity(@MappingTarget QuizAttempt entity, QuizAttemptDto dto);

    QuizAttempt copy(QuizAttempt entity);

    QuizAttempt deepCopy(QuizAttempt entity);
}
