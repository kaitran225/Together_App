package com.project.exe.auth.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {
    private SecurityScheme createBearerScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .bearerFormat("JWT")
                .scheme("bearer");
    }

    private Server createServer(String url, String description) {
            Server server = new Server();
            server.setUrl(url);
            server.setDescription(description);
            return server;
    }

    private Contact CreateContact(){
        return new Contact()
                .email("Exe.com.edu")
                .name("Dev")
                .url("https:exe.com.edu");
    }

    private Info CreateAppInfo(){
        return new Info()
                .title("Exe FPTU")
                .version("1.0")
                .contact(CreateContact())
                .description("This is a Spring boot app for Exe FPTU");
    }

    @Bean
    OpenAPI myOpenAPI() {
        return new OpenAPI()
                .info(CreateAppInfo())
                .servers(List.of(
                        createServer("http://localhost:8081",
                                "Server URL in Development environment"),
                        createServer("https://envexe.example.com",
                                "Server URL in Testing environment"),
                        createServer("https://exe.example.com",
                                "Server URL in Production environment")))
                .addSecurityItem(
                        new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", createBearerScheme()));
    }

    @Bean
    GroupedOpenApi authApi(){
        return GroupedOpenApi.builder()
                .group("auth-service")
                .packagesToScan("com.project.exe.auth.controller")
                .build();
    }
}
