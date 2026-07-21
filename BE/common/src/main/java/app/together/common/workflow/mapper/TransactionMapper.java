package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.TransactionDto;
import app.together.common.workflow.entity.Transaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TransactionMapper {

    TransactionDto toDto(Transaction entity);

    @Mapping(target = "transactionId", ignore = true)
    Transaction toEntity(TransactionDto dto);

    @Mapping(target = "transactionId", ignore = true)
    void updateEntity(@MappingTarget Transaction entity, TransactionDto dto);

    Transaction copy(Transaction entity);

    Transaction deepCopy(Transaction entity);
}