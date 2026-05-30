# OpenFeign + HttpClient5 超时与连接池配置指南

本文档用于说明 Spring Cloud OpenFeign 搭配 Apache HttpClient 5 时的生产配置方式，重点覆盖超时、连接池容量、推荐值、估算方法，以及本项目当前配置的落点。

## 一、配置分层

OpenFeign + HttpClient5 的配置可以分为两层：

| 层级 | 配置对象 | 主要职责 |
|------|----------|----------|
| Feign 层 | `spring.cloud.openfeign.client.config` | 面向单个 Feign Client 的请求超时、日志、拦截器等 |
| HttpClient5 层 | `spring.cloud.openfeign.httpclient` 或自定义 `CloseableHttpClient` | 底层连接池、连接复用、从池中取连接的等待时间、Socket I/O 超时 |

本项目使用自定义 `CloseableHttpClient` 和 `feign.hc5.ApacheHttp5Client`：

| 文件 | 说明 |
|------|------|
| `backend/src/main/java/com/example/editor/common/config/HttpClientConfig.java` | 创建 `PoolingHttpClientConnectionManager`、`CloseableHttpClient`、Feign `Client` |
| `backend/src/main/java/com/example/editor/common/config/HttpClientProperties.java` | 绑定 `feign.httpclient.*` 配置 |
| `backend/src/main/resources/application.yml` | Feign Client 超时和 HTTP 连接池参数 |

## 二、核心超时参数

| 参数 | 所在层 | 含义 | 生产建议 |
|------|--------|------|----------|
| `connectTimeout` | Feign Client | 建立 TCP/TLS 连接的超时 | 内网 500-1000ms；公网 1000-3000ms |
| `readTimeout` | Feign Client | 连接建立后等待响应数据的超时 | 普通接口 1000-3000ms；慢接口 5000-15000ms |
| `connection-request-timeout` | HttpClient5 | 从连接池获取连接的等待时间 | 100-1000ms |
| `socket-timeout` | HttpClient5 | 底层 Socket I/O 超时 | 通常与 `readTimeout` 接近或略大 |
| `connection-ttl` | HttpClient5 | 连接最大生命周期 | 5-15 分钟 |
| `idle-timeout` | HttpClient5 | 空闲连接回收时间 | 30-60 秒更适合高并发；低频服务可放宽 |

注意：`connection-request-timeout` 不是建立连接超时，而是连接池没有可用连接时，调用线程最多等待多久。生产环境不建议配置过长，否则下游变慢或池耗尽时，请求会在应用内堆积。

## 三、连接池容量估算

### 3.1 每个路由最大连接数

`max-connections-per-route` 表示单个目标地址的最大连接数。常用估算公式：

```text
perRoute = 目标服务峰值 QPS * 平均响应时间秒 * 冗余系数
```

示例：

```text
峰值 QPS = 300
平均响应时间 = 80ms = 0.08s
理论并发连接占用 = 300 * 0.08 = 24
冗余系数取 2
建议 max-connections-per-route = 50
```

### 3.2 全局最大连接数

`max-connections` 表示所有下游目标共享的最大连接数。常用估算方式：

```text
maxConnections = 所有核心下游 perRoute 之和
```

或者：

```text
maxConnections = 当前实例峰值外呼并发数 * 1.5
```

不要盲目配置几千个连接。连接池过大不能解决下游慢的问题，反而可能放大排队、重试和资源占用。

## 四、推荐配置基线

### 4.1 通用微服务基线

```yaml
spring:
  cloud:
    openfeign:
      httpclient:
        hc5:
          enabled: true
          connection-request-timeout: 500
          connection-request-timeout-unit: milliseconds
          socket-timeout: 3
          socket-timeout-unit: seconds
          pool-concurrency-policy: strict
          pool-reuse-policy: fifo
        connection-timeout: 1000
        max-connections: 500
        max-connections-per-route: 100
        time-to-live: 600
        time-to-live-unit: seconds
        follow-redirects: false
      client:
        config:
          default:
            connectTimeout: 1000
            readTimeout: 3000
            loggerLevel: basic
```

### 4.2 本项目当前配置

本项目调用火山引擎 AI 接口，响应时间可能显著长于普通内网接口，因此 `volcengine-visual` 单独配置了较长的 `readTimeout`：

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connectTimeout: 5000
            readTimeout: 10000
          volcengine-visual:
            connectTimeout: 5000
            readTimeout: 60000

feign:
  httpclient:
    max-connections: 200
    max-connections-per-route: 50
    connection-timeout: 5000
    socket-timeout: 60000
    connection-ttl: 1800000
    idle-timeout: 600000
