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
     * Chạy mỗi phút một lần để quét các phòng social hết hạn
     * (khi expires_at được set và bé hơn thời điểm hiện tại).
     */
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void cleanupExpiredSocialRooms() {
        log.debug("SocialRoomCleanupScheduler: Bắt đầu quét phòng social hết hạn...");

        Instant now = Instant.now();
        List<Room> allRooms = roomRepository.findAll();

        int closedCount = 0;
        for (Room room : allRooms) {
            if (RoomType.SOCIAL.equals(room.getRoomType())
                    && room.getExpiresAt() != null
                    && room.getExpiresAt().isBefore(now)
                    && (RoomStatus.OPEN.name().equals(room.getStatus()) || RoomStatus.FULL.name().equals(room.getStatus()))) {

                log.info("SocialRoomCleanupScheduler: Phòng social {} (Title: {}) đã hết hạn sau 1 tiếng không có host. Tiến hành đóng...",
                        room.getRoomId(), room.getTitle());

                // Set status là EXPIRED
                room.setStatus(RoomRequestStatus.EXPIRED.name());
                room.setClosedAt(now);
                room.setClosedBy("SYSTEM");
                roomRepository.save(room);

                // Hủy kích hoạt tất cả active members
                List<RoomMember> members = roomMemberRepository.findByRoomId(room.getRoomId());
                for (RoomMember member : members) {
                    if (Boolean.TRUE.equals(member.getIsActive())) {
                        member.setIsActive(false);
                        member.setLeftAt(now);
                        member.setLastActiveAt(now);
                    }
                }
                roomMemberRepository.saveAll(members);

                // Giải phóng slot cho người tạo phòng
                if (room.getCreatedBy() != null) {
                    userRoomSlotRepository.findById(room.getCreatedBy()).ifPresent(slot -> {
                        if (slot.getUsedSlots() > 0) {
                            slot.setUsedSlots(slot.getUsedSlots() - 1);
                            userRoomSlotRepository.save(slot);
                            log.info("SocialRoomCleanupScheduler: Đã giải phóng 1 slot phòng cho user {}", room.getCreatedBy());
                        }
                    });
                }

                closedCount++;
            }
        }

        if (closedCount > 0) {
            log.info("SocialRoomCleanupScheduler: Đã đóng {} phòng social hết hạn.", closedCount);
        }
    }
}
