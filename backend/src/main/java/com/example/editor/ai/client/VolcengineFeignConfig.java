package com.example.editor.ai.client;

import com.example.editor.ai.config.VolcengineProperties;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.Map;

/**
 * Feign configuration for Volcengine API signature authentication
 *
 * Volcengine uses OpenAPI style authentication similar to AWS Signature V4
 * Note: Not annotated with @Configuration to avoid global bean registration.
 * This config should be referenced via @FeignClient(configuration = VolcengineFeignConfig.class)
 */
@Slf4j
@RequiredArgsConstructor
public class VolcengineFeignConfig {

    private final VolcengineProperties properties;

    @Bean
    public RequestInterceptor volcengineSignatureInterceptor() {
        return new VolcengineSignatureInterceptor(properties);
    }

    /**
     * Request interceptor that adds Volcengine signature headers
     */
    @RequiredArgsConstructor
    public static class VolcengineSignatureInterceptor implements RequestInterceptor {

        private final VolcengineProperties properties;

        @Override
        public void apply(RequestTemplate template) {
            if (!properties.isConfigured()) {
                log.warn("Volcengine API credentials not configured");
                return;
            }

            String accessKey = properties.getAccessKey();
            String secretKey = properties.getSecretKey();
            String host = properties.getEndpoint().replace("https://", "").replace("http://", "");
            String service = properties.getService();
            String region = properties.getRegion();

            // Get current timestamp
            String now = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
                    .withZone(java.time.ZoneOffset.UTC)
                    .format(Instant.now());

            // Get query string from template
            String queryString = buildQueryString(template.queries());

            // Get body hash
            byte[] bodyBytes = template.body() != null ? template.body() : new byte[0];
            String bodyHash = sha256Hex(bodyBytes);

            // Build canonical headers
            String contentType = "application/json";
            String canonicalHeaders = "content-type:" + contentType + "\nhost:" + host + "\nx-date:" + now + "\n";
            String signedHeaders = "content-type;host;x-date";

            // Build canonical request
            String method = template.method();
            String path = template.path() != null ? template.path() : "/";
            String canonicalRequest = method + "\n" + path + "\n" + queryString + "\n" +
                    canonicalHeaders + "\n" + signedHeaders + "\n" + bodyHash;

            // Build string to sign
            String algorithm = "HMAC-SHA256";
            String credentialScope = now.substring(0, 8) + "/" + region + "/" + service + "/request";
            String stringToSign = algorithm + "\n" + now + "\n" + credentialScope + "\n" + sha256Hex(canonicalRequest.getBytes(StandardCharsets.UTF_8));

            // Calculate signature
            byte[] kDate = hmacSha256(secretKey.getBytes(StandardCharsets.UTF_8), now.substring(0, 8));
            byte[] kRegion = hmacSha256(kDate, region);
            byte[] kService = hmacSha256(kRegion, service);
            byte[] kSigning = hmacSha256(kService, "request");
            String signature = hex(hmacSha256(kSigning, stringToSign));

            // Build authorization header
            String authorization = algorithm + " Credential=" + accessKey + "/" + credentialScope +
                    ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

            // Add headers
            template.header("Content-Type", contentType);
            template.header("Host", host);
            template.header("X-Date", now);
            template.header("Authorization", authorization);
        }

        private String buildQueryString(Map<String, Collection<String>> queries) {
            if (queries == null || queries.isEmpty()) {
                return "";
            }
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, Collection<String>> entry : queries.entrySet()) {
                for (String value : entry.getValue()) {
                    if (sb.length() > 0) {
                        sb.append("&");
                    }
                    sb.append(entry.getKey()).append("=").append(value);
                }
            }
            return sb.toString();
        }

        private static String sha256Hex(byte[] data) {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(data);
                return hex(hash);
            } catch (Exception e) {
                throw new RuntimeException("SHA-256 failed", e);
            }
        }

        private static byte[] hmacSha256(byte[] key, String data) {
            try {
                Mac mac = Mac.getInstance("HmacSHA256");
                mac.init(new SecretKeySpec(key, "HmacSHA256"));
                return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                throw new RuntimeException("HMAC-SHA256 failed", e);
            }
        }

        private static String hex(byte[] bytes) {
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        }
    }
}