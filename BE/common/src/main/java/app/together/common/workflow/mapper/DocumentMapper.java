package app.together.common.workflow.mapper;

import app.together.common.workflow.dto.DocumentDto;
import app.together.common.workflow.entity.Document;
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