package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "user_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class UserReport extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    @EqualsAndHashCode.Include
    Long reportId;

    @Column(name = "reporter_sso", nullable = false)
    String reporterSso;

    @Column(name = "reported_user_sso", nullable = false)
    String reportedUserSso;

    @Column(name = "reason", nullable = false)
    String reason;

    @Column(name = "room_id")
    Long roomId;

    @Column(name = "status", nullable = false)
    String status; // e.g. PENDING, RESOLVED
}
