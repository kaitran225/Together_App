package com.project.exe.common.mapper;

import com.project.exe.common.dto.TaskDependencyDto;
import com.project.exe.common.entity.TaskDependency;
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
