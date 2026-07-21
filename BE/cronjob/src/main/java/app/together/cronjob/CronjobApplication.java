package app.together.cronjob;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ops-style app: JSON health at {@code /api/v1/cronjob/health}, Actuator
 * {@code /actuator/health}.
 * Bao gồm các scheduled tasks chạy định kỳ:
 * - Reset streak hằng ngày vào lúc nửa đêm
 * - Gửi thông báo nhắc nhở task sắp đến hạn
 * - Dọn dẹp notification đã hết hạn
 */
@SpringBootApplication(scanBasePackages = { "app.together.cronjob", "app.together.common.shared",
        "app.together.common.workflow" })
@EnableJpaRepositories(basePackages = { "app.together" })
@EntityScan(basePackages = { "app.together" })
@EnableScheduling
public class CronjobApplication {

    public static void main(String[] args) {
        SpringApplication.run(CronjobApplication.class, args);
    }
}
