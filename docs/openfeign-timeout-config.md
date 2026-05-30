# OpenFeign 超时配置指南

## 背景

当 `@FeignClient` 的 `name` 和 `contextId` 为 `direct-OneServiceSao` 时，如何正确配置超时时间。

## 两层超时架构

OpenFeign 的超时由两层协作完成，Feign 层优先：

```
请求发出
  │
  ├─ HttpClient 层（连接池管理，兜底）
  │   ├─ connection-timeout           建立 TCP 连接
  │   ├─ connection-request-timeout   从连接池获取连接
  │   └─ time-to-live                 连接池中连接存活时间
  │
  ├─ Feign 层（精确控制，优先级更高）
  │   ├─ connectTimeout              连接超时
  │   └─ readTimeout                 读取超时
  │
  └─ 返回响应
```

**原则：HttpClient 层管建连接（兜底），Feign 层管读写数据（精确控制，优先）。**

### HttpClient 层参数一览

| 参数 | 含义 | 生产建议 |
|------|------|----------|
| `connection-timeout` | 建立 TCP/TLS 连接的超时 | 10000ms（兜底值） |
| `connection-request-timeout` | 从连接池获取连接的等待时间 | 100-1000ms |
| `time-to-live` | 连接池中连接存活时间 | 600s（10分钟） |
| `max-connections` | 全局最大连接数 | 按并发估算 |
| `max-connections-per-route` | 单个目标地址最大连接数 | 按下游峰值 QPS 估算 |

> 注意：HttpClient 层没有 `socket-timeout` 的自动配置属性，读超时统一由 Feign 的 `readTimeout` 控制。

## POM 依赖

### 版本对应关系

| Spring Boot | Spring Cloud | Feign Starter | HttpClient 依赖 | feign 版本 |
|---|---|---|---|---|
| 1.5.x | Edgware | `spring-cloud-starter-feign` 1.4.x | `feign-httpclient` | 9.5.0 |
| 2.0.x | Finchley | `spring-cloud-starter-openfeign` 2.0.x | `feign-httpclient` | ~9.5.1 |
| 2.1.x | Greenwich | `spring-cloud-starter-openfeign` 2.1.x | `feign-httpclient` | ~10.1 |
| 2.2.x | Hoxton | `spring-cloud-starter-openfeign` 2.2.x | `feign-httpclient` | ~11.0 |
| 2.4.x–2.7.x | 2020.x / 2021.x | `spring-cloud-starter-openfeign` 3.x | `feign-httpclient` | ~11.8+ |
| **3.x** | **2022.x+** | **`spring-cloud-starter-openfeign` 4.x** | **`feign-hc5`** | **BOM 管理** |

> 本项目使用 Spring Boot 3.3.6 + Spring Cloud 2023.0.3，采用 `feign-hc5`，版本由 BOM 控制，无需手动指定。

### 底层 HttpClient 选型（三选一，不要同时引入）

| 依赖 | 底层 | 适用场景 | 切换配置 |
|------|------|----------|----------|
| `feign-httpclient` | Apache HttpClient 4.x | 老项目（Boot 1.x/2.x），稳定 | `feign.httpclient.enabled=true` |
| `feign-hc5` | Apache HttpClient 5.x | 新项目（Boot 3.x）推荐，性能更好 | `feign.httpclient.hc5.enabled=true` |
| `feign-okhttp` | OkHttp | 轻量场景 | `feign.okhttp.enabled=true` |

### 老版本（Spring Cloud Netflix Feign）

```xml
<!-- Feign Starter（老版） -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-feign</artifactId>
    <version>1.4.7.RELEASE</version>
</dependency>

<!-- Apache HttpClient 4.x -->
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-httpclient</artifactId>
    <version>9.5.0</version>
</dependency>
```

### 新版本（Spring Cloud OpenFeign）

```xml
<!-- Feign Starter（新版） -->
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>

<!-- Apache HttpClient 5.x（推荐） -->
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-hc5</artifactId>
</dependency>

<!-- 或 OkHttp -->
<!--
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-okhttp</artifactId>
</dependency>
-->
```

## 配置方式

### 老版本（2.x / Spring Boot 2）— application.properties

```properties
# HttpClient 层（兜底）
feign.httpclient.enabled=true
feign.httpclient.connection-timeout=10000
feign.httpclient.connection-request-timeout=3000
feign.httpclient.time-to-live=900
feign.httpclient.max-connections=200
feign.httpclient.max-connections-per-route=50

# Feign 层（精确控制，优先）
feign.client.config.default.connectTimeout=3000
feign.client.config.default.readTimeout=5000

# 针对特定服务的超时
feign.client.config.direct-OneServiceSao.connectTimeout=5000
feign.client.config.direct-OneServiceSao.readTimeout=10000
```

### 老版本（2.x / Spring Boot 2）— YAML 完整示例

```yaml
feign:
  httpclient:
    enabled: true
    connection-timeout: 10000
    connection-request-timeout: 3000
    time-to-live: 900
    max-connections: 200
    max-connections-per-route: 50
  client:
    config:
      default:
        connectTimeout: 3000
        readTimeout: 5000
      internal-fast:
        connectTimeout: 500
        readTimeout: 1000
      third-party:
        connectTimeout: 5000
        readTimeout: 15000
      ai-service:
        connectTimeout: 5000
        readTimeout: 60000
```

### 新版本（3.x / Spring Boot 3）— application.properties

```properties
# 全局默认超时
spring.cloud.openfeign.client.config.default.connectTimeout=3000
spring.cloud.openfeign.client.config.default.readTimeout=5000

# 针对 direct-OneServiceSao 的超时
spring.cloud.openfeign.client.config.direct-OneServiceSao.connectTimeout=5000
spring.cloud.openfeign.client.config.direct-OneServiceSao.readTimeout=10000
```

