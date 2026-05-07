package com.project.exe.common.mapper;

import com.project.exe.common.dto.DocumentDto;
import com.project.exe.common.entity.Document;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface DocumentMapper {

    DocumentDto toDto(Document entity);

    @Mapping(target = "documentId", ignore = true)
    Document toEntity(DocumentDto dto);

    @Mapping(target = "documentId", ignore = true)
    void updateEntity(@MappingTarget Document entity, DocumentDto dto);

    Document copy(Document entity);

    Document deepCopy(Document entity);
}
