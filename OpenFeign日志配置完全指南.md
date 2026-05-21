# Spring Cloud OpenFeign 日志配置完全指南

## 一、核心原则：为什么需要双重配置？

### 问题的本质

OpenFeign 的日志输出涉及两个独立的系统，它们各司其职：

```
┌─────────────────────────────────────────────────────────────────────┐
│                         日志输出流程                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   1. Feign 框架层                                                    │
│      loggerLevel: FULL                                               │
│      ┌─────────────────────────────────────────┐                    │
│      │ 决定：记录什么内容                        │                    │
│      │ - 请求方法、URL                          │                    │
│      │ - 请求头、请求体                         │                    │
│      │ - 响应状态、响应头、响应体                │                    │
│      └─────────────────────────────────────────┘                    │
│                         ↓                                            │
│      Feign Logger 生成日志消息                                       │
│                         ↓                                            │
│                                                                      │
│   2. Spring 日志框架层                                               │
│      logging.level.xxx: DEBUG                                        │
│      ┌─────────────────────────────────────────┐                    │
│      │ 决定：是否输出到控制台                    │                    │
│      │ - DEBUG 级别 → 输出                      │                    │
│      │ - INFO/WARN 级别 → 不输出                │                    │
│      └─────────────────────────────────────────┘                    │
│                         ↓                                            │
│      控制台显示日志                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 为什么这样设计？

| 配置层 | 所属框架 | 控制什么 | 默认值 |
|--------|----------|----------|--------|
| `loggerLevel` | OpenFeign | **内容生成**：决定 Feign 是否记录、记录多少 | `NONE`（不记录） |
| `logging.level` | Spring (SLF4J) | **内容输出**：决定日志是否通过 Spring 输出 | `INFO`（低于 INFO 的不输出） |

**关键点**：
- Feign 使用 `DEBUG` 级别输出日志（在 SLF4J 中）
- Spring 默认日志级别是 `INFO`
- `DEBUG < INFO`，所以 Feign 的日志默认被 Spring 过滤掉

### 验证实验

```yaml
# 实验1：只配置 loggerLevel
spring.cloud.openfeign.client.config.default.loggerLevel: FULL
# 结果：无日志输出 ❌（被 Spring INFO 级别过滤）

# 实验2：只配置 logging.level
logging.level.com.example.feign: DEBUG
# 结果：无日志输出 ❌（Feign loggerLevel=NONE，根本不生成日志）

# 实验3：两者都配置
spring.cloud.openfeign.client.config.default.loggerLevel: FULL
logging.level.com.example.feign: DEBUG
# 结果：完整日志输出 ✅
```

---

## 二、核心源码分析

### 1. Feign Logger 的实现

Feign 使用 `feign.Logger` 抽象类记录请求/响应：

```java
// feign/Logger.java - Feign 原生源码
public abstract class Logger {

    // Logger.Level 枚举定义日志详细程度
    public enum Level {
        NONE,   // 不记录任何日志
        BASIC,  // 只记录请求方法、URL、响应状态码、执行时间
        HEADERS, // BASIC + 请求/响应头
        FULL    // HEADERS + 请求/响应体
    }

    // 记录请求 - 根据 Level 决定是否调用
    protected abstract void logRequest(String configKey, Level level, Request request);

    // 记录响应 - 根据 Level 决定是否调用
    protected abstract void logRebound(String configKey, Level level, Response response,
                                       long elapsedTime);

    // 内部判断逻辑
    protected boolean shouldLogRequest(Level level) {
        return level != Level.NONE;
    }
}
```

### 2. Spring Cloud 的 Slf4jLogger 实现

Spring Cloud OpenFeign 使用 SLF4J 作为日志框架：

```java
// org/springframework/cloud/openfeign/Slf4jLogger.java
public class Slf4jLogger extends Logger {

    private final Logger logger;  // SLF4J Logger

    public Slf4jLogger(String name) {
        // 获取 SLF4J Logger，name 是 FeignClient 接口的类名
        this.logger = LoggerFactory.getLogger(name);
    }

    @Override
    protected void log(String configKey, String format, Object... args) {
        // 关键：使用 DEBUG 级别输出！
        if (logger.isDebugEnabled()) {
            logger.debug(String.format(methodTag(configKey) + format, args));
        }
    }

