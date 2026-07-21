package app.together.common.auth.mapper;

import app.together.common.auth.dto.OAuthAccountDto;
import app.together.common.auth.entity.OAuthAccount;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface OAuthAccountMapper {

    OAuthAccountDto toDto(OAuthAccount entity);

    @Mapping(target = "oauthId", ignore = true)
    OAuthAccount toEntity(OAuthAccountDto dto);

    @Mapping(target = "oauthId", ignore = true)
    void updateEntity(@MappingTarget OAuthAccount entity, OAuthAccountDto dto);

    OAuthAccount copy(OAuthAccount entity);

    OAuthAccount deepCopy(OAuthAccount entity);
}