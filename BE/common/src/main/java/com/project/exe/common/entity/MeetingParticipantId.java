package com.project.exe.common.entity;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class MeetingParticipantId implements Serializable {

    Long meetingId;
    String userSso;
}
