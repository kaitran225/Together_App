package app.together.workflow.room.listener;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.auth.repository.UserRepository;
import app.together.workflow.room.event.StudySessionCompletedEvent;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class GamificationListener {

    private static final int EXP_PER_MINUTE = 20;
    private static final int COMPLETION_BONUS_EXP = 50;
    private static final int MIN_EXP = 0;

    private final UserRepository userRepository;

    @EventListener
    @Transactional
    public void onStudySessionCompleted(StudySessionCompletedEvent event) {
        if (event == null || event.userSso() == null || event.userSso().isBlank()) {
            return;
        }

        var userOpt = userRepository.findByUserSso(event.userSso());
        if (userOpt == null || userOpt.isEmpty()) {
            return;
        }

        var user = userOpt.get();
        int durationMinutes = Math.max(0, event.durationMinutes());
        int expEarned = (durationMinutes * EXP_PER_MINUTE) + COMPLETION_BONUS_EXP;

        int currentExp = Math.max(MIN_EXP, user.getExp() == null ? 0 : user.getExp());
        user.setExp(currentExp + expEarned);
        userRepository.save(user);
    }
}
