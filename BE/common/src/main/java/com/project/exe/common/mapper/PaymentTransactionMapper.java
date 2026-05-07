package com.project.exe.common.mapper;

import com.project.exe.common.dto.PaymentTransactionDto;
import com.project.exe.common.entity.PaymentTransaction;
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
