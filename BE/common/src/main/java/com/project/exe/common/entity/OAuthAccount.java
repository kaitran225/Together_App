package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "oauth_accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class OAuthAccount extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oauth_id")
    @EqualsAndHashCode.Include
    Long oauthId;

    @Column(name = "user_id", nullable = false)
    @EqualsAndHashCode.Include
    Long userId;

    @Column(nullable = false)
    String provider;

    @Column(name = "provider_uid", nullable = false)
    String providerUid;

    @Column(name = "email")
    String email;

    @Column(name = "provider_data", columnDefinition = "jsonb")
    String providerData;
}
