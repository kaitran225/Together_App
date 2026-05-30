package app.together.workflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Workflow service — domain APIs + AI tool apply.
 */
@SpringBootApplication(scanBasePackages = { "app.together.workflow", "app.together.common.shared" })
@EntityScan(basePackages = "app.together.common.workflow.entity")
@EnableJpaRepositories(basePackages = "app.together.common.workflow.repository")
public class WorkflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkflowApplication.class, args);
    }
}
