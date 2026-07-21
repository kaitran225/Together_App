package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.TaskDependencyDto;
import app.together.common.workflow.entity.TaskDependency;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskDependencyMapper {

    TaskDependencyDto toDto(TaskDependency entity);

    @Mapping(target = "taskId", ignore = true)
    @Mapping(target = "dependsOnTaskId", ignore = true)
    TaskDependency toEntity(TaskDependencyDto dto);

    @Mapping(target = "taskId", ignore = true)
    @Mapping(target = "dependsOnTaskId", ignore = true)
    void updateEntity(@MappingTarget TaskDependency entity, TaskDependencyDto dto);

    TaskDependency copy(TaskDependency entity);

    TaskDependency deepCopy(TaskDependency entity);
}