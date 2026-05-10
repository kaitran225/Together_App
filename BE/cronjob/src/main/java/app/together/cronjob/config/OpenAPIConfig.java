package app.together.cronjob.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    private Server createServer(String url, String description) {
        Server server = new Server();
        server.setUrl(url);
        server.setDescription(description);
        return server;
    }

    private Contact createContact() {
        return new Contact()
                .email("together@app.com")
                .name("Together App")
                .url("https://together-app.com");
    }

    private Info createAppInfo() {
        return new Info()
                .title("Together App")
                .version("1.0")
                .contact(createContact())
                .description("This is a Spring boot app for Together App");
    }

    @Bean
    OpenAPI cronjobOpenAPI() {
        return new OpenAPI()
                .info(createAppInfo())
                .servers(List.of(
                        createServer("/", "This service (same host and port as this running instance)")));
    }

    @Bean
    GroupedOpenApi cronjobApi() {
        return GroupedOpenApi.builder()
                .group("cronjob-service")
                .packagesToScan("app.together.cronjob.controller")
                .build();
    }
}
