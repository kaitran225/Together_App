package app.together.read;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Read service baseline: public health endpoint only.
 */
@SpringBootApplication

// 1. Ép Spring quét các @Service, @Component ở cả 2 nhánh package
@ComponentScan(basePackages = { "app.together.read", "app.together.common" })

// 2. Ép Spring Data JPA quét tìm các interface Repository ở nhánh common
@EnableJpaRepositories(basePackages = { "app.together.common.workflow.repository" })

// 3. Ép Hibernate quét tìm các class @Entity (bắt buộc nếu Repository của bạn
// gọi đến Entity nằm ở nhánh common)
@EntityScan(basePackages = { "app.together.common.workflow.entity" })
public class ReadApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReadApplication.class, args);
    }
}
