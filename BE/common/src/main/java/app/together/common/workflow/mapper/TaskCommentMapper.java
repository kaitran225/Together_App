package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.TaskCommentDto;
import app.together.common.workflow.entity.TaskComment;
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