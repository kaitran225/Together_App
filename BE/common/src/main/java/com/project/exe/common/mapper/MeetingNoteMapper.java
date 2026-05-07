package com.project.exe.common.mapper;

import com.project.exe.common.dto.MeetingNoteDto;
import com.project.exe.common.entity.MeetingNote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface MeetingNoteMapper {

    MeetingNoteDto toDto(MeetingNote entity);

    @Mapping(target = "noteId", ignore = true)
    MeetingNote toEntity(MeetingNoteDto dto);

    @Mapping(target = "noteId", ignore = true)
    void updateEntity(@MappingTarget MeetingNote entity, MeetingNoteDto dto);

    MeetingNote copy(MeetingNote entity);

    MeetingNote deepCopy(MeetingNote entity);
}
