package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.ScheduleDto;
import app.together.common.workflow.entity.Schedule;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ScheduleMapper {

    ScheduleDto toDto(Schedule entity);

    @Mapping(target = "scheduleId", ignore = true)
    Schedule toEntity(ScheduleDto dto);

    @Mapping(target = "scheduleId", ignore = true)
    void updateEntity(@MappingTarget Schedule entity, ScheduleDto dto);

    Schedule copy(Schedule entity);

    Schedule deepCopy(Schedule entity);
}