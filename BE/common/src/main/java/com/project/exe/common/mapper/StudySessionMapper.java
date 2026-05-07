package com.project.exe.common.mapper;

import com.project.exe.common.dto.StudySessionDto;
import com.project.exe.common.entity.StudySession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface StudySessionMapper {

    StudySessionDto toDto(StudySession entity);

    @Mapping(target = "sessionId", ignore = true)
    StudySession toEntity(StudySessionDto dto);

    @Mapping(target = "sessionId", ignore = true)
    void updateEntity(@MappingTarget StudySession entity, StudySessionDto dto);

    StudySession copy(StudySession entity);

    StudySession deepCopy(StudySession entity);
}
