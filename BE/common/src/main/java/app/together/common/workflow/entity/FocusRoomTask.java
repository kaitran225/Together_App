package app.together.common.workflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "focus_room_task")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FocusRoomTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_sso", nullable = false)
    private String userSso;

    @Column(nullable = false)
    private String title;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
