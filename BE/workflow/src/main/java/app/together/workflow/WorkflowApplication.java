package app.together.workflow;

import app.together.workflow.room.config.RoomMediaProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Workflow service baseline: room management + WebSocket signaling.
 */
@SpringBootApplication(scanBasePackages = { "app.together.workflow", "app.together.common.shared", "app.together.common.workflow" })
@EnableJpaRepositories(basePackages = { "app.together" })
@EntityScan(basePackages = { "app.together" })
@ConfigurationPropertiesScan(basePackageClasses = RoomMediaProperties.class)
@EnableFeignClients(basePackages = { "app.together.workflow" })
public class WorkflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkflowApplication.class, args);
    }
}
