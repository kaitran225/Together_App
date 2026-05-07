package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class RoomRequestDto {
    Long requestId;
    String userSso;
    String goalDescription;
    Integer goalDurationDays;
    Integer preferredSize;
    String status;
    Long matchedRoomId;
    Instant expiresAt;
    Instant matchedAt;

}
