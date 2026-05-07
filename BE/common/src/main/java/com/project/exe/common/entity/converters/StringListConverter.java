package com.project.exe.common.entity.converters;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/** List<String> to DB string. */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    static final String DELIM = "\u0000";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) return null;
        return String.join(DELIM, attribute);
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return Collections.emptyList();
        return Arrays.stream(dbData.split(DELIM)).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
    }
}
