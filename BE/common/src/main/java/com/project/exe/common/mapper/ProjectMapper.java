package com.project.exe.common.mapper;

import com.project.exe.common.dto.ProjectDto;
import com.project.exe.common.entity.Project;
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
