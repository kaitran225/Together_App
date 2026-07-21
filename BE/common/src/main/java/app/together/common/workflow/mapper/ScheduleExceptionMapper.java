package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.ScheduleExceptionDto;
import app.together.common.workflow.entity.ScheduleException;
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