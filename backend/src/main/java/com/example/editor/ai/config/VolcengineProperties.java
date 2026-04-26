package com.example.editor.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 火山引擎API配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.volcengine")
public class VolcengineProperties {

    /**
     * API访问密钥
     */
    private String accessKey;

    /**
     * API秘密密钥
     */
    private String secretKey;

    /**
     * API服务端点
     */
    private String endpoint = "https://visual.volcengineapi.com";

    /**
     * 服务名称
     */
    private String service = "cv";

    /**
     * 区域
     */
    private String region = "cn-north-1";

    /**
     * API版本
     */
    private String version = "2022-08-31";

    /**
     * 检查凭证是否已配置
     */
    public boolean isConfigured() {
        return accessKey != null && !accessKey.isEmpty()
                && secretKey != null && !secretKey.isEmpty();
    }
}