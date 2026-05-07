package com.project.exe.common.mapper;

import com.project.exe.common.dto.RoomRequestDto;
import com.project.exe.common.entity.RoomRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RoomRequestMapper {

    RoomRequestDto toDto(RoomRequest entity);

    @Mapping(target = "requestId", ignore = true)
    RoomRequest toEntity(RoomRequestDto dto);

    @Mapping(target = "requestId", ignore = true)
    void updateEntity(@MappingTarget RoomRequest entity, RoomRequestDto dto);

    RoomRequest copy(RoomRequest entity);

    RoomRequest deepCopy(RoomRequest entity);
}
