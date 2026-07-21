package app.together.common.auth.mapper;

import app.together.common.auth.dto.UserTransactionDto;
import app.together.common.auth.entity.UserTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface UserTransactionMapper {

    UserTransactionDto toDto(UserTransaction entity);

    @Mapping(target = "userTransactionId", ignore = true)
    UserTransaction toEntity(UserTransactionDto dto);

    @Mapping(target = "userTransactionId", ignore = true)
    void updateEntity(@MappingTarget UserTransaction entity, UserTransactionDto dto);

    UserTransaction copy(UserTransaction entity);

    UserTransaction deepCopy(UserTransaction entity);
}