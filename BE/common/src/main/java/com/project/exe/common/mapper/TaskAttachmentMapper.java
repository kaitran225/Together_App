package com.project.exe.common.mapper;

import com.project.exe.common.dto.TaskAttachmentDto;
import com.project.exe.common.entity.TaskAttachment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TaskAttachmentMapper {

    TaskAttachmentDto toDto(TaskAttachment entity);

    @Mapping(target = "attachmentId", ignore = true)
    TaskAttachment toEntity(TaskAttachmentDto dto);

    @Mapping(target = "attachmentId", ignore = true)
    void updateEntity(@MappingTarget TaskAttachment entity, TaskAttachmentDto dto);

    TaskAttachment copy(TaskAttachment entity);

    TaskAttachment deepCopy(TaskAttachment entity);
}
