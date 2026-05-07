package com.project.exe.common.mapper;

import com.project.exe.common.dto.FlashcardDto;
import com.project.exe.common.entity.Flashcard;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface FlashcardMapper {

    FlashcardDto toDto(Flashcard entity);

    @Mapping(target = "quizId", ignore = true)
    @Mapping(target = "quizQuestionId", ignore = true)
    Flashcard toEntity(FlashcardDto dto);

    @Mapping(target = "quizId", ignore = true)
    @Mapping(target = "quizQuestionId", ignore = true)
    void updateEntity(@MappingTarget Flashcard entity, FlashcardDto dto);

    Flashcard copy(Flashcard entity);

    Flashcard deepCopy(Flashcard entity);
}
