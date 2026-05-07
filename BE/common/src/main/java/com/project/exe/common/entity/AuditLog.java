package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class AuditLog extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    @EqualsAndHashCode.Include
    Long logId;

    @Column(name = "user_sso")
    String userSso;

    @Column(nullable = false)
    String action;

    @Column(name = "table_name", nullable = false)
    String tableName;

    @Column(name = "record_id")
    @EqualsAndHashCode.Include
    Long recordId;

    @Column(name = "old_values", columnDefinition = "jsonb")
    String oldValues;

    @Column(name = "new_values", columnDefinition = "jsonb")
    String newValues;

    @Column(name = "ip_address", columnDefinition = "inet")
    String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    String userAgent;
}
