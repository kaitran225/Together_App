package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class DocumentDto {
    Long documentId;
    @NotBlank(message = "userSso required")
    @Size(max = 255)
    String userSso;
    Long categoryId;
    @NotBlank(message = "title required")
    @Size(max = 500)
    String title;
    @NotBlank(message = "filePath required")
    @Size(max = 2048)
    String filePath;
    @NotBlank(message = "fileName required")
    @Size(max = 255)
    String fileName;
    Long fileSize;
    String fileType;
    String mimeType;
    String processingStatus;
    Integer pageCount;
    Integer wordCount;
    String language;

}
