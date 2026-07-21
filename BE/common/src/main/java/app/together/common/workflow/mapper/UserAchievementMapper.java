package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.UserAchievementDto;
import app.together.common.workflow.entity.UserAchievement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserAchievementMapper {

    UserAchievementDto toDto(UserAchievement entity);

    UserAchievement toEntity(UserAchievementDto dto);

    @Mapping(target = "userSso", ignore = true)
    @Mapping(target = "achievementId", ignore = true)
    void updateEntity(@MappingTarget UserAchievement entity, UserAchievementDto dto);

    UserAchievement copy(UserAchievement entity);

    UserAchievement deepCopy(UserAchievement entity);
}