package com.project.exe.common.util;

import com.project.exe.common.entity.*;
import com.project.exe.common.dto.*;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.lang.reflect.Constructor;
import java.lang.reflect.Method;
import java.util.*;

/** Entity/DTO/mapper correctness checks. */
public final class EntityDtoCorrectness {

    private static final Set<String> EXPECTED_TABLES = Set.of(
        "users", "achievements", "schedule_categories", "coin_packages", "email_verifications",
        "user_master_data", "oauth_accounts", "refresh_tokens", "user_wallets", "transactions",
        "user_achievements", "password_resets", "user_preferences", "payment_transactions",
        "chat_conversations", "chat_messages", "user_room_slots", "rooms", "room_requests",
        "room_members", "room_posts", "study_sessions", "room_activities", "documents", "summaries",
        "flashcard_reviews", "mindmaps", "quizzes", "quiz_questions", "flashcards", "quiz_attempts",
        "quiz_analytics", "schedules", "schedule_exceptions", "quick_notes", "teams", "team_members",
        "projects", "tasks", "task_assignments", "task_dependencies", "task_comments", "task_activities",
        "task_attachments", "meetings", "meeting_participants", "meeting_summaries", "meeting_notes",
        "notifications", "audit_logs", "app_config"
    );

    @SuppressWarnings("rawtypes")
    private static final List<Class<?>> ENTITY_CLASSES = List.of(
        User.class, Achievement.class, ScheduleCategory.class, CoinPackage.class, EmailVerification.class,
        UserMasterData.class, OAuthAccount.class, RefreshToken.class, UserWallet.class, Transaction.class,
        UserAchievement.class, PasswordReset.class, UserPreferences.class, PaymentTransaction.class,
        ChatConversation.class, ChatMessage.class, UserRoomSlot.class, Room.class, RoomRequest.class,
        RoomMember.class, RoomPost.class, StudySession.class, RoomActivity.class, Document.class, Summary.class,
        FlashcardReview.class, Mindmap.class, Quiz.class, QuizQuestion.class, Flashcard.class, QuizAttempt.class,
        QuizAnalytics.class, Schedule.class, ScheduleException.class, QuickNote.class, Team.class, TeamMember.class,
        Project.class, Task.class, TaskAssignment.class, TaskDependency.class, TaskComment.class, TaskActivity.class,
        TaskAttachment.class, Meeting.class, MeetingParticipant.class, MeetingSummary.class, MeetingNote.class,
        Notification.class, AuditLog.class, AppConfig.class
    );

    @SuppressWarnings("rawtypes")
    private static final List<Class<?>> DTO_CLASSES = List.of(
        UserDto.class, AchievementDto.class, ScheduleCategoryDto.class, CoinPackageDto.class, EmailVerificationDto.class,
        UserMasterDataDto.class, OAuthAccountDto.class, RefreshTokenDto.class, UserWalletDto.class, TransactionDto.class,
        UserAchievementDto.class, PasswordResetDto.class, UserPreferencesDto.class, PaymentTransactionDto.class,
        ChatConversationDto.class, ChatMessageDto.class, UserRoomSlotDto.class, RoomDto.class, RoomRequestDto.class,
        RoomMemberDto.class, RoomPostDto.class, StudySessionDto.class, RoomActivityDto.class, DocumentDto.class, SummaryDto.class,
        FlashcardReviewDto.class, MindmapDto.class, QuizDto.class, QuizQuestionDto.class, FlashcardDto.class, QuizAttemptDto.class,
        QuizAnalyticsDto.class, ScheduleDto.class, ScheduleExceptionDto.class, QuickNoteDto.class, TeamDto.class, TeamMemberDto.class,
        ProjectDto.class, TaskDto.class, TaskAssignmentDto.class, TaskDependencyDto.class, TaskCommentDto.class, TaskActivityDto.class,
        TaskAttachmentDto.class, MeetingDto.class, MeetingParticipantDto.class, MeetingSummaryDto.class, MeetingNoteDto.class,
        NotificationDto.class, AuditLogDto.class, AppConfigDto.class
    );