    @Override
    protected void logRequest(String configKey, Level level, Request request) {
        // 根据 level 决定记录内容的详细程度
        if (level == Level.NONE) {
            return;  // 不记录
        }
        // ... 记录请求信息
        log(configKey, "---> %s %s HTTP/1.1", request.method(), request.url());
    }
}
```

**关键发现**：`Slf4jLogger.log()` 方法使用 `logger.isDebugEnabled()` 判断，并且始终以 `DEBUG` 级别输出！

这就是为什么必须配置 `logging.level.xxx=DEBUG`。

### 3. Logger.Level 如何应用

```java
// org/springframework/cloud/openfeign/FeignClientFactoryBean.java
public class FeignClientFactoryBean {

    protected Feign.Builder configureFeign(Feign.Builder builder) {
        // 从配置中读取 loggerLevel
        if (properties != null && properties.getConfig() != null) {
            FeignClientConfiguration config = properties.getConfig().get(name);
            if (config != null && config.getLoggerLevel() != null) {
                builder.logLevel(config.getLoggerLevel());  // 应用到 Builder
            }
        }
        return builder;
    }
}

// Feign.Builder 最终构建时
public Feign build() {
    // ... 其他配置
    return new ReflectiveFeign(
        client,
        contract,
        options,
        encoder,
        decoder,
        errorHandler,
        logLevel  // 传入 Logger.Level
    );
}

// ReflectiveFeign 创建代理时
private InvocationHandlerFactory createInvocationHandler() {
    // 将 logLevel 传递给方法处理器
    return new InvocationHandlerFactory.Default(
        new SynchronousMethodHandler(
            client,
            options,
            encoder,
            decoder,
            logLevel  // ← 这里决定了日志详细程度
        )
    );
}
```

### 4. 配置属性绑定

```java
// org/springframework/cloud/openfeign/FeignClientProperties.java
@ConfigurationProperties("spring.cloud.openfeign.client")  // v4.x+
public class FeignClientProperties {

    // 配置 Map，key 是服务名或 "default"
    private Map<String, FeignClientConfiguration> config;

    // 默认配置名称
    private String defaultConfig = "default";

    public FeignClientConfiguration getConfig(String name) {
        // 先查特定服务配置，再查 default 配置
        FeignClientConfiguration result = config.get(name);
        if (result == null) {
            result = config.get(defaultConfig);
        }
        return result;
    }
}

// 单个客户端的配置
public class FeignClientConfiguration {
    private Logger.Level loggerLevel;  // 对应 YAML: loggerLevel
    private Integer connectTimeout;
    private Integer readTimeout;
    private boolean followRedirects;
    // ...
}
```

### 5. 日志输出的完整调用链

```
┌─────────────────────────────────────────────────────────────────────┐
│                      日志输出完整调用链                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. 配置读取                                                         │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ FeignClientProperties.getConfig("default")               │    │
│     │ → FeignClientConfiguration.getLoggerLevel()              │    │
│     │ → 返回 Logger.Level.FULL                                 │    │
│     └──────────────────────────────────────────────────────────┘    │
│                          ↓                                           │
│                                                                      │
│  2. Builder 配置                                                     │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ FeignClientFactoryBean.configureFeign()                  │    │
│     │ → builder.logLevel(Logger.Level.FULL)                    │    │
│     └──────────────────────────────────────────────────────────┘    │
│                          ↓                                           │
│                                                                      │
│  3. 创建代理                                                         │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ Feign.build() → ReflectiveFeign                          │    │
│     │ → SynchronousMethodHandler(logLevel=FULL)                │    │
│     └──────────────────────────────────────────────────────────┘    │
│                          ↓                                           │
│                                                                      │
│  4. 方法调用时                                                       │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ SynchronousMethodHandler.invoke()                        │    │
│     │ → 根据 logLevel 判断是否记录                              │    │
│     │ → if (logLevel != NONE) { logger.logRequest(...) }       │    │
│     └──────────────────────────────────────────────────────────┘    │
│                          ↓                                           │
│                                                                      │
│  5. Slf4jLogger 输出                                                 │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ Slf4jLogger.log()                                        │    │
│     │ → if (logger.isDebugEnabled()) {                         │    │
│     │       logger.debug(...)  ← DEBUG 级别输出                 │    │
│     │   }                                                      │    │
│     └──────────────────────────────────────────────────────────┘    │
│                          ↓                                           │
│                                                                      │
│  6. Spring 日志过滤                                                  │
│     ┌──────────────────────────────────────────────────────────┐    │
│     │ logging.level.com.example.feign = DEBUG                  │    │
│     │ → DEBUG 级别允许输出 → 控制台显示                         │    │
│     │                                                          │    │
│     │ 如果配置是 INFO：                                        │    │
│     │ → DEBUG < INFO → 不输出 → 控制台无显示                   │    │
│     └──────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 三、配置前缀（版本差异）

