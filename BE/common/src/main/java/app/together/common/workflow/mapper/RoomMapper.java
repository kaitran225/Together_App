package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.RoomDto;
import app.together.common.workflow.entity.Room;
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