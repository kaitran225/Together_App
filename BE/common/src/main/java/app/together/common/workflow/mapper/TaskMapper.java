package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.TaskDto;
import app.together.common.workflow.entity.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskMapper {

    TaskDto toDto(Task entity);

    @Mapping(target = "taskId", ignore = true)
    Task toEntity(TaskDto dto);

    @Mapping(target = "taskId", ignore = true)
    void updateEntity(@MappingTarget Task entity, TaskDto dto);

    Task copy(Task entity);

    Task deepCopy(Task entity);
}