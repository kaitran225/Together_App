package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ScheduleDto {
    Long scheduleId;
    String userSso;
    Long categoryId;
    String title;
    String description;
    String location;
    Instant startTime;
    Instant endTime;
    Boolean isAllDay;
    String timezone;
    Boolean isRecurring;
    String status;

}
