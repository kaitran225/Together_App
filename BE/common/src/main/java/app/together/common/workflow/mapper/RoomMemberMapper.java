package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.RoomMemberDto;
import app.together.common.workflow.entity.RoomMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RoomMemberMapper {

    RoomMemberDto toDto(RoomMember entity);

    @Mapping(target = "roomId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    RoomMember toEntity(RoomMemberDto dto);

    @Mapping(target = "roomId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    void updateEntity(@MappingTarget RoomMember entity, RoomMemberDto dto);

    RoomMember copy(RoomMember entity);

    RoomMember deepCopy(RoomMember entity);
}