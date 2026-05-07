package com.project.exe.common.mapper;

import com.project.exe.common.dto.MeetingSummaryDto;
import com.project.exe.common.entity.MeetingSummary;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface MeetingSummaryMapper {

    MeetingSummaryDto toDto(MeetingSummary entity);

    @Mapping(target = "summaryId", ignore = true)
    MeetingSummary toEntity(MeetingSummaryDto dto);

    @Mapping(target = "summaryId", ignore = true)
    void updateEntity(@MappingTarget MeetingSummary entity, MeetingSummaryDto dto);

    MeetingSummary copy(MeetingSummary entity);

    MeetingSummary deepCopy(MeetingSummary entity);
}
