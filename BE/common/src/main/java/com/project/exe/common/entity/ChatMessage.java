package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class ChatMessage extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id")
    @EqualsAndHashCode.Include
    Long messageId;

    @Column(name = "conversation_id", nullable = false)
    @EqualsAndHashCode.Include
    Long conversationId;

    @Column(nullable = false)
    String sender;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    String messageText;

    @Column(name = "action_taken")
    String actionTaken;

    @Column(name = "action_metadata", columnDefinition = "jsonb")
    String actionMetadata;

    @Column(name = "sent_at")
    Instant sentAt;
}
