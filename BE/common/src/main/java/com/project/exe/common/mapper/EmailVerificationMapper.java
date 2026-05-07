package com.project.exe.common.mapper;

import com.project.exe.common.dto.EmailVerificationDto;
import com.project.exe.common.entity.EmailVerification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface EmailVerificationMapper {

    EmailVerificationDto toDto(EmailVerification entity);

    @Mapping(target = "verificationId", ignore = true)
    EmailVerification toEntity(EmailVerificationDto dto);

    @Mapping(target = "verificationId", ignore = true)
    void updateEntity(@MappingTarget EmailVerification entity, EmailVerificationDto dto);

    EmailVerification copy(EmailVerification entity);

    EmailVerification deepCopy(EmailVerification entity);
}
