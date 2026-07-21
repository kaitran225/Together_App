package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.PaymentTransactionDto;
import app.together.common.workflow.entity.PaymentTransaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface PaymentTransactionMapper {

    PaymentTransactionDto toDto(PaymentTransaction entity);

    @Mapping(target = "paymentId", ignore = true)
    PaymentTransaction toEntity(PaymentTransactionDto dto);

    @Mapping(target = "paymentId", ignore = true)
    void updateEntity(@MappingTarget PaymentTransaction entity, PaymentTransactionDto dto);

    PaymentTransaction copy(PaymentTransaction entity);

    PaymentTransaction deepCopy(PaymentTransaction entity);
}