### 版本对应表

| Spring Cloud 版本 | 代号 | OpenFeign 版本 | 正确配置前缀 | Java 版本要求 |
|-------------------|------|----------------|-------------|---------------|
| 2020.x | Hoxton | 2.x | `feign.client` | Java 8+ |
| 2021.x | Jubilee | 3.x | `feign.client` | Java 8+ |
| 2022.x | Kilburn | 4.x | `spring.cloud.openfeign.client` | Java 17+ |
| 2023.x | Moorgate | 4.x | `spring.cloud.openfeign.client` | Java 17+ |
| 2024.x | Moorgate | 4.1+ | `spring.cloud.openfeign.client` | Java 17+ |

> **官方公告**：Spring 于 2025年2月6日 发布了配置前缀变更说明，`feign.*` 前缀在 4.x 版本已废弃。

### Spring Cloud 与 Spring Boot 版本对应

| Spring Cloud | Spring Boot | OpenFeign | Java |
|--------------|-------------|-----------|------|
| 2021.x (Jubilee) | 2.6.x - 2.7.x | 3.x | 8+ |
| 2022.x (Kilburn) | 3.0.x | 4.x | 17+ |
| 2023.x (Moorgate) | 3.1.x - 3.2.x | 4.x | 17+ |
| 2024.x | 3.3.x+ | 4.1+ | 17+ |

---

## 四、配置示例

### 新版本（≥ 4.x）配置

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            loggerLevel: FULL

logging:
  level:
    com.example.feign: DEBUG
```

### 旧版本（≤ 3.x）配置

```yaml
feign:
  client:
    config:
      default:
        loggerLevel: FULL

logging:
  level:
    com.example.feign: DEBUG
```

---

## 五、loggerLevel 级别说明

| 级别 | 输出内容 | 适用场景 |
|------|----------|----------|
| NONE | 无日志 | 生产环境（默认） |
| BASIC | 方法、URL、状态码、时间 | 问题排查 |
| HEADERS | BASIC + 请求/响应头 | 调试认证问题 |
| FULL | HEADERS + 请求/响应体 | 开发调试（注意敏感数据） |

---

## 六、针对特定服务配置

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            loggerLevel: BASIC       # 全局默认
          order-service:
            loggerLevel: FULL        # 特定服务详细日志
          payment-service:
            loggerLevel: NONE        # 不打印敏感服务日志

logging:
  level:
    com.example.feign: DEBUG
```

---

## 七、Java 代码配置方式

```java
@Configuration
public class FeignConfig {
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}

// 应用到特定客户端
@FeignClient(name = "user-service", configuration = FeignConfig.class)
public interface UserClient {
    // ...
}
```

**注意**：Java 配置仍需配合 `logging.level` 才能输出。

---

## 八、常见问题

### Q1: 配置了还是看不到日志？

排查步骤：

```bash
# 1. 检查 OpenFeign 版本
mvn dependency:tree | grep openfeign

# 2. 根据版本确认配置前缀
# 3.x → feign.client.config
# 4.x → spring.cloud.openfeign.client.config

# 3. 确认 logging.level 包路径正确
# 必须覆盖 @FeignClient 接口所在包

# 4. 确认 Java 版本兼容
# Spring Cloud 2022.x+ 需要 Java 17+
```

### Q2: 为什么不能用 INFO 级别？

因为 Feign 使用 `DEBUG` 级别输出日志：
- `DEBUG < INFO`（级别数值上）
- Spring 默认 `INFO` 级别会过滤掉 `DEBUG`

---

## 九、迁移检查清单

从旧版本迁移到新版本：

1. **Java 版本** ≥ 17（Spring Cloud 2022.x+ 必须）
2. **Spring Boot 版本** ≥ 3.0
3. **配置前缀**：`feign.client` → `spring.cloud.openfeign.client`
4. **依赖版本** 兼容性检查

---

## 十、完整配置模板

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            loggerLevel: FULL
            connectTimeout: 5000
            readTimeout: 5000

logging:
  level:
    com.example.feign: DEBUG
```

---

## 参考资料

- [Spring Cloud OpenFeign: Configuration Prefix Change](https://spring.io/blog/2025/02/06/spring-cloud-openfeign-configuration-prefix-change)
- [OpenFeign Reference Guide](https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/)