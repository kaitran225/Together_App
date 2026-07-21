package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.AppConfigDto;
import app.together.common.workflow.entity.AppConfig;
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