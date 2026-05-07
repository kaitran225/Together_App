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
public class RoomDto {
    Long roomId;
    String title;
    String description;
    String goalDescription;
    Integer goalDurationDays;
    Integer maxMembers;
    Boolean isPremium;
    Boolean isPublic;
    String inviteCode;
    String status;
    Instant activatedAt;
    Instant expiresAt;

}
