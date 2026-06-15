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
import org.springframework.dao.PermissionDeniedDataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NoteAndSessionService {

    private final QuickNoteRepository quickNoteRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserMasterDataRepository userMasterDataRepository;

    // Quản lý ghi chú
    public QuickNoteResponse createNote(String userSso, CreateNoteRequest request) {
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
        return quickNoteRepository.findByUserSsoAndDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(userSso).stream()
                .map(this::toQuickNoteResponse)
                .toList();
    }

    public void deleteNote(String userSso, Long noteId){
        QuickNote note = quickNoteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_QUICK_NOTE_NOT_FOUND, noteId));

        if(!note.getUserSso().equals(userSso)){
            throw new PermissionDeniedDataAccessException(MessageConstants.MESSAGE_PERMISSION_DENIED, null);
        }

        note.setDeletedAt(Instant.now());
        quickNoteRepository.save(note);
    }

    // Quản lý phiên tự học + tích EXP
    public StudySessionResponse startStudySession(String userSso, StartSessionRequest request){
        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_USER_NOT_FOUND, userSso));

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
        StudySession session = studySessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_STUDY_SESSION_NOT_FOUND, sessionId));

        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_USER_NOT_FOUND, userSso));

        if(!session.getUserMasterDataId().equals(masterData.getMasterDataId())){
            throw new PermissionDeniedDataAccessException(MessageConstants.MESSAGE_PERMISSION_DENIED, null);
        }

        Instant now = Instant.now();
        session.setEndTime(now);

        // Tính kình nghiệm
        long minutesStudied = Duration.between(session.getStartTime(), now).toMinutes(); // chuyển sang phút
        int expEarned = (int) (minutesStudied * 5);
        if(expEarned <= 0){
            expEarned = 1; // học dưới 1 phút vẫn được 1 điểm kinh nghiệm
        }

        session.setExpEarned(expEarned);
        StudySession  saved = studySessionRepository.save(session);

        return toSessionResponse(saved); // có thể thông báo hệ thống gamification về kinh nghiệm mới
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
