package com.project.exe.common.mapper;

import com.project.exe.common.dto.UserRoomSlotDto;
import com.project.exe.common.entity.UserRoomSlot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserRoomSlotMapper {

    UserRoomSlotDto toDto(UserRoomSlot entity);

    @Mapping(target = "userId", ignore = true)
    UserRoomSlot toEntity(UserRoomSlotDto dto);

    @Mapping(target = "userId", ignore = true)
    void updateEntity(@MappingTarget UserRoomSlot entity, UserRoomSlotDto dto);

    UserRoomSlot copy(UserRoomSlot entity);

    UserRoomSlot deepCopy(UserRoomSlot entity);
}
