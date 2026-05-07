package com.project.exe.common.mapper;

import com.project.exe.common.dto.TaskAssignmentDto;
import com.project.exe.common.entity.TaskAssignment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskAssignmentMapper {

    TaskAssignmentDto toDto(TaskAssignment entity);

    @Mapping(target = "taskId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    TaskAssignment toEntity(TaskAssignmentDto dto);

    @Mapping(target = "taskId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    void updateEntity(@MappingTarget TaskAssignment entity, TaskAssignmentDto dto);

    TaskAssignment copy(TaskAssignment entity);

    TaskAssignment deepCopy(TaskAssignment entity);
}
