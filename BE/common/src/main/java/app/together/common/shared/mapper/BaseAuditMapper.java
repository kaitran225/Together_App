package app.together.common.shared.mapper;

import app.together.common.shared.dto.BaseAuditDTO;
import app.together.common.shared.persistence.BaseAuditEntity;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

/**
 * Maps audit columns between {@link BaseAuditEntity} and {@link BaseAuditDTO}.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface BaseAuditMapper {

    BaseAuditDTO toAuditDto(BaseAuditEntity entity);
}
