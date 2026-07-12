package app.together.workflow.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSecurity
public class ResourceServerConfig {

        @Value("${app.cors.allowed-origins:http://localhost:5173}")
        private String allowedOrigins;

        @Bean
        @Order(1)
        public SecurityFilterChain websocketSecurityFilterChain(HttpSecurity http) throws Exception {
                http
                                .securityMatchers(matchers -> matchers.requestMatchers(
                                        new AntPathRequestMatcher("/ws/**"),
                                        new AntPathRequestMatcher("/ws")
                                ))
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
                return http.build();
        }

        @Bean
        @Order(2)
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(Customizer.withDefaults())
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                new AntPathRequestMatcher("/v3/api-docs/**"),
                                                                new AntPathRequestMatcher("/swagger-ui/**"),
                                                                new AntPathRequestMatcher("/swagger-ui.html"))
                                                .permitAll()
                                                .requestMatchers(new AntPathRequestMatcher("/api/v1/workflow/health")).permitAll()
                                                .requestMatchers(new AntPathRequestMatcher("/api/v1/workflow/payos/webhook")).permitAll()
                                                .requestMatchers(new AntPathRequestMatcher("/api/v1/workflow/payment/payos/webhook")).permitAll()
                                                .requestMatchers(new AntPathRequestMatcher("/api/v1/workflow/payment/coin-packages")).permitAll()
                                                .requestMatchers(new AntPathRequestMatcher("/api/v1/workflow/public/**")).permitAll()
                                                .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()
                                                .anyRequest().authenticated())
                                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
                return http.build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("*"));
                configuration.setAllowCredentials(true);
                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
