package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.MeetingSummaryDto;
import app.together.common.workflow.entity.MeetingSummary;
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

}