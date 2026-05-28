package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "room_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoomEventEntity extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    Long eventId;

    @Column(name = "room_id", nullable = false)
    Long roomId;

    @Column(name = "event_type", nullable = false)
    String eventType;

    @Column(name = "actor_sso")
    String actorSso;

    @Column(name = "payload", columnDefinition = "jsonb")
    String payload;

    @Column(name = "event_at", nullable = false)
    Instant eventAt;
}
