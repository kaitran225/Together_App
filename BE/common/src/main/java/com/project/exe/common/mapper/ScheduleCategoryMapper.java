package com.project.exe.common.mapper;

import com.project.exe.common.dto.ScheduleCategoryDto;
import com.project.exe.common.entity.ScheduleCategory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface ScheduleCategoryMapper {

    ScheduleCategoryDto toDto(ScheduleCategory entity);

    @Mapping(target = "categoryId", ignore = true)
    ScheduleCategory toEntity(ScheduleCategoryDto dto);

    @Mapping(target = "categoryId", ignore = true)
    void updateEntity(@MappingTarget ScheduleCategory entity, ScheduleCategoryDto dto);

    ScheduleCategory copy(ScheduleCategory entity);

    ScheduleCategory deepCopy(ScheduleCategory entity);
}
