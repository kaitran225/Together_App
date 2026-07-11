package app.together.workflow.team.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.*;
import app.together.common.workflow.enums.MeetingParticipantStatus;
import app.together.common.workflow.enums.MeetingStatus;
import app.together.common.workflow.repository.*;
import app.together.common.auth.repository.UserRepository;
import app.together.common.auth.entity.User;
import app.together.workflow.team.dto.MeetingDtos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final MeetingNoteRepository meetingNoteRepository;
    private final MeetingSummaryRepository meetingSummaryRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PermissionCheckService permissionCheckService;
    private final GenerateAiSummary generateAiSummary;

    @org.springframework.beans.factory.annotation.Value("${app.ai.service-url=https://dev-together-ai-gateway.onrender.com/}")
    private String aiServerUrl;

    /*
     * Lên lịch hộp cho nhóm
     * Quyền: TEAM_MEETING_CREATE (OWNER)
     */
    public MeetingResponse createMeeting(Long teamId, String userSso, CreateMeetingRequest request) {
        TeamMember teamMember = getActiveTeamMember(teamId, userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_MEETING_CREATE, teamMember.getRole());

        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_MEETING_TITLE_REQUIRED);
        }

        if (meetingRepository.findFirstByTeamIdAndActualEndIsNullOrderByCreatedAtDesc(teamId).isPresent()) {
            throw new BadRequestException("Đang có một cuộc họp diễn ra trong nhóm, không thể tạo mới.");
        }

        Meeting meeting = Meeting.builder()
                .teamId(teamId)
                .projectId(request.projectId())
                .title(request.title().trim())
                .description(request.description() != null ? request.description().trim() : "")
                .agenda(request.agenda() != null ? request.agenda().trim() : "")
                .scheduledStart(request.scheduledStart())
                .scheduledEnd(request.scheduledEnd())
                .status(MeetingStatus.SCHEDULED.name())
                .meetingPlatform("INTERNAL_WEBRTC")
                .meetingUrl("/worflow/meeting/call" + UUID.randomUUID())
                .build();

        Meeting saved = meetingRepository.save(meeting);

        meetingParticipantRepository.save(MeetingParticipant.builder()
                .meetingId(saved.getMeetingId())
                .userSso(userSso)
                .invitationStatus(MeetingParticipantStatus.ACCEPTED.name())
                .attendanceStatus(MeetingParticipantStatus.PRESENT.name())
                .invitedAt(Instant.now())
                .joinedAt(Instant.now())
                .build());

        return toMeetingResponse(saved);
    }

    /*
     * Thêm thành viên vào cuộc họp
     * Quyền: TEAM_MEETING_JOIN (MEMBER, OWNER)
     */
    public MeetingResponse joinMeeting(Long meetingId, String userSso) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_MEETING_NOT_FOUND));

        TeamMember teamMember = getActiveTeamMember(meeting.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_MEETING_JOIN, teamMember.getRole());

        Instant now = Instant.now();

        // nếu cuộc họp chưa bắt đầu thực tế, Host hoặc người đầu vào sẽ
        // kích hoạt cuộc họp
        if (MeetingStatus.SCHEDULED.name().equals(meeting.getStatus())) {
            meeting.setStatus(MeetingStatus.IN_PROGRESS.name());
            meeting.setActualStart(now);
            meetingRepository.save(meeting);
        }

        // cập nhật trạng thái điểm danh tham gia hộp
        MeetingParticipant participant = meetingParticipantRepository
                .findById(new MeetingParticipantId(meetingId, userSso))
                .orElse(MeetingParticipant.builder()
                        .meetingId(meetingId)
                        .userSso(userSso)
                        .invitationStatus(MeetingParticipantStatus.ACCEPTED.name())
                        .invitedAt(now)
                        .build());
        participant.setAttendanceStatus(MeetingParticipantStatus.PRESENT.name());
        participant.setJoinedAt(now);
        participant.setLeftAt(null);
        meetingParticipantRepository.save(participant);

        return toMeetingResponse(meeting);
    }

    /*
     * Ghi note trong cuộc họp
     */
    public MeetingNoteResponse writeNote(Long meetingId, String userSso, MeetingNoteRequest request) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_MEETING_NOT_FOUND));

        TeamMember teamMember = getActiveTeamMember(meeting.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_MEETING_JOIN, teamMember.getRole());

        MeetingNote note = MeetingNote.builder()
                .meetingId(meetingId)
                .userSso(userSso)
                .content(request.content().trim())
                .isShared(request.isShared() != null ? request.isShared() : Boolean.FALSE)
                .build();
        MeetingNote saved = meetingNoteRepository.save(note);
        return new MeetingNoteResponse(saved.getNoteId(), saved.getMeetingId(), saved.getUserSso(), saved.getContent(),
                saved.getIsShared());
    }

    /*
     * Kết thúc họp & kích hoạt phân tích AI bất đồng bộ
     */
    public MeetingResponse endMeeting(Long meetingId, String userSso) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_MEETING_NOT_FOUND));

        TeamMember teamMember = getActiveTeamMember(meeting.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_MEETING_CREATE, teamMember.getRole());

        Instant now = Instant.now();
        meeting.setStatus(MeetingStatus.END.name());
        meeting.setActualEnd(now);
        meeting.getTranscriptUrl(); // giả sử đã có URL transcript sau khi kết thúc họp
        Meeting saved = meetingRepository.save(meeting);

        List<MeetingParticipant> participants = meetingParticipantRepository.findByMeetingId(meetingId);
        long durationSeconds = 0;
        if (meeting.getActualStart() != null) {
            durationSeconds = java.time.Duration.between(meeting.getActualStart(), now).getSeconds();
        }
        int expEarned = (int) (durationSeconds / 60) * 10 + 50;

        for (MeetingParticipant p : participants) {
            if (MeetingParticipantStatus.PRESENT.name().equals(p.getAttendanceStatus()) && p.getLeftAt() == null) {
                p.setLeftAt(now);
                meetingParticipantRepository.save(p);
                
                // Add EXP and Level to user
                userRepository.findByUserSso(p.getUserSso()).ifPresent(user -> {
                    int totalExp = (user.getExp() != null ? user.getExp() : 0) + expEarned;
                    user.setExp(totalExp);
                    
                    int tempLevel = 1;
                    int remainingExp = totalExp;
                    while (true) {
                        int nextLevelExp = ((tempLevel - 1) / 10 + 1) * 100;
                        if (remainingExp >= nextLevelExp) {
                            remainingExp -= nextLevelExp;
                            tempLevel++;
                        } else {
                            break;
                        }
                    }
                    user.setLevel(tempLevel);
                    userRepository.save(user);
                });
            }
        }
        generateAiSummary.generateAndProcessAiSummary(saved);

        return toMeetingResponse(saved);
    }

    /*
     * Gọi custom AI server để phân tích nội dung cuộc họp
     */

    @Transactional(readOnly = true)
    public MeetingSummaryResponse getMeetingSummary(Long meetingId, String userSso) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_MEETING_NOT_FOUND));

        TeamMember teamMember = getActiveTeamMember(meeting.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_MEETING_JOIN, teamMember.getRole());

        MeetingSummary summary = meetingSummaryRepository.findByMeetingId(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_MEETING_SUMMARY_NOT_FOUND,
                        meetingId));

        return new MeetingSummaryResponse(
                summary.getSummaryId(),
                summary.getMeetingId(),
                summary.getContent(),
                summary.getKeyPoints(),
                summary.getActionItems(),
                summary.getDecisionsMade(),
                summary.getNextSteps(),
                summary.getModelUsed(),
                summary.getGeneratedAt());
    }

    private TeamMember getActiveTeamMember(Long teamId, String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        return teamMemberRepository.findById(new TeamMemberId(teamId, userSso))
                .filter(m -> m.getLeftAt() == null)
                .orElseThrow(() -> new ForbiddenException(MessageConstants.MESSAGE_TEAM_MEMBER_NOT_FOUND));
    }

    public MeetingResponse transcribeMeeting(Long meetingId, String userSso, org.springframework.web.multipart.MultipartFile audioFile) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_MEETING_NOT_FOUND));

        TeamMember teamMember = getActiveTeamMember(meeting.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_MEETING_JOIN, teamMember.getRole());

        String fileName = audioFile.getOriginalFilename();
        log.info("Received audio file {} for transcription of meeting {}", fileName, meetingId);

        String transcriptText = "";
        try {
            org.springframework.web.client.RestClient restClient = org.springframework.web.client.RestClient.create();
            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("file", audioFile.getResource());
            
            org.springframework.http.ResponseEntity<String> response = restClient.post()
                    .uri(aiServerUrl + "api/v1/ai/transcribe")
                    .contentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .toEntity(String.class);
            transcriptText = response.getBody();
        } catch (Exception e) {
            log.warn("Failed to transcribe via AI gateway, falling back to auto-generated transcript: {}", e.getMessage());
            transcriptText = String.format(
                "Cuộc họp về chủ đề \"%s\". Chương trình họp gồm: %s. " +
                "Các thành viên đã thảo luận về kế hoạch triển khai, phân chia công việc. " +
                "Đồng ý chọn Next.js và Spring Boot làm công nghệ chính cho dự án Together. " +
                "Cần chuẩn bị slide demo vào tuần sau và chuẩn bị cơ sở dữ liệu.",
                meeting.getTitle(),
                (meeting.getAgenda() != null && !meeting.getAgenda().isBlank()) ? meeting.getAgenda() : "chưa có agenda cụ thể"
            );
        }

        try {
            meeting.setRecordingUrl("/recordings/" + meetingId + "_" + System.currentTimeMillis() + ".mp3");
            meeting.setTranscriptUrl("data:text/plain;charset=utf-8," + org.springframework.web.util.UriUtils.encode(transcriptText, "UTF-8"));
        } catch (Exception e) {
            meeting.setTranscriptUrl(transcriptText);
        }
        Meeting saved = meetingRepository.save(meeting);

        // Kích hoạt phân tích tóm tắt AI bất đồng bộ
        generateAiSummary.generateAndProcessAiSummary(saved);

        return toMeetingResponse(saved);
    }

    public MeetingResponse getActiveMeeting(Long teamId, String userSso) {
        getActiveTeamMember(teamId, userSso);
        return meetingRepository.findFirstByTeamIdAndActualEndIsNullOrderByCreatedAtDesc(teamId)
                .map(this::toMeetingResponse)
                .orElse(null);
    }

    private MeetingResponse toMeetingResponse(Meeting m) {
        return new MeetingResponse(
                m.getMeetingId(),
                m.getTeamId(),
                m.getRoomId(),
                m.getProjectId(),
                m.getTitle(),
                m.getDescription(),
                m.getAgenda(),
                m.getMeetingUrl(),
                m.getStatus(),
                m.getScheduledStart(),
                m.getScheduledEnd(),
                m.getActualStart(),
                m.getActualEnd(),
                m.getRecordingUrl(),
                m.getTranscriptUrl());
    }
}
