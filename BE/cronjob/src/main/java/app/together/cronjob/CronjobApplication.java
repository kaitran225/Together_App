package app.together.cronjob;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ops-style app: JSON health at {@code /api/v1/cronjob/health}, Actuator {@code /actuator/health}
 * (no domain jobs in baseline).
 */
@SpringBootApplication
public class CronjobApplication {

    public static void main(String[] args) {
        SpringApplication.run(CronjobApplication.class, args);
    }
}
