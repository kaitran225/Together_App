package com.project.exe.common.mapper;

import com.project.exe.common.dto.MeetingDto;
import com.project.exe.common.entity.Meeting;
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
