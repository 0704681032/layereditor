# OpenFeign 超时配置指南

## 背景

当 `@FeignClient` 的 `name` 和 `contextId` 为 `direct-OneServiceSao` 时，如何正确配置超时时间。

## 配置方式

### 老版本（2.x / Spring Boot 2）— application.properties

```properties
# 全局默认超时
feign.client.config.default.connectTimeout=3000
feign.client.config.default.readTimeout=5000

# 针对 direct-OneServiceSao 的超时
feign.client.config.direct-OneServiceSao.connectTimeout=5000
feign.client.config.direct-OneServiceSao.readTimeout=10000
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

### YAML 格式（3.x）

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connectTimeout: 3000
            readTimeout: 5000
          direct-OneServiceSao:
            connectTimeout: 5000
            readTimeout: 10000
```

> 单位均为毫秒。特定服务的配置优先级高于 `default`。

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
