package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.TeamDto;
import app.together.common.workflow.entity.Team;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TeamMapper {

    TeamDto toDto(Team entity);

    @Mapping(target = "teamId", ignore = true)
    Team toEntity(TeamDto dto);

    @Mapping(target = "teamId", ignore = true)
    void updateEntity(@MappingTarget Team entity, TeamDto dto);

    Team copy(Team entity);

    Team deepCopy(Team entity);
}