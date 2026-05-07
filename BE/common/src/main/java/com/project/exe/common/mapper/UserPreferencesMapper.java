package com.project.exe.common.mapper;

import com.project.exe.common.dto.UserPreferencesDto;
import com.project.exe.common.entity.UserPreferences;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserPreferencesMapper {

    UserPreferencesDto toDto(UserPreferences entity);

    @Mapping(target = "userId", ignore = true)
    UserPreferences toEntity(UserPreferencesDto dto);

    @Mapping(target = "userId", ignore = true)
    void updateEntity(@MappingTarget UserPreferences entity, UserPreferencesDto dto);

    UserPreferences copy(UserPreferences entity);

    UserPreferences deepCopy(UserPreferences entity);
}
