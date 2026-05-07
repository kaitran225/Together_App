package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "schedule_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class ScheduleCategory extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    @EqualsAndHashCode.Include
    Long categoryId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(nullable = false)
    String name;

    @Column(name = "color")
    String color;

    @Column(name = "icon")
    String icon;

    @Column(name = "is_system")
    Boolean isSystem = false;
}
