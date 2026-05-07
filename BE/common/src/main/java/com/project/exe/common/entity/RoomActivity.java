package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "room_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class RoomActivity extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "activity_id")
    @EqualsAndHashCode.Include
    Long activityId;

    @Column(name = "room_id")
    Long roomId;

    @Column(name = "user_master_data_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userMasterDataId;

    @Column(name = "activity_type", nullable = false)
    String activityType;

    @Column(name = "duration_minutes")
    Integer durationMinutes;

    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;
}
