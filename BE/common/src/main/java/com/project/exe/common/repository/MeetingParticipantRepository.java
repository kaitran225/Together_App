package com.project.exe.common.repository;

import com.project.exe.common.entity.MeetingParticipant;
import com.project.exe.common.entity.MeetingParticipantId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingParticipantRepository extends JpaRepository<MeetingParticipant, MeetingParticipantId> {

    List<MeetingParticipant> findByMeetingId(Long meetingId);
}