### 新版本（3.x / Spring Boot 3）— YAML 完整示例

```yaml
spring:
  cloud:
    openfeign:
      httpclient:
        hc5:
          enabled: true
        connection-timeout: 10000
        connection-request-timeout: 3000
        time-to-live: 600
        max-connections: 200
        max-connections-per-route: 50
      client:
        config:
          default:
            connectTimeout: 3000
            readTimeout: 5000
          internal-fast:
            connectTimeout: 500
            readTimeout: 1000
          third-party:
            connectTimeout: 5000
            readTimeout: 15000
          ai-service:
            connectTimeout: 5000
            readTimeout: 60000
```

> 单位均为毫秒（除 `time-to-live` 配合 `time-to-live-unit` 使用时）。特定服务的配置优先级高于 `default`。

### 新老版本配置前缀对比

| 版本 | Feign 层配置前缀 | HttpClient 层配置前缀 |
|------|-----------------|---------------------|
| 老版（2.x） | `feign.client.config.*` | `feign.httpclient.*` |
| 新版（3.x） | `spring.cloud.openfeign.client.config.*` | `feign.httpclient.*`（不变） |

> 核心区别仅在 Feign 层的命名空间。`httpclient` 相关配置在两个版本中都在 `feign.httpclient.*` 下，没有变化。

## 源码分析：为什么 key 中的 `-` 不需要去掉

### 1. 配置查找链路

```
FeignClientFactoryBean.configureFeign()
  → FeignClientProperties.getConfig().get(contextId)
```

核心代码（`FeignClientFactoryBean.java`）：

```java
protected void configureFeign(FeignClientFactory context, Feign.Builder builder) {
    FeignClientProperties properties = beanFactory.getBean(FeignClientProperties.class);
    if (properties != null && inheritParentContext) {
        if (properties.isDefaultToProperties()) {
            configureUsingConfiguration(context, builder);
            configureUsingProperties(
                properties.getConfig().get(properties.getDefaultConfig()), // default 配置
                properties.getConfig().get(contextId),                      // ← 关键：用 contextId 做 Map.get()
                builder);
        }
    }
}
```

这里 `contextId` 就是 `@FeignClient(contextId = "direct-OneServiceSao")` 的原值，执行的是 `HashMap.get("direct-OneServiceSao")`，**精确匹配，不做任何转换**。

### 2. 配置注入链路

`FeignClientProperties` 定义如下：

```java
@ConfigurationProperties("feign.client")  // 2.x
// 或
@ConfigurationProperties("spring.cloud.openfeign.client")  // 3.x
public class FeignClientProperties {
    private Map<String, FeignClientConfiguration> config = new HashMap<>();
    // getter/setter
}
```

Spring Boot 的 `Binder` 负责将 properties 文件中的值注入到这个 Map。

### 3. Map key 不受 relaxed binding 影响

Spring Boot 的 relaxed binding（名称规范化）规则：

- **属性路径**会被规范化：`spring.cloud.openfeign.client.config` 匹配时忽略大小写、`-`、`_`
- **Map key 不被规范化**：Map 的 key 作为字面量字符串原样保留

也就是说：

```properties
spring.cloud.openfeign.client.config.direct-OneServiceSao.connectTimeout=5000
```

- `spring.cloud.openfeign.client.config` → 路径部分，走 relaxed binding 匹配
- `direct-OneServiceSao` → Map key，**原样保留**，不做任何转换
- `connectTimeout` → `FeignClientConfiguration` 的字段，走 relaxed binding 匹配

所以 Map 中存储的 key 就是 `"direct-OneServiceSao"`，与 `contextId` 精确一致，查找不会失败。

### 4. 本项目现有配置参考（未实测）

项目中 `VolcengineVisualClient.java` 有类似的带 `-` 的 name 配置：

```java
@FeignClient(name = "volcengine-visual", url = "${app.volcengine.endpoint}")
```

对应配置（`application.yml`）：

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          volcengine-visual:
            connectTimeout: 5000
            readTimeout: 60000
```

> 注意：这只是项目中已有的写法，**并未实际验证超时是否生效**。要真正验证，建议：
> 1. 将 `readTimeout` 设为极小值（如 `1`），观察请求是否超时
> 2. 或通过 debug 在 `FeignClientFactoryBean.configureFeign()` 打断点，查看 `properties.getConfig()` 中 key 是否正确

## 总结

| 问题 | 结论 |
|------|------|
| key 中的 `-` 需要去掉吗？ | **不需要**，必须原样保留 |
| key 区分大小写吗？ | **区分**，`direct-OneServiceSao` ≠ `direct-oneservicesao` |
| 配置 key 必须和什么一致？ | 和 `@FeignClient` 的 `contextId`（或 `name`）完全一致 |

## 参考

- [FeignClientFactoryBean.java 源码](https://github.com/spring-cloud/spring-cloud-openfeign/blob/main/spring-cloud-openfeign-core/src/main/java/org/springframework/cloud/openfeign/FeignClientFactoryBean.java)
- [FeignClientProperties.java 源码](https://github.com/spring-cloud/spring-cloud-openfeign/blob/main/spring-cloud-openfeign-core/src/main/java/org/springframework/cloud/openfeign/FeignClientProperties.java)
- [Spring Boot Relaxed Binding 2.0](https://github.com/spring-projects/spring-boot/wiki/Relaxed-Binding-2.0)
- [Spring Boot Relaxed Binding 官方文档](https://docs.spring.io/spring-boot/reference/features/external-config.html)
