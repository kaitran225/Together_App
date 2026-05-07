package com.project.exe.common.mapper;

import com.project.exe.common.dto.UserDto;
import com.project.exe.common.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMapper {

    UserDto toDto(User entity);

    @Mapping(target = "userId", ignore = true)
    User toEntity(UserDto dto);

    @Mapping(target = "userId", ignore = true)
    void updateEntity(@MappingTarget User entity, UserDto dto);

    User copy(User entity);

    User deepCopy(User entity);
}
