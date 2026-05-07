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
public class MeetingDto {
    Long meetingId;
    Long teamId;
    Long roomId;
    Long projectId;
    String title;
    String description;
    String agenda;
    String meetingUrl;
    String meetingPlatform;
    Instant scheduledStart;
    Instant scheduledEnd;
    Instant actualStart;
    Instant actualEnd;
    Integer maxDuration;
    String status;
    String createdBy;

}
