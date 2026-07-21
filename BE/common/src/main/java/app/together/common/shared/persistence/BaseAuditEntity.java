package app.together.common.shared.persistence;

import app.together.common.shared.util.SecurityUtils;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@MappedSuperclass
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public abstract class BaseAuditEntity {

    @Column(name = "created_at")
    Instant createdAt;

    @Column(name = "created_by")
    String createdBy;

    @Column(name = "updated_at")
    Instant updatedAt;

    @Column(name = "updated_by")
    String updatedBy;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        String sso = SecurityUtils.getCurrentUserSsoOrNull();
        if (createdBy == null && sso != null) createdBy = sso;
        if (updatedBy == null && sso != null) updatedBy = sso;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
        String sso = SecurityUtils.getCurrentUserSsoOrNull();
        if (sso != null) updatedBy = sso;
    }
}
