package com.project.exe.common.mapper;

import com.project.exe.common.dto.MindmapDto;
import com.project.exe.common.entity.Mindmap;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface MindmapMapper {

    MindmapDto toDto(Mindmap entity);

    @Mapping(target = "mindmapId", ignore = true)
    Mindmap toEntity(MindmapDto dto);

    @Mapping(target = "mindmapId", ignore = true)
    void updateEntity(@MappingTarget Mindmap entity, MindmapDto dto);

    Mindmap copy(Mindmap entity);

    Mindmap deepCopy(Mindmap entity);
}
