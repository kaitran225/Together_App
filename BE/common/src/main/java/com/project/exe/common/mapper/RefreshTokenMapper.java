package com.project.exe.common.mapper;

import com.project.exe.common.dto.RefreshTokenDto;
import com.project.exe.common.entity.RefreshToken;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RefreshTokenMapper {

    RefreshTokenDto toDto(RefreshToken entity);

    @Mapping(target = "tokenId", ignore = true)
    RefreshToken toEntity(RefreshTokenDto dto);

    @Mapping(target = "tokenId", ignore = true)
    void updateEntity(@MappingTarget RefreshToken entity, RefreshTokenDto dto);

    RefreshToken copy(RefreshToken entity);

    RefreshToken deepCopy(RefreshToken entity);
}
