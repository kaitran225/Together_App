package app.together.common.auth.mapper;

import app.together.common.auth.dto.UserWalletDto;
import app.together.common.auth.entity.UserWallet;
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