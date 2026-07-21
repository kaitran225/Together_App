package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.SummaryDto;
import app.together.common.workflow.entity.Summary;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface SummaryMapper {

    SummaryDto toDto(Summary entity);

    @Mapping(target = "summaryId", ignore = true)
    Summary toEntity(SummaryDto dto);

    @Mapping(target = "summaryId", ignore = true)
    void updateEntity(@MappingTarget Summary entity, SummaryDto dto);

    Summary copy(Summary entity);

    Summary deepCopy(Summary entity);
}