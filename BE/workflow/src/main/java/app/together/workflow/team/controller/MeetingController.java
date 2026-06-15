package app.together.workflow.team.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.team.dto.MeetingDtos.*;
import app.together.workflow.team.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;

    @PostMapping("/teams/{teamId}/meetings")
    public ApiResponse<MeetingResponse> createMeeting(
            @PathVariable Long teamId,
            @RequestBody CreateMeetingRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(meetingService.createMeeting(teamId, currentUserSso, request));
    }

    @PostMapping("/meetings/{meetingId}/join")
    public ApiResponse<MeetingResponse> joinMeeting(@PathVariable Long meetingId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(meetingService.joinMeeting(meetingId, currentUserSso));
    }

    @PostMapping("/meetings/{meetingId}/notes")
    public ApiResponse<MeetingNoteResponse> writeNote(
            @PathVariable Long meetingId,
            @RequestBody MeetingNoteRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(meetingService.writeNote(meetingId, currentUserSso, request));
    }

    @PostMapping("/meetings/{meetingId}/end")
    public ApiResponse<MeetingResponse> endMeeting(@PathVariable Long meetingId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(meetingService.endMeeting(meetingId, currentUserSso));
    }

    @GetMapping("/meetings/{meetingId}/summary")
    public ApiResponse<MeetingSummaryResponse> getMeetingSummary(@PathVariable Long meetingId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(meetingService.getMeetingSummary(meetingId, currentUserSso));
    }
}
