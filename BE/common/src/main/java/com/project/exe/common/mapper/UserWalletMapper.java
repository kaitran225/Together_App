package com.project.exe.common.mapper;

import com.project.exe.common.dto.UserWalletDto;
import com.project.exe.common.entity.UserWallet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserWalletMapper {

    UserWalletDto toDto(UserWallet entity);

    @Mapping(target = "walletId", ignore = true)
    UserWallet toEntity(UserWalletDto dto);

    @Mapping(target = "walletId", ignore = true)
    void updateEntity(@MappingTarget UserWallet entity, UserWalletDto dto);

    UserWallet copy(UserWallet entity);

    UserWallet deepCopy(UserWallet entity);
}
