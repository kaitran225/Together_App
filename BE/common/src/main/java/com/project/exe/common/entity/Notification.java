package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class Notification extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    @EqualsAndHashCode.Include
    Long notificationId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false)
    String type;

    @Column(nullable = false)
    String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    String message;

    @Column(name = "link_type")
    String linkType;

    @Column(name = "link_id")
    @EqualsAndHashCode.Include
    Long linkId;

    @Column(name = "is_read")
    Boolean isRead = false;

    @Column(name = "read_at")
    Instant readAt;

    @Column(name = "sent_via", columnDefinition = "varchar[]")
    String sentVia;

    @Column(name = "expires_at")
    Instant expiresAt;
}
