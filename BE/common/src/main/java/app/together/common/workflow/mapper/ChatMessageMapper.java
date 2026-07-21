package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.ChatMessageDto;
import app.together.common.workflow.entity.ChatMessage;
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