```

这套配置偏向 AI 慢接口保护。若后续加入普通内网服务调用，应为普通服务单独设置更短的 `readTimeout`，避免慢接口配置被全局复用。

## 五、按场景推荐值

| 场景 | connectTimeout | readTimeout | 从连接池取连接等待 | perRoute | maxConnections |
|------|----------------|-------------|--------------------|----------|----------------|
| 同机房 / K8s 内部调用 | 300-800ms | 1000-3000ms | 100-300ms | 50-200 | 200-1000 |
| 跨机房 / 跨可用区 | 800-1500ms | 3000-8000ms | 300-800ms | 50-150 | 200-800 |
| 第三方公网 API | 1000-3000ms | 5000-15000ms | 500-1000ms | 20-100 | 100-500 |
| AI / 报表 / 慢任务 | 1000-5000ms | 30000ms 以上 | 500-2000ms | 按并发单独估算 | 建议与普通接口隔离 |

## 六、自定义 HttpClient5 示例

如果只使用 YAML 无法满足连接校验、空闲连接回收、连接生命周期等需求，可以显式提供 `CloseableHttpClient`：

```java
@Configuration
public class FeignHttpClient5Config {

    @Bean
    public CloseableHttpClient feignHttpClient() {
        ConnectionConfig connectionConfig = ConnectionConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(1000))
                .setSocketTimeout(Timeout.ofSeconds(3))
                .setTimeToLive(TimeValue.ofMinutes(10))
                .setValidateAfterInactivity(TimeValue.ofSeconds(30))
                .build();

        PoolingHttpClientConnectionManager connectionManager =
                PoolingHttpClientConnectionManagerBuilder.create()
                        .setDefaultConnectionConfig(connectionConfig)
                        .setMaxConnTotal(500)
                        .setMaxConnPerRoute(100)
                        .build();

        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(500))
                .setResponseTimeout(Timeout.ofSeconds(3))
                .build();

        return HttpClients.custom()
                .setConnectionManager(connectionManager)
                .setDefaultRequestConfig(requestConfig)
                .evictExpiredConnections()
                .evictIdleConnections(TimeValue.ofSeconds(60))
                .disableAutomaticRetries()
                .build();
    }
}
```

本项目当前 `HttpClientConfig` 已经提供了自定义 `CloseableHttpClient`，如果要进一步生产化，优先补充：

| 建议 | 原因 |
|------|------|
| 使用 `ConnectionConfig` 设置 `connectTimeout`、`socketTimeout`、`timeToLive` | 更贴近 HttpClient5 的配置模型 |
| 增加 `validateAfterInactivity` | 降低复用半关闭连接导致的偶发失败 |
| 将 `idle-timeout` 从 10 分钟调整为 30-60 秒 | 高并发服务中更快释放空闲连接 |
| 显式设置 `connection-request-timeout` | 避免连接池耗尽时线程长时间堆积 |

## 七、最佳实践

1. 不同下游使用不同 Feign Client 配置。普通接口、第三方接口、AI 慢接口不要共用一组超时。
2. 慢接口不要只加大 `readTimeout`，还要重新估算 `max-connections-per-route`，因为连接占用时间会变长。
3. 连接池等待时间要短于业务接口超时，池耗尽时快速失败比长时间堆积更容易恢复。
4. 谨慎开启重试。多层重试叠加会把一次下游抖动放大成流量洪峰，只给幂等接口开启受控重试。
5. `max-connections` 要和应用线程池、Tomcat 线程数、下游容量一起评估。
6. 上线后持续观察 P95/P99、超时率、连接池 leased/available/pending、下游 5xx 和重试次数。
7. 如果 pending 持续升高，优先判断是连接池过小、下游变慢、DNS/TLS 慢，还是调用方并发无上限。

## 八、排查清单

| 现象 | 优先检查 |
|------|----------|
| 大量 `Read timed out` | 下游 P99、`readTimeout` 是否过短、响应体是否过大 |
| 大量连接池等待超时 | `max-connections-per-route`、下游耗时、调用方并发 |
| 偶发 `Connection reset` | 空闲连接复用、`validateAfterInactivity`、服务端 keep-alive |
| 下游抖动时本服务线程打满 | 连接池等待时间过长、重试过多、缺少并发隔离 |
| 只有某个第三方 API 慢 | 为该 Feign Client 单独设置超时和连接池策略 |

## 九、参考资料

- Spring Cloud OpenFeign 官方文档: https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/
- Spring Cloud OpenFeign 配置属性: https://docs.spring.io/spring-cloud-openfeign/reference/configprops.html
- Apache HttpClient 5 Connection Management: https://hc.apache.org/httpcomponents-client-5.6.x/connection-management.html
