package com.project.exe.common.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Entity
@Table(name = "chat_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@EqualsAndHashCode(onlyExplicitlyIncluded = true, callSuper = false)
public class ChatConversation extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    @EqualsAndHashCode.Include
    Long conversationId;

    @Column(name = "user_sso", nullable = false)
    String userSso;

    @Column(name = "title")
    String title;

    @Column(name = "context_type")
    String contextType;

    @Column(name = "started_at")
    Instant startedAt;

    @Column(name = "last_message_at")
    Instant lastMessageAt;
}
