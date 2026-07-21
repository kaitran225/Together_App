package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    String metadata;
}
