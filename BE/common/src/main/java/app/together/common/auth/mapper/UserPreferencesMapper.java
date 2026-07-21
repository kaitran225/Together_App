package app.together.common.auth.mapper;

import app.together.common.auth.dto.UserPreferencesDto;
import app.together.common.auth.entity.UserPreferences;
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