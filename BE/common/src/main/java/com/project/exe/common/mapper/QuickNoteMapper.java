package com.project.exe.common.mapper;

import com.project.exe.common.dto.QuickNoteDto;
import com.project.exe.common.entity.QuickNote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface QuickNoteMapper {

    QuickNoteDto toDto(QuickNote entity);

    @Mapping(target = "noteId", ignore = true)
    QuickNote toEntity(QuickNoteDto dto);

    @Mapping(target = "noteId", ignore = true)
    void updateEntity(@MappingTarget QuickNote entity, QuickNoteDto dto);

    QuickNote copy(QuickNote entity);

    QuickNote deepCopy(QuickNote entity);
}
