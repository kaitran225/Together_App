package com.project.exe.common.mapper;

import com.project.exe.common.dto.AchievementDto;
import com.project.exe.common.entity.Achievement;
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
