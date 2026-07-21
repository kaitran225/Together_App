package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.AchievementDto;
import app.together.common.workflow.entity.Achievement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AchievementMapper {

    AchievementDto toDto(Achievement entity);

    @Mapping(target = "achievementId", ignore = true)
    Achievement toEntity(AchievementDto dto);

    @Mapping(target = "achievementId", ignore = true)
    void updateEntity(@MappingTarget Achievement entity, AchievementDto dto);

    Achievement copy(Achievement entity);

    Achievement deepCopy(Achievement entity);
}