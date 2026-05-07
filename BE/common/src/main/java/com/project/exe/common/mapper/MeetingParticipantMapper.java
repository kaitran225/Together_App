package com.project.exe.common.mapper;

import com.project.exe.common.dto.MeetingParticipantDto;
import com.project.exe.common.entity.MeetingParticipant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface MeetingParticipantMapper {

    MeetingParticipantDto toDto(MeetingParticipant entity);

    @Mapping(target = "meetingId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    MeetingParticipant toEntity(MeetingParticipantDto dto);

    @Mapping(target = "meetingId", ignore = true)
    @Mapping(target = "userSso", ignore = true)
    void updateEntity(@MappingTarget MeetingParticipant entity, MeetingParticipantDto dto);

    MeetingParticipant copy(MeetingParticipant entity);

    MeetingParticipant deepCopy(MeetingParticipant entity);
}
