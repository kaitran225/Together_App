package app.together.common.workflow.entity;

import app.together.common.shared.persistence.BaseAuditEntity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "task_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class TaskSubmission extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    @EqualsAndHashCode.Include
    Long submissionId;

    @Column(name = "task_id", nullable = false)
    Long taskId;

    @Column(name = "user_sso", nullable = false)
    String userSso; // Người thực hiện nộp bài

    @Column(name = "content", columnDefinition = "TEXT")
    String content; // Nội dung mô tả sản phẩm nộp

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "attachments", columnDefinition = "jsonb")
    String attachments; // URL file bài làm đính kèm

    @Column(name = "grade", precision = 5, scale = 2)
    BigDecimal grade; // Điểm số chấm của leader (ví dụ: 8.5)

    @Column(name = "feedback", columnDefinition = "TEXT")
    String feedback; // Lời phê/nhận xét của leader

    @Column(name = "status")
    String status; // Trạng thái phê duyệt: PENDING, APPROVED, REJECTED

    @Column(name = "submitted_at")
    Instant submittedAt;
}