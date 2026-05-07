package com.project.exe.common.mapper;

import com.project.exe.common.dto.TaskCommentDto;
import com.project.exe.common.entity.TaskComment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskCommentMapper {

    TaskCommentDto toDto(TaskComment entity);

    @Mapping(target = "commentId", ignore = true)
    TaskComment toEntity(TaskCommentDto dto);

    @Mapping(target = "commentId", ignore = true)
    void updateEntity(@MappingTarget TaskComment entity, TaskCommentDto dto);

    TaskComment copy(TaskComment entity);

    TaskComment deepCopy(TaskComment entity);
}
