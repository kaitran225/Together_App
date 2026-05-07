package com.project.exe.common.mapper;

import com.project.exe.common.dto.UserAchievementDto;
import com.project.exe.common.entity.UserAchievement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserAchievementMapper {

    UserAchievementDto toDto(UserAchievement entity);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "achievementId", ignore = true)
    UserAchievement toEntity(UserAchievementDto dto);

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "achievementId", ignore = true)
    void updateEntity(@MappingTarget UserAchievement entity, UserAchievementDto dto);

    UserAchievement copy(UserAchievement entity);

    UserAchievement deepCopy(UserAchievement entity);
}
