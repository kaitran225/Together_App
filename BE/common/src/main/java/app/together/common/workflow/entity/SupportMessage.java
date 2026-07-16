package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "support_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class SupportMessage extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    @EqualsAndHashCode.Include
    Long messageId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "sender", nullable = false)
    String sender; // USER or ADMIN

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    String message;
}
