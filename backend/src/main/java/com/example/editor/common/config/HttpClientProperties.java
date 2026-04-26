package com.example.editor.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * HTTP连接池配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "feign.httpclient")
public class HttpClientProperties {

    /**
     * 最大连接数
     */
    private int maxConnections = 200;

    /**
     * 每个路由最大连接数
     */
    private int maxConnectionsPerRoute = 50;

    /**
     * 连接请求超时时间（毫秒）
     */
    private long connectionTimeout = 5000;

    /**
     * Socket响应超时时间（毫秒）
     */
    private long socketTimeout = 60000;

    /**
     * 连接生命周期（毫秒）
     */
    private long connectionTtl = 1800000;

    /**
     * 空闲连接超时时间（毫秒）
     */
    private long idleTimeout = 600000;
}