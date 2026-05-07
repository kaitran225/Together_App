package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "study_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class StudySession extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    @EqualsAndHashCode.Include
    Long sessionId;

    @Column(name = "user_master_data_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userMasterDataId;

    @Column(name = "room_id")
    Long roomId;

    @Column(name = "session_type")
    String sessionType;

    @Column(name = "start_time", nullable = false)
    Instant startTime;

    @Column(name = "end_time")
    Instant endTime;

    @Column(name = "exp_earned")
    Integer expEarned;

    @Column(name = "notes", columnDefinition = "TEXT")
    String notes;
}
