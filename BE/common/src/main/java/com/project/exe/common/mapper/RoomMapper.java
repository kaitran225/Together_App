package com.project.exe.common.mapper;

import com.project.exe.common.dto.RoomDto;
import com.project.exe.common.entity.Room;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RoomMapper {

    RoomDto toDto(Room entity);

    @Mapping(target = "roomId", ignore = true)
    Room toEntity(RoomDto dto);

    @Mapping(target = "roomId", ignore = true)
    void updateEntity(@MappingTarget Room entity, RoomDto dto);

    Room copy(Room entity);

    Room deepCopy(Room entity);
}
