package com.project.exe.common.mapper;

import com.project.exe.common.dto.RoomActivityDto;
import com.project.exe.common.entity.RoomActivity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RoomActivityMapper {

    RoomActivityDto toDto(RoomActivity entity);

    @Mapping(target = "activityId", ignore = true)
    RoomActivity toEntity(RoomActivityDto dto);

    @Mapping(target = "activityId", ignore = true)
    void updateEntity(@MappingTarget RoomActivity entity, RoomActivityDto dto);

    RoomActivity copy(RoomActivity entity);

    RoomActivity deepCopy(RoomActivity entity);
}
