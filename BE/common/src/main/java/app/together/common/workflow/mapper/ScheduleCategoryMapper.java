package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.ScheduleCategoryDto;
import app.together.common.workflow.entity.ScheduleCategory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ScheduleCategoryMapper {

    ScheduleCategoryDto toDto(ScheduleCategory entity);

    @Mapping(target = "categoryId", ignore = true)
    ScheduleCategory toEntity(ScheduleCategoryDto dto);

    @Mapping(target = "categoryId", ignore = true)
    void updateEntity(@MappingTarget ScheduleCategory entity, ScheduleCategoryDto dto);

    ScheduleCategory copy(ScheduleCategory entity);

    ScheduleCategory deepCopy(ScheduleCategory entity);
}