package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "board_columns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class BoardColumn extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "column_id")
    @EqualsAndHashCode.Include
    Long columnId;

    @Column(name = "project_id", nullable = false)
    Long projectId;

    @Column(nullable = false)
    String name;

    @Column(name = "position")
    Integer position; // Thứ tự hiển thị cột trên giao diện (ví dụ: 1, 2, 3...)

    @Column(name = "color_code", length = 32)
    String colorCode; // Mã màu hiển thị của cột 
}
