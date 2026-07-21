package app.together.common.auth.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "oauth_accounts", schema = "auth")
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

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "provider_data", columnDefinition = "jsonb")
    String providerData;
}
