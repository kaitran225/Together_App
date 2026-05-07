package com.project.exe.common.mapper;

import com.project.exe.common.dto.PasswordResetDto;
import com.project.exe.common.entity.PasswordReset;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface PasswordResetMapper {

    PasswordResetDto toDto(PasswordReset entity);

    @Mapping(target = "resetId", ignore = true)
    PasswordReset toEntity(PasswordResetDto dto);

    @Mapping(target = "resetId", ignore = true)
    void updateEntity(@MappingTarget PasswordReset entity, PasswordResetDto dto);

    PasswordReset copy(PasswordReset entity);

    PasswordReset deepCopy(PasswordReset entity);
}
