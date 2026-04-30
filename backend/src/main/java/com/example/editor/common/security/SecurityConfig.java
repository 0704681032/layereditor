package com.example.editor.common.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.auth.username:editor}")
    private String authUsername;

    @Value("${app.auth.password:editor}")
    private String authPassword;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String[] allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Enable CORS with configurable origins
            .cors(cors -> cors.configurationSource(request -> {
                var config = new CorsConfiguration();
                config.setAllowedOrigins(List.of(allowedOrigins));
                config.addAllowedMethod("*");
                config.addAllowedHeader("*");
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);
                return config;
            }))
            // Stateless session for SPA API
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // CSRF disabled for stateless API (no cookies for session)
            .csrf(AbstractHttpConfigurer::disable)
            // HTTP Basic authentication
            .httpBasic(basic -> {})
            // Public: static uploads, actuator health. Protected: all /api/**
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            );
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        return new InMemoryUserDetailsManager(
            User.builder()
                .username(authUsername)
                .password(passwordEncoder.encode(authPassword))
                .roles("USER")
                .build()
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
