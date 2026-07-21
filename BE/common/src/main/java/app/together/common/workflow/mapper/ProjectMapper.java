package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.ProjectDto;
import app.together.common.workflow.entity.Project;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ProjectMapper {

    ProjectDto toDto(Project entity);

    @Mapping(target = "projectId", ignore = true)
    Project toEntity(ProjectDto dto);

    @Mapping(target = "projectId", ignore = true)
    void updateEntity(@MappingTarget Project entity, ProjectDto dto);

    Project copy(Project entity);

    Project deepCopy(Project entity);
}