package com.project.exe.common.mapper;

import com.project.exe.common.dto.AppConfigDto;
import com.project.exe.common.entity.AppConfig;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AppConfigMapper {

    AppConfigDto toDto(AppConfig entity);

    @Mapping(target = "configKey", ignore = true)
    AppConfig toEntity(AppConfigDto dto);

    @Mapping(target = "configKey", ignore = true)
    void updateEntity(@MappingTarget AppConfig entity, AppConfigDto dto);

    AppConfig copy(AppConfig entity);

    AppConfig deepCopy(AppConfig entity);
}