    /** Mapper -> entity for toDto check. */
    @SuppressWarnings("rawtypes")
    private static final Map<Class<?>, Class<?>> MAPPER_TO_ENTITY = Map.ofEntries(
        map(com.project.exe.common.mapper.UserMapper.class, User.class),
        map(com.project.exe.common.mapper.AchievementMapper.class, Achievement.class),
        map(com.project.exe.common.mapper.ScheduleCategoryMapper.class, ScheduleCategory.class),
        map(com.project.exe.common.mapper.CoinPackageMapper.class, CoinPackage.class),
        map(com.project.exe.common.mapper.EmailVerificationMapper.class, EmailVerification.class),
        map(com.project.exe.common.mapper.UserMasterDataMapper.class, UserMasterData.class),
        map(com.project.exe.common.mapper.OAuthAccountMapper.class, OAuthAccount.class),
        map(com.project.exe.common.mapper.RefreshTokenMapper.class, RefreshToken.class),
        map(com.project.exe.common.mapper.UserWalletMapper.class, UserWallet.class),
        map(com.project.exe.common.mapper.TransactionMapper.class, Transaction.class),
        map(com.project.exe.common.mapper.UserAchievementMapper.class, UserAchievement.class),
        map(com.project.exe.common.mapper.PasswordResetMapper.class, PasswordReset.class),
        map(com.project.exe.common.mapper.UserPreferencesMapper.class, UserPreferences.class),
        map(com.project.exe.common.mapper.PaymentTransactionMapper.class, PaymentTransaction.class),
        map(com.project.exe.common.mapper.ChatConversationMapper.class, ChatConversation.class),
        map(com.project.exe.common.mapper.ChatMessageMapper.class, ChatMessage.class),
        map(com.project.exe.common.mapper.UserRoomSlotMapper.class, UserRoomSlot.class),
        map(com.project.exe.common.mapper.RoomMapper.class, Room.class),
        map(com.project.exe.common.mapper.RoomRequestMapper.class, RoomRequest.class),
        map(com.project.exe.common.mapper.RoomMemberMapper.class, RoomMember.class),
        map(com.project.exe.common.mapper.RoomPostMapper.class, RoomPost.class),
        map(com.project.exe.common.mapper.StudySessionMapper.class, StudySession.class),
        map(com.project.exe.common.mapper.RoomActivityMapper.class, RoomActivity.class),
        map(com.project.exe.common.mapper.DocumentMapper.class, Document.class),
        map(com.project.exe.common.mapper.SummaryMapper.class, Summary.class),
        map(com.project.exe.common.mapper.FlashcardReviewMapper.class, FlashcardReview.class),
        map(com.project.exe.common.mapper.MindmapMapper.class, Mindmap.class),
        map(com.project.exe.common.mapper.QuizMapper.class, Quiz.class),
        map(com.project.exe.common.mapper.QuizQuestionMapper.class, QuizQuestion.class),
        map(com.project.exe.common.mapper.FlashcardMapper.class, Flashcard.class),
        map(com.project.exe.common.mapper.QuizAttemptMapper.class, QuizAttempt.class),
        map(com.project.exe.common.mapper.QuizAnalyticsMapper.class, QuizAnalytics.class),
        map(com.project.exe.common.mapper.ScheduleMapper.class, Schedule.class),
        map(com.project.exe.common.mapper.ScheduleExceptionMapper.class, ScheduleException.class),
        map(com.project.exe.common.mapper.QuickNoteMapper.class, QuickNote.class),
        map(com.project.exe.common.mapper.TeamMapper.class, Team.class),
        map(com.project.exe.common.mapper.TeamMemberMapper.class, TeamMember.class),
        map(com.project.exe.common.mapper.ProjectMapper.class, Project.class),
        map(com.project.exe.common.mapper.TaskMapper.class, Task.class),
        map(com.project.exe.common.mapper.TaskAssignmentMapper.class, TaskAssignment.class),
        map(com.project.exe.common.mapper.TaskDependencyMapper.class, TaskDependency.class),
        map(com.project.exe.common.mapper.TaskCommentMapper.class, TaskComment.class),
        map(com.project.exe.common.mapper.TaskActivityMapper.class, TaskActivity.class),
        map(com.project.exe.common.mapper.TaskAttachmentMapper.class, TaskAttachment.class),
        map(com.project.exe.common.mapper.MeetingMapper.class, Meeting.class),
        map(com.project.exe.common.mapper.MeetingParticipantMapper.class, MeetingParticipant.class),
        map(com.project.exe.common.mapper.MeetingSummaryMapper.class, MeetingSummary.class),
        map(com.project.exe.common.mapper.MeetingNoteMapper.class, MeetingNote.class),
        map(com.project.exe.common.mapper.NotificationMapper.class, Notification.class),
        map(com.project.exe.common.mapper.AuditLogMapper.class, AuditLog.class),
        map(com.project.exe.common.mapper.AppConfigMapper.class, AppConfig.class)
    );

