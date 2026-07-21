package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.MeetingDto;
import app.together.common.workflow.entity.Meeting;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface MeetingMapper {

    MeetingDto toDto(Meeting entity);

    @Mapping(target = "meetingId", ignore = true)
    Meeting toEntity(MeetingDto dto);

    @Mapping(target = "meetingId", ignore = true)
    void updateEntity(@MappingTarget Meeting entity, MeetingDto dto);

    Meeting copy(Meeting entity);

    Meeting deepCopy(Meeting entity);
}