package com.project.exe.common.mapper;

import com.project.exe.common.dto.ScheduleExceptionDto;
import com.project.exe.common.entity.ScheduleException;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ScheduleExceptionMapper {

    ScheduleExceptionDto toDto(ScheduleException entity);

    @Mapping(target = "exceptionId", ignore = true)
    ScheduleException toEntity(ScheduleExceptionDto dto);

    @Mapping(target = "exceptionId", ignore = true)
    void updateEntity(@MappingTarget ScheduleException entity, ScheduleExceptionDto dto);

    ScheduleException copy(ScheduleException entity);

    ScheduleException deepCopy(ScheduleException entity);
}