    private static Map.Entry<Class<?>, Class<?>> map(Class<?> mapper, Class<?> entity) {
        return new AbstractMap.SimpleEntry<>(mapper, entity);
    }

    private EntityDtoCorrectness() {}

    public static List<String> checkAll() {
        List<String> errors = new ArrayList<>();
        checkEntities(errors);
        checkDtos(errors);
        checkMappers(errors);
        return errors;
    }

    private static void checkEntities(List<String> errors) {
        for (Class<?> clazz : ENTITY_CLASSES) {
            if (!clazz.isAnnotationPresent(Entity.class)) {
                errors.add("Missing @Entity: " + clazz.getSimpleName());
                continue;
            }
            Table t = clazz.getAnnotation(Table.class);
            String tableName = t != null ? t.name() : null;
            if (tableName == null || !EXPECTED_TABLES.contains(tableName)) {
                errors.add("Entity " + clazz.getSimpleName() + " has invalid or missing @Table(name): " + tableName);
            }
            try {
                Object o = tryInstantiate(clazz);
                if (o == null) errors.add("Could not instantiate entity: " + clazz.getSimpleName());
            } catch (Exception e) {
                errors.add("Entity instantiation failed " + clazz.getSimpleName() + ": " + e.getMessage());
            }
        }
    }

    private static void checkDtos(List<String> errors) {
        for (Class<?> dtoClass : DTO_CLASSES) {
            try {
                Object dto = tryInstantiate(dtoClass);
                if (dto == null) errors.add("Could not instantiate DTO: " + dtoClass.getSimpleName());
            } catch (Exception e) {
                errors.add("DTO instantiation failed " + dtoClass.getSimpleName() + ": " + e.getMessage());
            }
        }
    }

    private static void checkMappers(List<String> errors) {
        Map<Class<?>, Object> entityInstances = new HashMap<>();
        for (Class<?> ec : ENTITY_CLASSES) {
            try {
                entityInstances.put(ec, tryInstantiate(ec));
            } catch (Exception ignored) {}
        }
        for (Map.Entry<Class<?>, Class<?>> e : MAPPER_TO_ENTITY.entrySet()) {
            Class<?> mapperInterface = e.getKey();
            Class<?> entityClass = e.getValue();
            String implName = mapperInterface.getName() + "Impl";
            try {
                Class<?> implClass = Class.forName(implName);
                Object mapper = implClass.getDeclaredConstructor().newInstance();
                Object entity = entityInstances.get(entityClass);
                if (entity == null) continue;
                Method toDto = implClass.getMethod("toDto", entityClass);
                toDto.invoke(mapper, entity);
            } catch (ClassNotFoundException ex) {
                errors.add("Mapper impl not found (compile first): " + implName);
            } catch (Exception ex) {
                errors.add("Mapper " + mapperInterface.getSimpleName() + " toDto failed: " + ex.getMessage());
            }
        }
    }

    private static Object tryInstantiate(Class<?> clazz) throws Exception {
        try {
            Constructor<?> c = clazz.getDeclaredConstructor();
            c.setAccessible(true);
            return c.newInstance();
        } catch (NoSuchMethodException ignored) {
            Object builder = clazz.getMethod("builder").invoke(null);
            return builder.getClass().getMethod("build").invoke(builder);
        }
    }
}
