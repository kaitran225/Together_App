package app.together.cronjob.scheduler;

import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.enums.RoomRequestStatus;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.enums.RoomType;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import app.together.common.workflow.repository.UserRoomSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SocialRoomCleanupScheduler {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRoomSlotRepository userRoomSlotRepository;

    /**
     * Chạy mỗi phút để đóng phòng social đã hết hạn (expires_at &lt; now).
     */
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void cleanupExpiredSocialRooms() {
        log.debug("SocialRoomCleanupScheduler: Bắt đầu quét phòng social hết hạn...");

        Instant now = Instant.now();
        int closedCount = 0;
        for (Room room : roomRepository.findAll()) {
            if (!isActiveSocialRoom(room)) {
                continue;
            }
            if (room.getExpiresAt() == null || !room.getExpiresAt().isBefore(now)) {
                continue;
            }

            log.info("SocialRoomCleanupScheduler: Phòng social {} (Title: {}) đã hết hạn. Tiến hành đóng...",
                    room.getRoomId(), room.getTitle());
            closeSocialRoom(room, now);
            closedCount++;
        }

        if (closedCount > 0) {
            log.info("SocialRoomCleanupScheduler: Đã đóng {} phòng social hết hạn.", closedCount);
        }
    }

    /**
     * Mỗi 15 phút: đóng phòng social không còn user active nào
     * (phòng trống do leave không cập nhật leftAt / ghost members đã inactive).
     */
    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void cleanupEmptySocialRooms() {
        log.debug("SocialRoomCleanupScheduler: Bắt đầu quét phòng social trống...");

        Instant now = Instant.now();
        int closedCount = 0;
        for (Room room : roomRepository.findAll()) {
            if (!isActiveSocialRoom(room)) {
                continue;
            }

            long activeMembers = roomMemberRepository.countByRoomIdAndIsActiveTrue(room.getRoomId());
            if (activeMembers > 0) {
                continue;
            }

            log.info("SocialRoomCleanupScheduler: Phòng social {} (Title: {}) không còn user active. Đóng ngay...",
                    room.getRoomId(), room.getTitle());
            closeSocialRoom(room, now);
            closedCount++;
        }

        if (closedCount > 0) {
            log.info("SocialRoomCleanupScheduler: Đã đóng {} phòng social trống.", closedCount);
        }
    }

    private boolean isActiveSocialRoom(Room room) {
        return RoomType.SOCIAL.equals(room.getRoomType())
                && (RoomStatus.OPEN.name().equals(room.getStatus()) || RoomStatus.FULL.name().equals(room.getStatus()));
    }

    private void closeSocialRoom(Room room, Instant now) {
        room.setStatus(RoomRequestStatus.EXPIRED.name());
        room.setClosedAt(now);
        room.setClosedBy("SYSTEM");
        roomRepository.save(room);

        List<RoomMember> members = roomMemberRepository.findByRoomId(room.getRoomId());
        for (RoomMember member : members) {
            if (Boolean.TRUE.equals(member.getIsActive())) {
                member.setIsActive(false);
                member.setLeftAt(now);
                member.setLastActiveAt(now);
            }
        }
        roomMemberRepository.saveAll(members);

        if (room.getCreatedBy() != null) {
            userRoomSlotRepository.findById(room.getCreatedBy()).ifPresent(slot -> {
                if (slot.getUsedSlots() > 0) {
                    slot.setUsedSlots(slot.getUsedSlots() - 1);
                    userRoomSlotRepository.save(slot);
                    log.info("SocialRoomCleanupScheduler: Đã giải phóng 1 slot phòng cho user {}", room.getCreatedBy());
                }
            });
        }
    }
}
