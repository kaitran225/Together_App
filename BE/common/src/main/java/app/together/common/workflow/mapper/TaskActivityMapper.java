package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.TaskActivityDto;
import app.together.common.workflow.entity.TaskActivity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskActivityMapper {

    TaskActivityDto toDto(TaskActivity entity);

    @Mapping(target = "activityId", ignore = true)
    TaskActivity toEntity(TaskActivityDto dto);

    @Mapping(target = "activityId", ignore = true)
    void updateEntity(@MappingTarget TaskActivity entity, TaskActivityDto dto);

    TaskActivity copy(TaskActivity entity);

    TaskActivity deepCopy(TaskActivity entity);
}