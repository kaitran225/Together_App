package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.CoinPackageDto;
import app.together.common.workflow.entity.CoinPackage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CoinPackageMapper {

    CoinPackageDto toDto(CoinPackage entity);

    @Mapping(target = "packageId", ignore = true)
    CoinPackage toEntity(CoinPackageDto dto);

    @Mapping(target = "packageId", ignore = true)
    void updateEntity(@MappingTarget CoinPackage entity, CoinPackageDto dto);

    CoinPackage copy(CoinPackage entity);

    CoinPackage deepCopy(CoinPackage entity);
}