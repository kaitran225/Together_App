package com.project.exe.common.mapper;

import com.project.exe.common.dto.QuizAnalyticsDto;
import com.project.exe.common.entity.QuizAnalytics;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface QuizAnalyticsMapper {

    QuizAnalyticsDto toDto(QuizAnalytics entity);

    @Mapping(target = "analyticsId", ignore = true)
    QuizAnalytics toEntity(QuizAnalyticsDto dto);

    @Mapping(target = "analyticsId", ignore = true)
    void updateEntity(@MappingTarget QuizAnalytics entity, QuizAnalyticsDto dto);

    QuizAnalytics copy(QuizAnalytics entity);

    QuizAnalytics deepCopy(QuizAnalytics entity);
}
