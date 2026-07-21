package app.together.workflow.personal.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.QuickNote;
import app.together.common.workflow.entity.StudySession;
import app.together.common.workflow.entity.UserMasterData;
import app.together.common.workflow.enums.SessionType;
import app.together.common.workflow.repository.QuickNoteRepository;
import app.together.common.workflow.repository.StudySessionRepository;
import app.together.common.workflow.repository.UserMasterDataRepository;
import app.together.workflow.personal.dto.NoteAndSessionDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteAndSessionService {

    private final QuickNoteRepository quickNoteRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserMasterDataRepository userMasterDataRepository;
    private final ApplicationEventPublisher eventPublisher;

    // Quản lý ghi chú
    public QuickNoteResponse createNote(String userSso, CreateNoteRequest request) {
        requireUserSso(userSso);
        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_QUICK_NOTE_CONTENT_REQUIRED);
        }

        QuickNote quickNote = QuickNote.builder()
                .userSso(userSso)
                .content(request.content().trim())
                .isPinned(Boolean.TRUE.equals(request.isPinned()))
                .tags(request.tags())
                .linkedToType(request.linkedToType())
                .linkedToId(request.linkedToId())
                .build();

        QuickNote saved = quickNoteRepository.save(quickNote);
        return toQuickNoteResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<QuickNoteResponse> getMyNotes(String userSso) {
        requireUserSso(userSso);
        return quickNoteRepository.findByUserSsoAndDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(userSso).stream()
                .map(this::toQuickNoteResponse)
                .toList();
    }

    public void deleteNote(String userSso, Long noteId){
        requireUserSso(userSso);
        QuickNote note = quickNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUICK_NOTE_NOT_FOUND, noteId));

        if(!note.getUserSso().equals(userSso)){
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        note.setDeletedAt(Instant.now());
        quickNoteRepository.save(note);
    }

    // Quản lý phiên tự học + tích EXP
    public StudySessionResponse startStudySession(String userSso, StartSessionRequest request){
        requireUserSso(userSso);
        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso)
                .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(userSso).build()));

        StudySession session = StudySession.builder()
                .userMasterDataId(masterData.getMasterDataId())
                .roomId(request.roomId())
                .sessionType(request.sessionType() != null ? request.sessionType().toUpperCase() : SessionType.SELF_STUDY.name())
                .startTime(Instant.now())
                .expEarned(0) // Khởi tạo kinh nghiệm mới là là 0
                .build();

        StudySession saved = studySessionRepository.save(session);
        return toSessionResponse(saved);
    }

    public StudySessionResponse endStudySession(Long sessionId, String userSso){
        requireUserSso(userSso);
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_STUDY_SESSION_NOT_FOUND, sessionId));

        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso)
                .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(userSso).build()));

        if(!session.getUserMasterDataId().equals(masterData.getMasterDataId())){
            throw new BadRequestException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }

        Instant now = Instant.now();
        session.setEndTime(now);

        // Tính kình nghiệm
        long minutesStudied = Duration.between(session.getStartTime(), now).toMinutes(); // chuyển sang phút
        int expEarned = (int) minutesStudied;
        if(expEarned <= 0){
            expEarned = 1; // học dưới 1 phút vẫn được 1 điểm kinh nghiệm
        }

        session.setExpEarned(expEarned);
        StudySession  saved = studySessionRepository.save(session);

        // Bắn sự kiện bất đồng bộ nội bộ để service Gamification/Auth bắt được để cộng Exp/Streak
        eventPublisher.publishEvent(new app.together.workflow.room.event.StudySessionCompletedEvent(userSso,
                (int) minutesStudied, now));

        return toSessionResponse(saved); // có thể thông báo hệ thống gamification về kinh nghiệm mới
    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

    @Transactional(readOnly = true)
    public List<Double> getWeeklyStudyHours(String userSso) {
        requireUserSso(userSso);
        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso).orElse(null);
        if (masterData == null) {
            return List.of(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        }

        List<StudySession> sessions = studySessionRepository.findByUserMasterDataId(masterData.getMasterDataId());
        
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        
        double[] hoursPerDay = new double[7]; // 0: Mon, 1: Tue, ... 6: Sun
        
        for (StudySession session : sessions) {
            if (session.getStartTime() == null) continue;
            Instant end = session.getEndTime() != null ? session.getEndTime() : Instant.now();
            LocalDate sessionDate = session.getStartTime().atZone(ZoneId.systemDefault()).toLocalDate();
            
            if (!sessionDate.isBefore(monday) && !sessionDate.isAfter(monday.plusDays(6))) {
                int dayIndex = sessionDate.getDayOfWeek().getValue() - 1;
                long durationSeconds = Duration.between(session.getStartTime(), end).toSeconds();
                double durationHours = (double) durationSeconds / 3600.0;
                hoursPerDay[dayIndex] += durationHours;
            }
        }
        
        return Arrays.stream(hoursPerDay).boxed().toList();
    }

    public QuickNoteResponse toQuickNoteResponse(QuickNote q) {
        return new QuickNoteResponse(
                q.getNoteId(),
                q.getContent(),
                q.getIsPinned(),
                q.getTags(),
                q.getLinkedToId(),
                q.getLinkedToType()
        );
    }

    public StudySessionResponse toSessionResponse(StudySession s) {
        return new StudySessionResponse(
                s.getSessionId(),
                s.getRoomId(),
                s.getSessionType(),
                s.getStartTime(),
                s.getEndTime(),
                s.getExpEarned()
        );
    }
}
