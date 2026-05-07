package com.project.exe.common.mapper;

import com.project.exe.common.dto.UserMasterDataDto;
import com.project.exe.common.entity.UserMasterData;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserMasterDataMapper {

    UserMasterDataDto toDto(UserMasterData entity);

    @Mapping(target = "masterDataId", ignore = true)
    UserMasterData toEntity(UserMasterDataDto dto);

    @Mapping(target = "masterDataId", ignore = true)
    void updateEntity(@MappingTarget UserMasterData entity, UserMasterDataDto dto);

    UserMasterData copy(UserMasterData entity);

    UserMasterData deepCopy(UserMasterData entity);
}
