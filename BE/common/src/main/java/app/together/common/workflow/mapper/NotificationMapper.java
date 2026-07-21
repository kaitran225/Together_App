package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.NotificationDto;
import app.together.common.workflow.entity.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface NotificationMapper {

    NotificationDto toDto(Notification entity);

    @Mapping(target = "notificationId", ignore = true)
    Notification toEntity(NotificationDto dto);

    @Mapping(target = "notificationId", ignore = true)
    void updateEntity(@MappingTarget Notification entity, NotificationDto dto);

    Notification copy(Notification entity);

    Notification deepCopy(Notification entity);
}