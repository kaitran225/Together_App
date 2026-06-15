package app.together.workflow.personal.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.personal.dto.NoteAndSessionDtos.*;
import app.together.workflow.personal.service.NoteAndSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/tracking")
@RequiredArgsConstructor
public class NoteAndSessionController {

    private final NoteAndSessionService noteAndSessionService;

    @PostMapping("/notes")
    public ApiResponse<QuickNoteResponse> createNotes(@RequestBody CreateNoteRequest request){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(noteAndSessionService.createNote(currentUserSso, request));
    }

    @GetMapping("/notes")
    public ApiResponse<List<QuickNoteResponse>> getMyNotes(){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(noteAndSessionService.getMyNotes(currentUserSso));
    }

    @DeleteMapping("/notes/{noteId}")
    public ApiResponse<Void> deleteNote(@PathVariable Long noteId){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        noteAndSessionService.deleteNote(currentUserSso, noteId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/sessions")
    public ApiResponse<StudySessionResponse> startSession(@RequestBody StartSessionRequest request){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(noteAndSessionService.startStudySession(currentUserSso, request));
    }

    @PostMapping("/sessions/{sessionId}/end")
    public ApiResponse<StudySessionResponse> endSession(@PathVariable Long sessionId){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(noteAndSessionService.endStudySession(sessionId, currentUserSso));
    }
}
