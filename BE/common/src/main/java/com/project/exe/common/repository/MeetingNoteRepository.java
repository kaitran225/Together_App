package com.project.exe.common.repository;

import com.project.exe.common.entity.MeetingNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingNoteRepository extends JpaRepository<MeetingNote, Long> {

    List<MeetingNote> findByMeetingId(Long meetingId);
}
