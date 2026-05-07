package com.project.exe.common.mapper;

import com.project.exe.common.dto.NotificationDto;
import com.project.exe.common.entity.Notification;
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
