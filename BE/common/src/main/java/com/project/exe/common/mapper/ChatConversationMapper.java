package com.project.exe.common.mapper;

import com.project.exe.common.dto.ChatConversationDto;
import com.project.exe.common.entity.ChatConversation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ChatConversationMapper {

    ChatConversationDto toDto(ChatConversation entity);

    @Mapping(target = "conversationId", ignore = true)
    ChatConversation toEntity(ChatConversationDto dto);

    @Mapping(target = "conversationId", ignore = true)
    void updateEntity(@MappingTarget ChatConversation entity, ChatConversationDto dto);

    ChatConversation copy(ChatConversation entity);

    ChatConversation deepCopy(ChatConversation entity);
}
