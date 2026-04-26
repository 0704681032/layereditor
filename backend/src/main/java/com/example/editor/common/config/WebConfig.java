package com.example.editor.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.storage.local-path}")
    private String storagePath;

    // CORS allowed origins must be configured via environment variable
    // No default value for production safety
    @Value("${app.cors.allowed-origins:}")
    private String[] allowedOrigins;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + storagePath + "/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Use configured origins or fallback to development defaults if empty
        String[] origins = (allowedOrigins == null || allowedOrigins.length == 0 ||
                           (allowedOrigins.length == 1 && allowedOrigins[0].isEmpty()))
            ? new String[]{"http://localhost:5173", "http://localhost:3000"}
            : allowedOrigins;

        registry.addMapping("/api/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        registry.addMapping("/uploads/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}