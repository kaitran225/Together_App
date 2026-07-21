package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.UserRoomSlotDto;
import app.together.common.workflow.entity.UserRoomSlot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserRoomSlotMapper {

    UserRoomSlotDto toDto(UserRoomSlot entity);

    UserRoomSlot toEntity(UserRoomSlotDto dto);

    @Mapping(target = "userSso", ignore = true)
    void updateEntity(@MappingTarget UserRoomSlot entity, UserRoomSlotDto dto);

    UserRoomSlot copy(UserRoomSlot entity);

    UserRoomSlot deepCopy(UserRoomSlot entity);
}