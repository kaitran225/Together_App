package com.project.exe.common.mapper;

import com.project.exe.common.dto.ChatMessageDto;
import com.project.exe.common.entity.ChatMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ChatMessageMapper {

    ChatMessageDto toDto(ChatMessage entity);

    @Mapping(target = "messageId", ignore = true)
    ChatMessage toEntity(ChatMessageDto dto);

    @Mapping(target = "messageId", ignore = true)
    void updateEntity(@MappingTarget ChatMessage entity, ChatMessageDto dto);

    ChatMessage copy(ChatMessage entity);

    ChatMessage deepCopy(ChatMessage entity);
}
