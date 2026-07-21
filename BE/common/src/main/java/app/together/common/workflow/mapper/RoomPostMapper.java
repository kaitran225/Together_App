package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.RoomPostDto;
import app.together.common.workflow.entity.RoomPost;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RoomPostMapper {

    RoomPostDto toDto(RoomPost entity);

    @Mapping(target = "postId", ignore = true)
    RoomPost toEntity(RoomPostDto dto);

    @Mapping(target = "postId", ignore = true)
    void updateEntity(@MappingTarget RoomPost entity, RoomPostDto dto);

    RoomPost copy(RoomPost entity);

    RoomPost deepCopy(RoomPost entity);
}