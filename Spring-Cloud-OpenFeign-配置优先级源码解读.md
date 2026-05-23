# Spring Cloud OpenFeign 源码解读：FeignClientProperties 配置优先级机制

## 一、概述

本文档详细解读 `FeignClientFactoryBean#configureFeign` 方法中的配置优先级机制，重点分析 `defaultToProperties` 属性如何控制 **Spring Configuration Bean** 与 **Properties/YAML 配置文件**之间的优先级顺序。

---

## 二、代码调用层次图

### 2.1 整体架构调用链

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        Spring Cloud OpenFeign 初始化调用链                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         第一阶段：启动扫描与注册                                    │   │
│  ══════════════════════════════════════════════════════════════════════════════════│   │
│  │                                                                                 │   │
│  │  @SpringBootApplication                                                         │   │
│  │       │                                                                         │   │
│  │       ├── @EnableFeignClients                                                   │   │
│  │       │       │                                                                 │   │
│  │       │       │  [注解处理]                                                      │   │
│  │       │       ▼                                                                 │   │
│  │       │   FeignClientsRegistrar                                                 │   │
│  │       │   └───────────────────────────────────────────────────────────┐        │   │
│  │       │   │ 源码位置: FeignClientsRegistrar.java:71                    │        │   │
│  │       │   │ implements ImportBeanDefinitionRegistrar                   │        │   │
│  │       │   └───────────────────────────────────────────────────────────┘        │   │
│  │       │       │                                                                 │   │
│  │       │       │  registerBeanDefinitions()  ──────────────────────────────▶    │   │
│  │       │       │      [第 149-152 行]                                           │   │
│  │       │       │                                                                 │   │
│  │       │       ├──▶ registerDefaultConfiguration()                              │   │
│  │       │       │      [第 154-167 行]                                            │   │
│  │       │       │      └── 注册全局默认配置 FeignClientSpecification              │   │
│  │       │       │                                                                 │   │
│  │       │       └──▶ registerFeignClients()                                       │   │
│  │       │              [第 169-204 行]                                            │   │
│  │       │              │                                                          │   │
│  │       │              ├── ClassPathScanningCandidateComponentProvider            │   │
│  │       │              │   └── 扫描 @FeignClient 注解的接口                        │   │
│  │       │              │                                                          │   │
│  │       │              ├── registerClientConfiguration()                          │   │
│  │       │              │   └── 注册 FeignClientSpecification                      │   │
│  │       │              │      ┌─────────────────────────────────────────┐         │   │
│  │       │              │      │ FeignClientSpecification                │         │   │
│  │       │              │      │ ├── name: FeignClient 的 name/contextId │         │   │
│  │       │              │      │ ├── className: 接口全类名                │         │   │
│  │       │              │      │ └── configuration: 配置类               │         │   │
│  │       │              │      └─────────────────────────────────────────┘         │   │
│  │       │              │                                                          │   │
│  │       │              └──▶ registerFeignClient()                                 │   │
│  │       │                     [第 206-216 行]                                     │   │
│  │       │                     │                                                   │   │
│  │       │                     ├── eagerlyRegisterFeignClientBeanDefinition()      │   │
│  │       │                     │   或 lazilyRegisterFeignClientBeanDefinition()    │   │
│  │       │                     │                                                   │   │
│  │       │                     └──▶ 创建 BeanDefinition                            │   │
│  │       │                            ┌────────────────────────────────────┐        │   │
│  │       │                            │ FeignClientFactoryBean             │        │   │
│  │       │                            │ ├── type: 接口类型                 │        │   │
│  │       │                            │ ├── name: 服务名                   │        │   │
│  │       │                            │ ├── url: 服务地址                 │        │   │
│  │       │                            │ ├── contextId: 上下文ID            │        │   │
│  │       │                            │ ├── configuration: 专用配置类      │        │   │
│  │       │                            │ ├── fallback: 降级类               │        │   │
│  │       │                            │ └── ...                            │        │   │
│  │       │                            └────────────────────────────────────┘        │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         第二阶段：自动配置                                        │   │
│  ══════════════════════════════════════════════════════════════════════════════════│   │
│  │                                                                                 │   │
│  │  FeignAutoConfiguration                                                        │   │
│  │  └───────────────────────────────────────────────────────────────────┐         │   │
│  │  │ 源码位置: FeignAutoConfiguration.java:107                         │         │   │
│  │  │ @Configuration @EnableConfigurationProperties                      │         │   │
│  │  │     → FeignClientProperties.class                                 │         │   │
│  │  │     → FeignHttpClientProperties.class                             │         │   │
│  │  └───────────────────────────────────────────────────────────────────┘         │   │
│  │       │                                                                         │   │
│  │       │  [创建核心 Bean]                                                         │   │
│  │       │                                                                         │   │
│  │       ├──▶ feignContext()  ─────────────────────────────────────────────────▶  │   │
│  │       │      [第 120-124 行]                                                    │   │
│  │       │      ┌───────────────────────────────────────────────────────┐         │   │
│  │       │      │ FeignClientFactory (原名 FeignContext)                │         │   │
│  │       │      │ ├── extends NamedContextFactory                       │         │   │
│  │       │      │ ├── 为每个 FeignClient 创建独立子上下文                │         │   │
│  │       │      │ ├── 管理各 client 的 configuration beans              │         │   │
│  │       │      │ └── configurations: List<FeignClientSpecification>   │         │   │
│  │       │      └───────────────────────────────────────────────────────┘         │   │
│  │       │                                                                         │   │
│  │       └──▶ feignTargeter()  ─────────────────────────────────────────────────▶ │   │
│  │              [第 169-173 行]                                                    │   │
│  │              ┌───────────────────────────────────────────────────────┐         │   │
│  │              │ DefaultTargeter / FeignCircuitBreakerTargeter         │         │   │
│  │              │ ├── 负责最终创建 Feign 代理对象                        │         │   │
│  │              │ └── 调用 Feign.Builder.target()                       │         │   │
│  │              └───────────────────────────────────────────────────────┘         │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 FeignClient 创建调用链（核心流程）

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        FeignClient 代理对象创建调用链                                     │
│                        （首次使用时触发 FactoryBean.getObject()）                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         第三阶段：Bean 创建                                       │   │
│  ══════════════════════════════════════════════════════════════════════════════════│   │
│  │                                                                                 │   │
│  │  [触发时机]                                                                      │   │
│  │  ├── @Autowired UserClient userClient;                                          │   │
│  │  ├── 或 Spring 容器初始化时（非 lazy-init）                                       │   │
│  │  └── 或首次调用时（lazy-init）                                                    │   │
│  │                                                                                 │   │
│  │  FeignClientFactoryBean                                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐        │   │
│  │  │ implements FactoryBean<Object>, InitializingBean                    │        │   │
│  │  │ 源码位置: FeignClientFactoryBean.java:78                             │        │   │
│  │  └─────────────────────────────────────────────────────────────────────┘        │   │
│  │       │                                                                         │   │
│  │       │  afterPropertiesSet()  ─────────────────────────────────────────────▶  │   │
│  │       │      [第 130-133 行]                                                    │   │
│  │       │      └── 验证 contextId 和 name 必须设置                               │   │
│  │       │                                                                         │   │
│  │       │  getObject()  ───────────────────────────────────────────────────────▶ │   │
│  │       │      [第 451-453 行]                                                    │   │
│  │       │      └── return getTarget();                                           │   │
│  │       │                                                                         │   │
│  │       └──▶ getTarget()  ─────────────────────────────────────────────────────▶ │   │
│  │              [第 461-501 行]                                                    │   │
│  │              │                                                                  │   │
│  │              │  [获取 FeignClientFactory]                                       │   │
│  │              ├──▶ feignClientFactory = beanFactory.getBean(...)                │   │
│  │              │                                                                  │   │
│  │              │  [构建 Feign.Builder]                                            │   │
│  │              └──▶ Feign.Builder builder = feign(feignClientFactory);           │   │
│  │                     │                                                           │   │
│  │                     │  ────────────────────────────────────────────────────    │   │
│  │                     │  ▼                                                       │   │
│  │                     │                                                          │   │
│  │                     └─▶ feign(FeignClientFactory context)                      │   │
│  │                           [第 135-151 行]                                       │   │
│  │                           │                                                    │   │
│  │                           │  [创建基础组件]                                     │   │
│  │                           ├──▶ FeignLoggerFactory loggerFactory = get(...)     │   │
│  │                           ├──▶ Logger logger = loggerFactory.create(type)      │   │
│  │                           ├──▶ Encoder encoder = get(context, Encoder.class)   │   │
│  │                           ├──▶ Decoder decoder = get(context, Decoder.class)   │   │
│  │                           ├──▶ Contract contract = get(context, Contract.class)│   │
│  │                           │                                                    │   │
│  │                           │  [创建 Builder]                                     │   │
│  │                           └──▶ Feign.Builder builder = get(context, ...)       │   │
│  │                                  .logger(logger)                               │   │
│  │                                  .encoder(encoder)                             │   │
│  │                                  .decoder(decoder)                             │   │
│  │                                  .contract(contract);                          │   │
│  │                                  │                                             │   │
│  │                                  │  ──────────────────────────────────────     │   │
│  │                                  │  ▼                                          │   │
│  │                                  │                                             │   │
│  │                                  └─▶ configureFeign(context, builder)          │   │
│  │                                       ★★★ 核心配置方法 ★★★                    │   │
│  │                                       [第 164-188 行]                          │   │
│  │                                       │                                        │   │
│  │                                       │  ══════════════════════════════════   │   │
│  │                                       │  详细流程见下方                         │   │
│  │                                       │  ══════════════════════════════════   │   │
│  │                                       │                                        │   │
│  │                                       └── return builder;                     │   │
│  │                                                                                 │   │
│  │              [判断是否有 URL]                                                    │   │
│  │              ├──▶ if (!StringUtils.hasText(url) && !isUrlAvailableInConfig()) │   │
│  │              │      └──▶ loadBalance(builder, context, target)                 │   │
│  │              │          └── 使用 LoadBalancer 进行负载均衡                      │   │
│  │              │                                                                  │   │
│  │              └──▶ [有 URL 的情况]                                               │   │
│  │                     ├──▶ Client client = getOptional(context, Client.class)    │   │
│  │                     ├──▶ applyBuildCustomizers(context, builder)               │   │
│  │                     │                                                          │   │
│  │                     └──▶ Targeter targeter = get(context, Targeter.class)      │   │
│  │                            └──▶ targeter.target(...)                           │   │
│  │                                   ──────────────────────────────────────────   │   │
│  │                                   ▼                                             │   │
│  │                                   DefaultTargeter.target()                     │   │
│  │                                   └─────────────────────────────────────────── │   │
│  │                                   [第 28-31 行]                                 │   │
│  │                                   └──▶ return feign.target(target);            │   │
│  │                                          ┌────────────────────────────────┐    │   │
│  │                                          │ feign.target()                 │    │   │
│  │                                          │ ├── 创建动态代理对象             │    │   │
│  │                                          │ ├── 实现 FeignClient 接口        │    │   │
│  │                                          │ └── 持有 MethodHandler 映射      │    │   │
│  │                                          └────────────────────────────────┘    │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 configureFeign 配置应用调用链（核心）

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        configureFeign() 配置应用调用链                                    │
│                        源码位置: FeignClientFactoryBean.java:164-188                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  configureFeign(FeignClientFactory context, Feign.Builder builder)                     │
│  │                                                                                      │
│  │  [获取配置属性]                                                                       │
│  ├──▶ FeignClientProperties properties = beanFactory.getBean(...)                      │
│  │    ┌───────────────────────────────────────────────────────────────────────────┐    │
│  │    │ FeignClientProperties                                                      │    │
│  │    │ ├── defaultToProperties: true (默认)                                       │    │
│  │    │ ├── defaultConfig: "default"                                               │    │
│  │    │ ├── decodeSlash: true                                                      │    │
│  │    │ └── config: Map<String, FeignClientConfiguration>                          │    │
│  │    │     ├── config.default → 全局默认配置                                       │    │
│  │    │     └── config.<contextId> → 特定客户端配置                                 │    │
│  │    └───────────────────────────────────────────────────────────────────────────┘    │
│  │                                                                                      │
│  │  [检查继承配置]                                                                       │
│  ├──▶ FeignClientConfigurer feignClientConfigurer = getOptional(...)                   │
│  │    └──▶ setInheritParentContext(feignClientConfigurer.inheritParentConfiguration())│
│  │                                                                                      │
│  │  ╔══════════════════════════════════════════════════════════════════════════════╗  │
│  │  ║                    配置应用核心逻辑                                           ║  │
│  │  ╠══════════════════════════════════════════════════════════════════════════════╣  │
│  │  ║                                                                              ║  │
│  │  ║  if (properties != null && inheritParentContext)                            ║  │
│  │  ║  │                                                                           ║  │
│  │  ║  │  [defaultToProperties = true（默认）]                                     ║  │
│  │  ║  │  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  │  ║  │  │ Step 1: configureUsingConfiguration(context, builder)                │ ║  │
│  │  ║  │  │         [第 190-250 行]                                              │ ║  │
│  │  ║  │  │         ├── 获取 Global Configuration Bean                           │ ║  │
│  │  ║  │  │         └── 获取 Specific Configuration Bean                         │ ║  │
│  │  ║  │  │             └── 覆盖同名配置                                          │ ║  │
│  │  ║  │  └─────────────────────────────────────────────────────────────────────┘ ║  │
│  │  ║  │                          │                                              ║  │
│  │  ║  │                          ▼                                              ║  │
│  │  ║  │  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  │  ║  │  │ Step 2: configureUsingProperties(baseConfig, finalConfig, builder)  │ ║  │
│  │  ║  │  │         [第 252-330 行]                                              │ ║  │
│  │  ║  │  │         ├── 应用 properties.config.default                          │ ║  │
│  │  ║  │  │         └── 应用 properties.config.<contextId>                      │ ║  │
│  │  ║  │  │             └── 覆盖同名配置（最高优先级）                            │ ║  │
│  │  ║  │  └─────────────────────────────────────────────────────────────────────┘ ║  │
│  │  ║  │                          │                                              ║  │
│  │  ║  │                          ▼                                              ║  │
│  │  ║  │  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  │  ║  │  │ Step 3: configureDefaultRequestElements(defaultConfig, clientConfig)│ ║  │
│  │  ║  │  │         [第 332-382 行]  ← OpenFeign 4.x 新增                       │ ║  │
│  │  ║  │  │         ├── 合并 defaultRequestHeaders                              │ ║  │
│  │  ║  │  │         └── 合并 defaultQueryParameters                             │ ║  │
│  │  ║  │  │             └── 通过拦截器添加（不覆盖已存在的值）                    │ ║  │
│  │  ║  │  └─────────────────────────────────────────────────────────────────────┘ ║  │
│  │  ║  │                                                                          ║  │
│  │  ║  │  [defaultToProperties = false]                                           ║  │
│  │  ║  │  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  │  ║  │  │ Step 1: configureUsingProperties(...)                                │ ║  │
│  │  ║  │  │ Step 2: configureUsingConfiguration(...)                             │ ║  │
│  │  ║  │  │ Step 3: configureDefaultRequestElements(...)                         │ ║  │
│  │  ║  │  │         → Configuration Bean 优先级更高                               │ ║  │
│  │  ║  │  └─────────────────────────────────────────────────────────────────────┘ ║  │
│  │  ║  │                                                                          ║  │
│  │  ║  └── else: [inheritParentContext = false 或 properties == null]            ║  │
│  │  ║          └──▶ configureUsingConfiguration(context, builder)                ║  │
│  │  ║              └── 仅使用 Configuration Bean，不继承                          ║  │
│  │  ║                                                                              ║  │
│  │  ╚════════════════════════════════════════════════════════════════════════════╝  │
│  │                                                                                      │
│  └──▶ return;  // builder 已配置完成                                                   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 配置获取详细调用链

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        configureUsingConfiguration() 详细调用                            │
│                        源码位置: FeignClientFactoryBean.java:190-250                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  configureUsingConfiguration(FeignClientFactory context, Feign.Builder builder)        │
│  │                                                                                      │
│  │  [从 FeignClientFactory 获取 Bean]                                                  │
│  │  FeignClientFactory (NamedContextFactory)                                           │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │  │ getContext(contextId)                                                        │    │
│  │  │ ├── 获取或创建指定 contextId 的子上下文                                       │    │
│  │  │ ├── 子上下文包含该 FeignClient 的 configuration beans                        │    │
│  │  │ └── 继承父上下文（如果 inheritParentContext = true）                          │    │
│  │  └─────────────────────────────────────────────────────────────────────────────┘    │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, Logger.Level.class)                          │
│  │    └──▶ context.getInstance(contextId, type)                                        │
│  │         └──▶ builder.logLevel(level)                                               │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, Request.Options.class)                       │
│  │    ├──▶ builder.options(options)                                                   │
│  │    └──▶ 记录: readTimeoutMillis, connectTimeoutMillis, followRedirects            │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, Retryer.class)                               │
│  │    └──▶ builder.retryer(retryer)                                                   │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, ErrorDecoder.class)                          │
│  │    ├──▶ builder.errorDecoder(errorDecoder)                                         │
│  │    └──▶ [else] FeignErrorDecoderFactory.create(type)                               │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, Contract.class)                              │
│  │    └──▶ builder.contract(contract)                                                 │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, Encoder.class)                               │
│  │    └──▶ builder.encoder(encoder)                                                   │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, Decoder.class)                               │
│  │    └──▶ builder.decoder(decoder)                                                   │
│  │                                                                                      │
│  │  [追加型配置]                                                                        │
│  ├──▶ getInheritedAwareInstances(context, RequestInterceptor.class)                   │
│  │    └──▶ AnnotationAwareOrderComparator.sort(interceptors)                          │
│  │    └──▶ builder.requestInterceptors(interceptors)                                  │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, ResponseInterceptor.class)                   │
│  │    └──▶ builder.responseInterceptor(responseInterceptor)                           │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, QueryMapEncoder.class)                       │
│  │    └──▶ builder.queryMapEncoder(queryMapEncoder)                                   │
│  │                                                                                      │
│  ├──▶ getInheritedAwareOptional(context, ExceptionPropagationPolicy.class)            │
│  │    └──▶ builder.exceptionPropagationPolicy(policy)                                 │
│  │                                                                                      │
│  ├──▶ getInheritedAwareInstances(context, Capability.class)                           │
│  │    └──▶ sorted(AnnotationAwareOrderComparator)                                     │
│  │    └──▶ forEach(builder::addCapability)                                            │
│  │                                                                                      │
│  └──▶ if (dismiss404) builder.dismiss404();                                           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        configureUsingProperties() 详细调用                              │
│                        源码位置: FeignClientFactoryBean.java:265-330                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  configureUsingProperties(FeignClientConfiguration config, Feign.Builder builder)      │
│  │                                                                                      │
│  │  [直接从配置对象读取，无需 Spring 容器]                                              │
│  │                                                                                      │
│  ├──▶ if (config.getLoggerLevel() != null)                                            │
│  │    └──▶ builder.logLevel(config.getLoggerLevel())                                  │
│  │                                                                                      │
│  ├──▶ if (!refreshableClient)                                                         │
│  │    └──▶ builder.options(new Request.Options(                                       │
│  │            connectTimeoutMillis, TimeUnit.MILLISECONDS,                             │
│  │            readTimeoutMillis, TimeUnit.MILLISECONDS,                                │
│  │            followRedirects))                                                        │
│  │                                                                                      │
│  ├──▶ if (config.getRetryer() != null)                                                │
│  │    └──▶ builder.retryer(getOrInstantiate(config.getRetryer()))                     │
│  │                                                                                      │
│  ├──▶ if (config.getErrorDecoder() != null)                                           │
│  │    └──▶ builder.errorDecoder(getOrInstantiate(config.getErrorDecoder()))           │
│  │                                                                                      │
│  │  [追加型配置]                                                                        │
│  ├──▶ for (Class<RequestInterceptor> clazz : config.getRequestInterceptors())         │
│  │    └──▶ builder.requestInterceptor(getOrInstantiate(clazz))                        │
│  │                                                                                      │
│  ├──▶ if (config.getResponseInterceptor() != null)                                    │
│  │    └──▶ builder.responseInterceptor(getOrInstantiate(...))                         │
│  │                                                                                      │
│  ├──▶ if (config.getEncoder() != null)                                                │
│  │    └──▶ builder.encoder(getOrInstantiate(config.getEncoder()))                     │
│  │                                                                                      │
│  ├──▶ if (config.getDecoder() != null)                                                │
│  │    └──▶ builder.decoder(getOrInstantiate(config.getDecoder()))                     │
│  │                                                                                      │
│  ├──▶ if (config.getContract() != null)                                               │
│  │    └──▶ builder.contract(getOrInstantiate(config.getContract()))                   │
│  │                                                                                      │
│  ├──▶ if (config.getExceptionPropagationPolicy() != null)                             │
│  │    └──▶ builder.exceptionPropagationPolicy(...)                                    │
│  │                                                                                      │
│  │  [追加型配置]                                                                        │
│  ├──▶ for (Class<Capability> clazz : config.getCapabilities())                        │
│  │    └──▶ builder.addCapability(getOrInstantiate(clazz))                             │
│  │                                                                                      │
│  ├──▶ if (config.getQueryMapEncoder() != null)                                        │
│  │    └──▶ builder.queryMapEncoder(getOrInstantiate(...))                             │
│  │                                                                                      │
│  └─────────────────────────────────────────────────────────────────────────────────────│
│                                                                                         │
│  getOrInstantiate(Class<T> tClass)                                                     │
│  │  [源码位置: 第 384-391 行]                                                          │
│  │                                                                                      │
│  ├──▶ try: beanFactory.getBean(tClass)                                                │
│  │    └── 先从 Spring 容器获取                                                        │
│  │                                                                                      │
│  ├──▶ catch NoSuchBeanDefinitionException:                                            │
│  │    └──▶ BeanUtils.instantiateClass(tClass)                                         │
│  │        └── 直接实例化（反射）                                                       │
│  │                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 核心类职责表

| 类名 | 职责 | 关键方法 |
|------|------|----------|
| `@EnableFeignClients` | 启用 FeignClient 扫描 | 通过 `@Import` 导入 `FeignClientsRegistrar` |
| `FeignClientsRegistrar` | 注册 FeignClient BeanDefinition | `registerFeignClients()`, `registerFeignClient()` |
| `FeignClientSpecification` | 存储单个 FeignClient 的配置信息 | name, className, configuration |
| `FeignClientFactoryBean` | 创建 FeignClient 代理对象 | `getObject()`, `getTarget()`, `feign()`, `configureFeign()` |
| `FeignClientFactory` | 管理各 FeignClient 的子上下文 | `getInstance()`, `getInstances()`, `getContext()` |
| `FeignClientProperties` | 绑定 YAML 配置属性 | `defaultToProperties`, `defaultConfig`, `config` |
| `FeignClientConfiguration` | 单个客户端的具体配置 | loggerLevel, connectTimeout, readTimeout 等 |
| `Targeter` | 创建最终代理对象 | `target()` - 调用 `Feign.Builder.target()` |
| `Feign.Builder` | Feign 客户端构建器 | `target()`, `logLevel()`, `options()`, `encoder()` 等 |

---

## 三、核心类结构

### 2.1 FeignClientProperties

```java
/**
 * Feign 客户端配置属性类
 * 绑定配置前缀: spring.cloud.openfeign.client
 * 源码位置: org.springframework.cloud.openfeign.FeignClientProperties
 */
@ConfigurationProperties("spring.cloud.openfeign.client")
public class FeignClientProperties {

    /**
     * 是否优先使用 properties 文件配置
     * true:  properties 配置覆盖 Configuration Bean 配置（默认值）
     * false: Configuration Bean 配置覆盖 properties 配置
     */
    private boolean defaultToProperties = true;

    /**
     * 默认配置的名称
     * 默认值为 "default"，对应 config map 中的 key
     */
    private String defaultConfig = "default";

    /**
     * 各 FeignClient 的配置集合
     * key: FeignClient 的 contextId 或 name
     * value: 该客户端的具体配置
     */
    private Map<String, FeignClientConfiguration> config = new HashMap<>();

    /**
     * 是否对斜杠 "/" 进行编码
     * Feign 默认不编码斜杠，设为 false 可改变此行为
     * OpenFeign 4.x 新增属性
     */
    private boolean decodeSlash = true;

    // getters and setters...
}
```

### 2.2 FeignClientConfiguration（FeignClientProperties 内部静态类）

```java
/**
 * 单个 Feign 客户端的配置内容
 * 注意：这是 FeignClientProperties 的内部静态类
 * 源码位置: org.springframework.cloud.openfeign.FeignClientProperties.FeignClientConfiguration
 */
public static class FeignClientConfiguration {

    // ==================== 基础配置 ====================

    /**
     * 连接超时时间（毫秒）
     */
    private Integer connectTimeout;

    /**
     * 读取超时时间（毫秒）
     */
    private Integer readTimeout;

    /**
     * 日志级别: NONE, BASIC, HEADERS, FULL
     */
    private Logger.Level loggerLevel;

    /**
     * 是否跟随重定向
     * OpenFeign 4.x 新增属性
     */
    private Boolean followRedirects;

    // ==================== 组件配置 ====================

    /**
     * 重试策略类名
     */
    private Class<Retryer> retryer;

    /**
     * 错误解码器类名
     */
    private Class<ErrorDecoder> errorDecoder;

    /**
     * 请求拦截器类名列表（追加型配置）
     */
    private List<Class<RequestInterceptor>> requestInterceptors;

    /**
     * 响应拦截器类名
     * OpenFeign 4.x 新增属性
     */
    private Class<ResponseInterceptor> responseInterceptor;

    /**
     * 编码器类名
     */
    private Class<Encoder> encoder;

    /**
     * 解码器类名
     */
    private Class<Decoder> decoder;

    /**
     * 契约类名（决定注解处理方式）
     */
    private Class<Contract> contract;

    /**
     * QueryMap 编码器类名
     * OpenFeign 4.x 新增属性
     */
    private Class<QueryMapEncoder> queryMapEncoder;

    // ==================== 扩展能力配置 ====================

    /**
     * Capability 扩展能力类名列表
     * OpenFeign 4.x 新增属性
     */
    private List<Class<Capability>> capabilities;

    /**
     * Micrometer 监控配置
     * OpenFeign 4.x 新增属性
     */
    private MicrometerProperties micrometer;

    // ==================== 请求默认值配置 ====================

    /**
     * 默认请求头
     * OpenFeign 4.x 新增属性
     */
    private Map<String, Collection<String>> defaultRequestHeaders = new HashMap<>();

    /**
     * 默认查询参数
     * OpenFeign 4.x 新增属性
     */
    private Map<String, Collection<String>> defaultQueryParameters = new HashMap<>();

    // ==================== 行为控制配置 ====================

    /**
     * 是否忽略 404 错误
     * OpenFeign 4.x 新增属性
     */
    private Boolean dismiss404;

    /**
     * 异常传播策略
     * OpenFeign 4.x 新增属性
     */
    private ExceptionPropagationPolicy exceptionPropagationPolicy;

    /**
     * Feign 客户端 URL
     * 仅当 @FeignClient 未设置 url 时生效
     * OpenFeign 4.x 新增属性
     */
    private String url;

    // getters and setters...
}

/**
 * Micrometer 监控配置（FeignClientProperties 内部静态类）
 */
public static class MicrometerProperties {
    private Boolean enabled = true;
    // getter and setter...
}
```

### 2.3 FeignClientFactoryBean

```java
/**
 * FeignClient 的工厂 Bean
 * 每个 @FeignClient 注解都会创建一个此 FactoryBean
 * 源码位置: org.springframework.cloud.openfeign.FeignClientFactoryBean
 */
public class FeignClientFactoryBean
        implements FactoryBean<Object>, InitializingBean, ApplicationContextAware, BeanFactoryAware {

    /**
     * FeignClient 的接口类型
     */
    private Class<?> type;

    /**
     * FeignClient 的名称
     */
    private String name;

    /**
     * FeignClient 的 URL（可选，用于硬编码地址）
     */
    private String url;

    /**
     * FeignClient 的 contextId（用于区分同名客户端）
     */
    private String contextId;

    /**
     * FeignClient 的路径前缀
     */
    private String path;

    /**
     * 该 FeignClient 专属的配置类
     */
    private Class<?> configuration;

    /**
     * 是否继承父上下文配置
     * OpenFeign 4.x 新增属性，默认 true
     */
    private boolean inheritParentContext = true;

    /**
     * 是否忽略 404 错误
     */
    private boolean dismiss404;

    /**
     * Spring 应用上下文
     */
    private ApplicationContext applicationContext;

    /**
     * Bean 工厂
     */
    private BeanFactory beanFactory;

    /**
     * 降级处理类
     */
    private Class<?> fallback = void.class;

    /**
     * 降级工厂类
     */
    private Class<?> fallbackFactory = void.class;

    /**
     * 默认读取超时（毫秒）
     */
    private int readTimeoutMillis = new Request.Options().readTimeoutMillis();

    /**
     * 默认连接超时（毫秒）
     */
    private int connectTimeoutMillis = new Request.Options().connectTimeoutMillis();

    /**
     * 默认是否跟随重定向
     */
    private boolean followRedirects = new Request.Options().isFollowRedirects();

    /**
     * 是否可刷新客户端
     */
    private boolean refreshableClient = false;

    /**
     * 额外的构建器定制器列表
     */
    private final List<FeignBuilderCustomizer> additionalCustomizers = new ArrayList<>();

    /**
     * 核心：配置 Feign.Builder
     * 源码位置: 第 164-188 行
     */
    protected void configureFeign(FeignClientFactory context, Feign.Builder builder) {
        FeignClientProperties properties = beanFactory != null 
            ? beanFactory.getBean(FeignClientProperties.class)
            : applicationContext.getBean(FeignClientProperties.class);

        // 获取 FeignClientConfigurer，检查是否继承父配置
        FeignClientConfigurer feignClientConfigurer = getOptional(context, FeignClientConfigurer.class);
        setInheritParentContext(feignClientConfigurer.inheritParentConfiguration());

        // ============================================================
        // 关键逻辑：inheritParentContext + defaultToProperties 决定配置应用顺序
        // ============================================================
        if (properties != null && inheritParentContext) {
            if (properties.isDefaultToProperties()) {
                // 【默认路径】properties 优先
                // 第一步：应用 Configuration Bean 配置（低优先级）
                configureUsingConfiguration(context, builder);

                // 第二步：应用 Properties 配置（高优先级，会覆盖前者）
                configureUsingProperties(
                        properties.getConfig().get(properties.getDefaultConfig()),  // default 配置
                        properties.getConfig().get(this.contextId),                  // 特定 client 配置
                        builder
                );
            } else {
                // 【非默认路径】Configuration Bean 优先
                // 第一步：应用 Properties 配置（低优先级）
                configureUsingProperties(
                        properties.getConfig().get(properties.getDefaultConfig()),
                        properties.getConfig().get(this.contextId),
                        builder
                );

                // 第二步：应用 Configuration Bean 配置（高优先级，会覆盖前者）
                configureUsingConfiguration(context, builder);
            }

            // 第三步：配置默认请求元素（请求头、查询参数）
            // OpenFeign 4.x 新增步骤
            configureDefaultRequestElements(
                    properties.getConfig().get(properties.getDefaultConfig()),
                    properties.getConfig().get(this.contextId),
                    builder
            );
        } else {
            // 没有 FeignClientProperties 或不继承父配置时，只使用 Configuration Bean
            configureUsingConfiguration(context, builder);
        }
    }

    // ...
}
```

---

## 四、核心方法详解

### 3.1 configureUsingConfiguration

```java
/**
 * 从 Spring 容器中获取 Feign 相关的 Bean 并应用到 builder
 * 这些 Bean 来自用户定义的 @Configuration 类
 * 源码位置: 第 190-250 行
 */
private void configureUsingConfiguration(FeignClientFactory context, Feign.Builder builder) {
    // ==================== 覆盖型配置 ====================

    // 1. 日志级别
    Logger.Level level = getInheritedAwareOptional(context, Logger.Level.class);
    if (level != null) {
        builder.logLevel(level);
    }

    // 2. 超时配置（含特殊逻辑）
    Request.Options options = getInheritedAwareOptional(context, Request.Options.class);
    if (options == null) {
        // 尝试通过名称获取 Options（用于可刷新客户端）
        options = getOptionsByName(context, contextId);
    }
    if (options != null) {
        builder.options(options);
        // 记录超时值供后续使用
        readTimeoutMillis = options.readTimeoutMillis();
        connectTimeoutMillis = options.connectTimeoutMillis();
        followRedirects = options.isFollowRedirects();
    }

    // 3. 重试策略
    Retryer retryer = getInheritedAwareOptional(context, Retryer.class);
    if (retryer != null) {
        builder.retryer(retryer);
    }

    // 4. 错误解码器（含工厂模式支持）
    ErrorDecoder errorDecoder = getInheritedAwareOptional(context, ErrorDecoder.class);
    if (errorDecoder != null) {
        builder.errorDecoder(errorDecoder);
    } else {
        // OpenFeign 4.x 新增：支持通过工厂创建错误解码器
        FeignErrorDecoderFactory errorDecoderFactory = getOptional(context, FeignErrorDecoderFactory.class);
        if (errorDecoderFactory != null) {
            ErrorDecoder factoryErrorDecoder = errorDecoderFactory.create(type);
            builder.errorDecoder(factoryErrorDecoder);
        }
    }

    // 5. 契约（注解处理）
    Contract contract = getInheritedAwareOptional(context, Contract.class);
    if (contract != null) {
        builder.contract(contract);
    }

    // 6. 编码器
    Encoder encoder = getInheritedAwareOptional(context, Encoder.class);
    if (encoder != null) {
        builder.encoder(encoder);
    }

    // 7. 解码器
    Decoder decoder = getInheritedAwareOptional(context, Decoder.class);
    if (decoder != null) {
        builder.decoder(decoder);
    }

    // ==================== 追加型配置 ====================

    // 8. 请求拦截器 - 特殊：追加而非覆盖
    Map<String, RequestInterceptor> interceptors = getInheritedAwareInstances(
            context, RequestInterceptor.class);
    if (interceptors != null) {
        List<RequestInterceptor> interceptorList = new ArrayList<>(interceptors.values());
        // 按注解顺序排序
        AnnotationAwareOrderComparator.sort(interceptorList);
        builder.requestInterceptors(interceptorList);
    }

    // 9. 响应拦截器 - OpenFeign 4.x 新增
    ResponseInterceptor responseInterceptor = getInheritedAwareOptional(context, ResponseInterceptor.class);
    if (responseInterceptor != null) {
        builder.responseInterceptor(responseInterceptor);
    }

    // ==================== 其他配置 ====================

    // 10. QueryMap 编码器 - OpenFeign 4.x 新增
    QueryMapEncoder queryMapEncoder = getInheritedAwareOptional(context, QueryMapEncoder.class);
    if (queryMapEncoder != null) {
        builder.queryMapEncoder(queryMapEncoder);
    }

    // 11. dismiss404 处理
    if (dismiss404) {
        builder.dismiss404();
    }

    // 12. 异常传播策略 - OpenFeign 4.x 新增
    ExceptionPropagationPolicy exceptionPropagationPolicy = getInheritedAwareOptional(
            context, ExceptionPropagationPolicy.class);
    if (exceptionPropagationPolicy != null) {
        builder.exceptionPropagationPolicy(exceptionPropagationPolicy);
    }

    // 13. Capability（扩展能力）- 追加型
    Map<String, Capability> capabilities = getInheritedAwareInstances(context, Capability.class);
    if (capabilities != null) {
        capabilities.values().stream()
            .sorted(AnnotationAwareOrderComparator.INSTANCE)
            .forEach(builder::addCapability);
    }
}

/**
 * 根据是否继承父上下文获取 Bean
 * OpenFeign 4.x 使用此方法替代原来的 getOptional
 */
private <T> T getInheritedAwareOptional(FeignClientFactory context, Class<T> type) {
    if (inheritParentContext) {
        return context.getInstance(contextId, type);
    } else {
        return context.getInstanceWithoutAncestors(contextId, type);
    }
}

/**
 * 根据是否继承父上下文获取所有 Bean 实例
 */
private <T> Map<String, T> getInheritedAwareInstances(FeignClientFactory context, Class<T> type) {
    if (inheritParentContext) {
        return context.getInstances(contextId, type);
    } else {
        return context.getInstancesWithoutAncestors(contextId, type);
    }
}
```

### 3.2 configureUsingProperties

```java
/**
 * 从 Properties 配置中读取配置并应用到 builder
 * 源码位置: 第 252-330 行
 * 参数说明:
 *   - baseConfig: 配置文件中的 default 配置
 *   - finalConfig: 配置文件中该 FeignClient 的专属配置
 *   - builder: Feign.Builder 对象
 */
private void configureUsingProperties(
        FeignClientConfiguration baseConfig,
        FeignClientConfiguration clientConfig,
        Feign.Builder builder) {

    // 先应用 baseConfig（default），再应用 finalConfig（特定 client）
    configureUsingProperties(baseConfig, builder);
    configureUsingProperties(finalConfig, builder);

    // 处理 dismiss404（从 baseConfig 或 finalConfig 获取）
    Boolean dismiss404 = finalConfig != null && finalConfig.getDismiss404() != null 
        ? finalConfig.getDismiss404()
        : (baseConfig != null && baseConfig.getDismiss404() != null ? baseConfig.getDismiss404() : null);
    if (dismiss404 != null && dismiss404) {
        builder.dismiss404();
    }
}

/**
 * 将单个 FeignClientConfiguration 应用到 builder
 * 源码位置: 第 265-330 行
 */
private void configureUsingProperties(FeignClientConfiguration config, Feign.Builder builder) {
    if (config == null) {
        return;
    }

    // 1. 日志级别
    if (config.getLoggerLevel() != null) {
        builder.logLevel(config.getLoggerLevel());
    }

    // 2. 超时配置（含 followRedirects）
    // 注意：仅当 refreshableClient = false 时才从配置设置超时
    if (!refreshableClient) {
        // 保存超时值供后续使用（增量更新）
        connectTimeoutMillis = config.getConnectTimeout() != null 
            ? config.getConnectTimeout() : connectTimeoutMillis;
        readTimeoutMillis = config.getReadTimeout() != null 
            ? config.getReadTimeout() : readTimeoutMillis;
        followRedirects = config.isFollowRedirects() != null 
            ? config.isFollowRedirects() : followRedirects;

        // 使用 TimeUnit 构造 Request.Options
        builder.options(new Request.Options(
            connectTimeoutMillis, TimeUnit.MILLISECONDS,
            readTimeoutMillis, TimeUnit.MILLISECONDS,
            followRedirects
        ));
    }

    // 3. 重试策略
    if (config.getRetryer() != null) {
        builder.retryer(getOrInstantiate(config.getRetryer()));
    }

    // 4. 错误解码器
    if (config.getErrorDecoder() != null) {
        builder.errorDecoder(getOrInstantiate(config.getErrorDecoder()));
    }

    // 5. 请求拦截器（追加型）
    if (config.getRequestInterceptors() != null && !config.getRequestInterceptors().isEmpty()) {
        for (Class<RequestInterceptor> interceptorClass : config.getRequestInterceptors()) {
            RequestInterceptor interceptor = getOrInstantiate(interceptorClass);
            builder.requestInterceptor(interceptor);
        }
    }

    // 6. 响应拦截器 - OpenFeign 4.x 新增
    if (config.getResponseInterceptor() != null) {
        builder.responseInterceptor(getOrInstantiate(config.getResponseInterceptor()));
    }

    // 7. 编码器
    if (Objects.nonNull(config.getEncoder())) {
        builder.encoder(getOrInstantiate(config.getEncoder()));
    }

    // 8. 解码器
    if (Objects.nonNull(config.getDecoder())) {
        builder.decoder(getOrInstantiate(config.getDecoder()));
    }

    // 9. 契约
    if (Objects.nonNull(config.getContract())) {
        builder.contract(getOrInstantiate(config.getContract()));
    }

    // 10. 异常传播策略 - OpenFeign 4.x 新增
    if (Objects.nonNull(config.getExceptionPropagationPolicy())) {
        builder.exceptionPropagationPolicy(config.getExceptionPropagationPolicy());
    }

    // 11. Capability 扩展能力 - OpenFeign 4.x 新增（追加型）
    if (config.getCapabilities() != null) {
        config.getCapabilities().stream()
            .map(this::getOrInstantiate)
            .forEach(builder::addCapability);
    }

    // 12. QueryMap 编码器 - OpenFeign 4.x 新增
    if (config.getQueryMapEncoder() != null) {
        builder.queryMapEncoder(getOrInstantiate(config.getQueryMapEncoder()));
    }
}

/**
 * 获取或实例化配置类
 * 源码位置: 第 384-391 行
 * 先尝试从 Spring 容器获取，若不存在则直接实例化
 */
private <T> T getOrInstantiate(Class<T> tClass) {
    try {
        return beanFactory != null 
            ? beanFactory.getBean(tClass) 
            : applicationContext.getBean(tClass);
    } catch (NoSuchBeanDefinitionException e) {
        return BeanUtils.instantiateClass(tClass);
    }
}
```

### 3.3 configureDefaultRequestElements（OpenFeign 4.x 新增）

```java
/**
 * 配置默认请求元素（请求头和查询参数）
 * 源码位置: 第 332-358 行
 * 这些元素通过拦截器添加到请求中，且不会覆盖已存在的值
 */
private void configureDefaultRequestElements(
        FeignClientConfiguration defaultConfig,
        FeignClientConfiguration clientConfig,
        Feign.Builder builder) {

    // 1. 合并默认请求头（clientConfig 覆盖 defaultConfig）
    Map<String, Collection<String>> defaultRequestHeaders = new HashMap<>();
    if (defaultConfig != null) {
        defaultConfig.getDefaultRequestHeaders()
            .forEach((k, v) -> defaultRequestHeaders.put(k, new ArrayList<>(v)));
    }
    if (clientConfig != null) {
        clientConfig.getDefaultRequestHeaders()
            .forEach((k, v) -> defaultRequestHeaders.put(k, new ArrayList<>(v)));
    }
    if (!defaultRequestHeaders.isEmpty()) {
        addDefaultRequestHeaders(defaultRequestHeaders, builder);
    }

    // 2. 合并默认查询参数
    Map<String, Collection<String>> defaultQueryParameters = new HashMap<>();
    if (defaultConfig != null) {
        defaultConfig.getDefaultQueryParameters()
            .forEach((k, v) -> defaultQueryParameters.put(k, new ArrayList<>(v)));
    }
    if (clientConfig != null) {
        clientConfig.getDefaultQueryParameters()
            .forEach((k, v) -> defaultQueryParameters.put(k, new ArrayList<>(v)));
    }
    if (!defaultQueryParameters.isEmpty()) {
        addDefaultQueryParams(defaultQueryParameters, builder);
    }
}

/**
 * 通过拦截器添加默认请求头
 * 源码位置: 第 372-382 行
 * 仅当请求中不存在该 Header 时才添加
 */
private void addDefaultRequestHeaders(
        Map<String, Collection<String>> defaultRequestHeaders,
        Feign.Builder builder) {
    builder.requestInterceptor(requestTemplate -> {
        Map<String, Collection<String>> headers = requestTemplate.headers();
        defaultRequestHeaders.keySet().forEach(key -> {
            if (!headers.containsKey(key)) {
                requestTemplate.header(key, defaultRequestHeaders.get(key));
            }
        });
    });
}

/**
 * 通过拦截器添加默认查询参数
 * 源码位置: 第 361-369 行
 * 仅当请求中不存在该参数时才添加
 */
private void addDefaultQueryParams(
        Map<String, Collection<String>> defaultQueryParameters,
        Feign.Builder builder) {
    builder.requestInterceptor(requestTemplate -> {
        Map<String, Collection<String>> queries = requestTemplate.queries();
        defaultQueryParameters.keySet().forEach(key -> {
            if (!queries.containsKey(key)) {
                requestTemplate.query(key, defaultQueryParameters.get(key));
            }
        });
    });
}
```

---

## 五、配置优先级详解

### 4.1 配置来源优先级层次

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Feign 配置优先级层次                                  │
│                                                                             │
│  default-to-properties = true（默认值）                                      │
│  inherit-parent-context = true（默认值）                                     │
│  ═════════════════════════════════                                          │
│                                                                             │
│  配置应用顺序（按 configureFeign 执行顺序）：                                  │
│                                                                             │
│  Step 1: configureUsingConfiguration()                                      │
│  ─────────────────────────────────                                          │
│  ├── Level 1: Global Configuration Bean                                     │
│  │   ├── 被 @Configuration 注解并扫描到 Spring 容器的类                       │
│  │   ├── 没有 @FeignClient.configuration 指定                                │
│  │   └── 作为全局默认配置                                                    │
│  │                                                                           │
│  └── Level 2: Specific Configuration Bean                                   │
│      ├── @FeignClient(configuration = XxxConfig.class) 指定的类              │
│      ├── 只对该 FeignClient 生效                                            │
│      └── 覆盖 Level 1 的同名配置                                             │
│                                                                             │
│  Step 2: configureUsingProperties()                                         │
│  ─────────────────────────────────                                          │
│  ├── Level 3: spring.cloud.openfeign.client.config.default                  │
│  │   ├── application.yml 中的 default 配置                                  │
│  │   ├── 影响所有没有专属配置的 FeignClient                                   │
│  │   └── 覆盖 Step 1 的同名配置                                              │
│  │                                                                           │
│  └── Level 4: spring.cloud.openfeign.client.config.<contextId>              │
│      ├── application.yml 中特定 client 的配置                                │
│      ├── contextId = @FeignClient 的 name 或 contextId 属性                  │
│      ├── 最高优先级，覆盖所有同名配置                                          │
│      └── finalConfig 覆盖 baseConfig                                        │
│                                                                             │
│  Step 3: configureDefaultRequestElements()（OpenFeign 4.x 新增）             │
│  ─────────────────────────────────                                          │
│  ├── defaultRequestHeaders 合并                                              │
│  │   └── clientConfig 的值覆盖 defaultConfig 的同名 key                      │
│  │   └── 仅当请求中不存在该 Header 时才添加                                   │
│  │                                                                           │
│  └── defaultQueryParameters 合并                                             │
│      └── clientConfig 的值覆盖 defaultConfig 的同名 key                      │
│      └── 仅当请求中不存在该参数时才添加                                        │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│  inherit-parent-context = false                                             │
│  ═════════════════════════════════════                                      │
│                                                                             │
│  仅执行 Step 2（Properties 配置）和 Step 3                                   │
│  不继承 Configuration Bean（跳过 Step 1）                                    │
│  通过 FeignClientConfigurer.inheritParentConfiguration() = false 控制       │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│  default-to-properties = false                                              │
│  ═══════════════════════════════════                                        │
│                                                                             │
│  执行顺序：Step 2 → Step 1 → Step 3                                          │
│  优先级：Configuration Bean > Properties 配置                               │
│                                                                             │
│  Level 1: spring.cloud.openfeign.client.config.default                      │
│  Level 2: spring.cloud.openfeign.client.config.<contextId>                  │
│  Level 3: Global Configuration Bean                                         │
│  Level 4: Specific Configuration Bean                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 配置项合并策略

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         配置项合并策略                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【覆盖型配置】- 后设置的覆盖前设置的                                            │
│  ─────────────────────────────────────                                      │
│  • loggerLevel              日志级别                                         │
│  • connectTimeout           连接超时                                         │
│  • readTimeout              读取超时                                         │
│  • followRedirects          是否跟随重定向（OpenFeign 4.x 新增）               │
│  • retryer                  重试策略                                         │
│  • errorDecoder             错误解码器                                       │
│  • encoder                  编码器                                           │
│  • decoder                  解码器                                           │
│  • contract                 契约（注解处理器）                                 │
│  • options                  Request.Options 整体                             │
│  • responseInterceptor      响应拦截器（OpenFeign 4.x 新增）                   │
│  • queryMapEncoder          QueryMap 编码器（OpenFeign 4.x 新增）             │
│  • exceptionPropagationPolicy 异常传播策略（OpenFeign 4.x 新增）               │
│                                                                             │
│  【追加型配置】- 所有配置都会保留                                               │
│  ─────────────────────────────────────                                      │
│  • requestInterceptors      请求拦截器                                       │
│    └── 所有拦截器按 @Order 或 Ordered 接口顺序依次执行                          │
│    └── configureUsingConfiguration + configureUsingProperties 都追加        │
│                                                                             │
│  • capabilities             Capability 扩展能力（OpenFeign 4.x 新增）         │
│    └── 所有 Capability 按顺序添加到 builder                                   │
│                                                                             │
│  【条件型配置】- 仅在特定条件下生效                                             │
│  ─────────────────────────────────────                                      │
│  • dismiss404               忽略 404 错误                                    │
│    └── 仅当设置为 true 时才调用 builder.dismiss404()                          │
│    └── 从 clientConfig 或 defaultConfig 获取                                │
│                                                                             │
│  【默认值配置】- 不覆盖已存在的值                                               │
│  ─────────────────────────────────────                                      │
│  • defaultRequestHeaders    默认请求头（OpenFeign 4.x 新增）                   │
│    └── 通过拦截器添加，仅当请求中不存在该 Header 时才添加                        │
│                                                                             │
│  • defaultQueryParameters   默认查询参数（OpenFeign 4.x 新增）                 │
│    └── 通过拦截器添加，仅当请求中不存在该参数时才添加                            │
│                                                                             │
│  【特殊说明】                                                                 │
│  ─────────────────────────────────────                                      │
│  • Request.Options 构造方式：                                                │
│    builder.options(new Request.Options(                                     │
│        connectTimeoutMillis, TimeUnit.MILLISECONDS,                         │
│        readTimeoutMillis, TimeUnit.MILLISECONDS,                            │
│        followRedirects                                                      │
│    ));                                                                      │
│                                                                             │
│  • 超时值采用增量更新：后设置的只覆盖指定的值，未指定的保持原值                    │
│                                                                             │
│  • refreshableClient = true 时，超时配置不从 Properties 读取                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 六、配置示例

### 5.1 配置文件示例

```yaml
# application.yml
spring:
  cloud:
    openfeign:
      client:
        # ════════════════════════════════════════════════════
        # 核心配置：控制优先级
        # ════════════════════════════════════════════════════
        default-to-properties: true   # true: properties优先（默认）
                                      # false: Configuration Bean优先

        default-config: default       # 默认配置的 key 名称

        # ════════════════════════════════════════════════════
        # 全局配置
        # ════════════════════════════════════════════════════
        decode-slash: true            # 是否对斜杠进行编码

        # ════════════════════════════════════════════════════
        # 默认配置（应用到所有 FeignClient）
        # ════════════════════════════════════════════════════
        config:
          default:
            # === 基础配置 ===
            connectTimeout: 3000      # 连接超时 3秒
            readTimeout: 10000        # 读取超时 10秒
            loggerLevel: HEADERS      # 日志级别：HEADERS
            followRedirects: true     # 是否跟随重定向（OpenFeign 4.x 新增）

            # === 默认请求元素（OpenFeign 4.x 新增）===
            defaultRequestHeaders:
              X-Api-Version: ["v1"]
              X-Request-Source: ["feign-client"]
            defaultQueryParameters:
              api_version: ["v1"]

            # === Micrometer 监控（OpenFeign 4.x 新增）===
            micrometer:
              enabled: true

          # ════════════════════════════════════════════════════
          # 特定服务配置（按 @FeignClient 的 name/contextId 匹配）
          # ════════════════════════════════════════════════════
          user-service:               # 匹配 @FeignClient(name = "user-service")
            # === 基础配置 ===
            connectTimeout: 2000      # 连接超时 2秒（覆盖 default 的 3秒）
            readTimeout: 5000         # 读取超时 5秒（覆盖 default 的 10秒）
            loggerLevel: BASIC        # 日志级别：BASIC（覆盖 default 的 HEADERS）
            followRedirects: false    # 不跟随重定向

            # === URL 配置（OpenFeign 4.x 新增）===
            # 仅当 @FeignClient 未设置 url 时生效
            url: https://user-service.example.com

            # === 默认请求头覆盖 ===
            defaultRequestHeaders:
              X-Api-Version: ["v2"]  # 覆盖 default 的 v1
              Authorization: ["Bearer user-token"]

            # === 异常传播策略（OpenFeign 4.x 新增）===
            exceptionPropagationPolicy: UNWRAP

            # === dismiss404 ===
            dismiss404: true          # 忽略 404 错误

          order-service:              # 匹配 @FeignClient(name = "order-service")
            connectTimeout: 8000
            readTimeout: 30000
            loggerLevel: FULL         # 详细日志
            # === Capability 配置（OpenFeign 4.x 新增）===
            capabilities:
              - com.example.feign.LoggingCapability
              - com.example.feign.TracingCapability

          payment-service:            # 支付服务需要更长超时
            connectTimeout: 5000
            readTimeout: 60000        # 60秒读取超时
            loggerLevel: FULL
            # === QueryMap 编码器（OpenFeign 4.x 新增）===
            queryMapEncoder: com.example.feign.CustomQueryMapEncoder

          notification-email:         # 匹配 contextId = "notification-email"
            connectTimeout: 1000
            readTimeout: 5000
            defaultQueryParameters:
              channel: ["email"]
```

### 5.2 Configuration Bean 示例

```java
/**
 * 全局 Feign 配置类
 * 此类中的 Bean 会作为全局默认配置
 */
@Configuration
public class GlobalFeignConfig {

    /**
     * 日志级别 - 全局设置为 FULL
     */
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }

    /**
     * 超时配置 - 全局默认
     */
    @Bean
    public Request.Options requestOptions() {
        // connectTimeout = 10秒, readTimeout = 60秒, followRedirects = true
        return new Request.Options(10_000, TimeUnit.MILLISECONDS, 
                                   60_000, TimeUnit.MILLISECONDS, true);
    }

    /**
     * 重试策略 - 不重试
     */
    @Bean
    public Retryer feignRetryer() {
        return new Retryer.Default(100, 1, 0);
    }

    /**
     * 全局请求拦截器 - 添加通用 Header
     * 注意：拦截器是追加型，不会被覆盖
     */
    @Bean
    @Order(1)  // 使用 @Order 控制执行顺序
    public RequestInterceptor globalRequestInterceptor() {
        return template -> {
            template.header("X-Global-Header", "from-global-config");
            template.header("X-Request-Id", UUID.randomUUID().toString());
        };
    }

    /**
     * 响应拦截器 - OpenFeign 4.x 新增
     * 可在响应返回后进行处理
     */
    @Bean
    public ResponseInterceptor globalResponseInterceptor() {
        return (invocationContext, response) -> {
            // 记录响应日志
            log.info("Response status: {}", response.status());
            return response;
        };
    }

    /**
     * Capability 扩展能力 - OpenFeign 4.x 新增
     * 可添加自定义功能扩展
     */
    @Bean
    public Capability loggingCapability() {
        return new LoggingCapability();
    }
}

/**
 * User 服务专用配置类
 * 只对指定了此 configuration 的 FeignClient 生效
 * 注意：不要加 @Configuration 注解，否则会变成全局配置
 */
public class UserServiceFeignConfig {

    /**
     * User 服务的日志级别
     */
    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }

    /**
     * User 服务的超时配置
     */
    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(5_000, TimeUnit.MILLISECONDS,
                                   30_000, TimeUnit.MILLISECONDS, false);
    }

    /**
     * User 服务专用拦截器
     * 添加认证 Header
     */
    @Bean
    @Order(2)  // 在全局拦截器之后执行
    public RequestInterceptor userServiceInterceptor() {
        return template -> {
            template.header("X-User-Header", "from-user-config");
            template.header("Authorization", "Bearer user-service-token");
        };
    }

    /**
     * 错误解码器工厂 - OpenFeign 4.x 新增
     * 可根据 FeignClient 类型创建不同的错误解码器
     */
    @Bean
    public FeignErrorDecoderFactory userErrorDecoderFactory() {
        return new UserErrorDecoderFactory();
    }

    /**
     * QueryMap 编码器 - OpenFeign 4.x 新增
     * 用于将对象转换为查询参数
     */
    @Bean
    public QueryMapEncoder customQueryMapEncoder() {
        return new CustomQueryMapEncoder();
    }
}

/**
 * Order 服务专用配置类
 */
public class OrderServiceFeignConfig {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.HEADERS;
    }

    @Bean
    public Request.Options requestOptions() {
        return new Request.Options(8_000, TimeUnit.MILLISECONDS,
                                   45_000, TimeUnit.MILLISECONDS, true);
    }

    /**
     * 异常传播策略 - OpenFeign 4.x 新增
     * 控制异常如何传播
     */
    @Bean
    public ExceptionPropagationPolicy exceptionPropagationPolicy() {
        return ExceptionPropagationPolicy.UNWRAP;
    }
}
```

### 5.3 FeignClientConfigurer 控制继承（OpenFeign 4.x 新增）

```java
/**
 * 通过 FeignClientConfigurer 控制是否继承父上下文配置
 * 实现 FeignClientConfigurer 接口并在配置类中定义 Bean
 */
public class NoInheritConfig implements FeignClientConfigurer {

    /**
     * 返回 false 表示不继承父上下文配置
     * 仅使用当前 FeignClient 的 configuration 类中的 Bean
     */
    @Override
    public boolean inheritParentConfiguration() {
        return false;  // 不继承全局配置
    }
}

/**
 * 使用示例：
 * @FeignClient(name = "isolated-service", configuration = NoInheritConfig.class)
 * 该 FeignClient 将不会继承 GlobalFeignConfig 中的任何配置
 */
```

### 5.4 FeignClient 声明示例

```java
/**
 * UserClient - 使用专用配置类
 * 配置来源:
 *   1. GlobalFeignConfig (全局 Configuration Bean)
 *   2. application.yml → default (全局 properties)
 *   3. UserServiceFeignConfig (专用 Configuration Bean)
 *   4. application.yml → user-service (专用 properties)
 */
@FeignClient(
    name = "user-service",
    url = "${user-service.url}",
    configuration = UserServiceFeignConfig.class
)
public interface UserClient {

    @GetMapping("/users/{id}")
    UserDTO getUser(@PathVariable("id") Long id);

    @PostMapping("/users")
    UserDTO createUser(@RequestBody UserDTO user);
}

/**
 * OrderClient - 使用专用配置类
 */
@FeignClient(
    name = "order-service",
    url = "${order-service.url}",
    configuration = OrderServiceFeignConfig.class
)
public interface OrderClient {

    @GetMapping("/orders/{id}")
    OrderDTO getOrder(@PathVariable("id") Long id);
}

/**
 * PaymentClient - 没有指定专用配置类
 * 只使用全局配置 + properties 配置
 */
@FeignClient(
    name = "payment-service",
    url = "${payment-service.url}"
    // 没有 configuration 属性
)
public interface PaymentClient {

    @PostMapping("/payments")
    PaymentResult pay(@RequestBody PaymentRequest request);
}

/**
 * NotificationClient - 使用 contextId 区分同名客户端
 * 当多个 FeignClient 使用相同的 name 时，需要用 contextId 区分配置
 */
@FeignClient(
    name = "notification-service",
    contextId = "email-notification",  // 配置会使用 config.email-notification
    url = "${notification-service.url}"
)
public interface EmailNotificationClient {
    @PostMapping("/notifications/email")
    void sendEmail(@RequestBody EmailRequest request);
}

@FeignClient(
    name = "notification-service",
    contextId = "sms-notification",    // 配置会使用 config.sms-notification
    url = "${notification-service.url}"
)
public interface SmsNotificationClient {
    @PostMapping("/notifications/sms")
    void sendSms(@RequestBody SmsRequest request);
}
```

---

## 七、执行流程详解

### 6.1 defaultToProperties = true（默认情况）

以 `UserClient` 初始化为例：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UserClient 初始化流程                                     │
│                    defaultToProperties = true                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: 获取 FeignClientProperties                                         │
│          properties = context.getBean(FeignClientProperties.class)          │
│          → defaultToProperties = true                                       │
│          → defaultConfig = "default"                                        │
│          → contextId = "user-service"                                       │
│                                                                             │
│  Step 2: configureUsingConfiguration(context, builder)                      │
│          ═════════════════════════════════════════════════                  │
│                                                                             │
│          [从 Spring 容器获取 Bean]                                            │
│          → 查找 GlobalFeignConfig 中的 Bean                                  │
│            ├── loggerLevel = FULL                                           │
│            ├── connectTimeout = 10000                                       │
│            ├── readTimeout = 60000                                          │
│            └── 添加拦截器: globalRequestInterceptor                           │
│                                                                             │
│          → 查找 UserServiceFeignConfig 中的 Bean                             │
│            ├── loggerLevel = BASIC (覆盖 FULL)                              │
│            ├── connectTimeout = 5000 (覆盖 10000)                           │
│            ├── readTimeout = 30000 (覆盖 60000)                             │
│            └── 添加拦截器: userServiceInterceptor                            │
│                                                                             │
│          当前配置状态:                                                         │
│          ┌──────────────┬────────────┬─────────────────────────────────────┐│
│          │ 配置项        │ 当前值      │ 来源                                ││
│          ├──────────────┼────────────┼─────────────────────────────────────┤│
│          │ loggerLevel  │ BASIC      │ UserServiceFeignConfig              ││
│          │ connectTimeout│ 5000      │ UserServiceFeignConfig              ││
│          │ readTimeout  │ 30000      │ UserServiceFeignConfig              ││
│          │ 拦截器        │ 2个        │ Global + UserService (追加)         ││
│          └──────────────┴────────────┴─────────────────────────────────────┘│
│                                                                             │
│  Step 3: configureUsingProperties(defaultConfig, builder)                   │
│          ═══════════════════════════════════════════════════                │
│                                                                             │
│          [读取 application.yml 中的 default 配置]                            │
│          → spring.cloud.openfeign.client.config.default                    │
│            ├── connectTimeout = 3000 (覆盖 5000)                            │
│            ├── readTimeout = 10000 (覆盖 30000)                             │
│            ├── loggerLevel = HEADERS (覆盖 BASIC)                           │
│                                                                             │
│          当前配置状态:                                                         │
│          ┌──────────────┬────────────┬─────────────────────────────────────┐│
│          │ 配置项        │ 当前值      │ 来源                                ││
│          ├──────────────┼────────────┼─────────────────────────────────────┤│
│          │ loggerLevel  │ HEADERS    │ properties.default                  ││
│          │ connectTimeout│ 3000      │ properties.default                  ││
│          │ readTimeout  │ 10000      │ properties.default                  ││
│          │ 拦截器        │ 2个        │ 不受影响                            ││
│          └──────────────┴────────────┴─────────────────────────────────────┘│
│                                                                             │
│  Step 4: configureUsingProperties(clientConfig, builder)                    │
│          ═══════════════════════════════════════════════════                │
│                                                                             │
│          [读取 application.yml 中的 user-service 配置]                      │
│          → spring.cloud.openfeign.client.config.user-service               │
│            ├── connectTimeout = 2000 (覆盖 3000)                            │
│            ├── readTimeout = 5000 (覆盖 10000)                              │
│            ├── loggerLevel = BASIC (覆盖 HEADERS)                           │
│            ├── defaultRequestHeaders: Authorization=Bearer token            │
│                                                                             │
│  Step 5: configureDefaultRequestElements()（OpenFeign 4.x 新增）             │
│          ═══════════════════════════════════════════════════                │
│                                                                             │
│          [合并默认请求元素]                                                    │
│          → defaultRequestHeaders 合并                                        │
│            ├── default: X-Api-Version=v1                                    │
│            ├── user-service: Authorization=Bearer token（覆盖同名）           │
│            └── 通过拦截器添加（仅当请求中不存在时）                             │
│                                                                             │
│          ════════════════════════════════════════════════════════════════   │
│          最终配置:                                                            │
│          ┌──────────────┬────────────┬─────────────────────────────────────┐│
│          │ 配置项        │ 最终值      │ 最终来源                            ││
│          ├──────────────┼────────────┼─────────────────────────────────────┤│
│          │ loggerLevel  │ BASIC      │ properties.user-service             ││
│          │ connectTimeout│ 2000      │ properties.user-service             ││
│          │ readTimeout  │ 5000       │ properties.user-service             ││
│          │ 拦截器        │ 3个        │ Global + UserService + defaultHeaders││
│          └──────────────┴────────────┴─────────────────────────────────────┘│
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════   │
│  结论: Properties 配置覆盖了 Configuration Bean 的同名配置                    │
│       拦截器为追加型，所有配置都保留                                            │
│       默认请求元素通过拦截器添加，不覆盖已存在的值                               │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 defaultToProperties = false

以 `UserClient` 初始化为例：

```yaml
spring:
  cloud:
    openfeign:
      client:
        default-to-properties: false  # 改为 false
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UserClient 初始化流程                                     │
│                    defaultToProperties = false                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: configureUsingProperties(defaultConfig, builder)                   │
│          ═══════════════════════════════════════════════════                │
│                                                                             │
│          [先应用 properties 配置]                                             │
│          → spring.cloud.openfeign.client.config.default                    │
│            ├── loggerLevel = HEADERS                                        │
│            ├── connectTimeout = 3000                                        │
│            ├── readTimeout = 10000                                          │
│                                                                             │
│          → spring.cloud.openfeign.client.config.user-service               │
│            ├── loggerLevel = BASIC (覆盖 HEADERS)                           │
│            ├── connectTimeout = 2000 (覆盖 3000)                            │
│            ├── readTimeout = 5000 (覆盖 10000)                              │
│                                                                             │
│          当前配置状态:                                                         │
│          ┌──────────────┬────────────┐                                      │
│          │ 配置项        │ 当前值      │                                      │
│          ├──────────────┼────────────┤                                      │
│          │ loggerLevel  │ BASIC      │                                      │
│          │ connectTimeout│ 2000      │                                      │
│          │ readTimeout  │ 5000       │                                      │
│          └──────────────┴────────────┘                                      │
│                                                                             │
│  Step 2: configureUsingConfiguration(context, builder)                      │
│          ═════════════════════════════════════════════════                  │
│                                                                             │
│          [后应用 Configuration Bean 配置，会覆盖前者]                          │
│          → GlobalFeignConfig                                                │
│            ├── loggerLevel = FULL (覆盖 BASIC)                              │
│            ├── connectTimeout = 10000 (覆盖 2000)                           │
│            ├── readTimeout = 60000 (覆盖 5000)                              │
│            └── 添加拦截器                                                     │
│                                                                             │
│          → UserServiceFeignConfig                                           │
│            ├── loggerLevel = BASIC (覆盖 FULL)                              │
│            ├── connectTimeout = 5000 (覆盖 10000)                           │
│            ├── readTimeout = 30000 (覆盖 60000)                             │
│            └── 添加拦截器                                                     │
│                                                                             │
│          ════════════════════════════════════════════════════════════════   │
│          最终配置:                                                            │
│          ┌──────────────┬────────────┬─────────────────────────────────────┐│
│          │ 配置项        │ 最终值      │ 最终来源                            ││
│          ├──────────────┼────────────┼─────────────────────────────────────┤│
│          │ loggerLevel  │ BASIC      │ UserServiceFeignConfig              ││
│          │ connectTimeout│ 5000      │ UserServiceFeignConfig              ││
│          │ readTimeout  │ 30000      │ UserServiceFeignConfig              ││
│          │ 拦截器        │ 2个        │ Global + UserService                ││
│          └──────────────┴────────────┴─────────────────────────────────────┘│
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════   │
│  结论: Configuration Bean 配置覆盖了 Properties 的同名配置                    │
│       最终结果来自 UserServiceFeignConfig                                    │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 八、两种模式对比

### 7.1 最终配置对比表

| 配置来源 | connectTimeout | readTimeout | loggerLevel | 优先级排序 |
|---------|----------------|-------------|-------------|-----------|
| GlobalFeignConfig | 10000 | 60000 | FULL | 低 |
| UserServiceFeignConfig | 5000 | 30000 | BASIC | 中 |
| properties.default | 3000 | 10000 | HEADERS | 中 |
| properties.user-service | 2000 | 5000 | BASIC | 高 |

**defaultToProperties = true（默认）：**

| 最终生效值 | connectTimeout | readTimeout | loggerLevel |
|-----------|----------------|-------------|-------------|
| | **2000** | **5000** | **BASIC** |
| 来源 | properties.user-service | properties.user-service | properties.user-service |

**defaultToProperties = false：**

| 最终生效值 | connectTimeout | readTimeout | loggerLevel |
|-----------|----------------|-------------|-------------|
| | **5000** | **30000** | **BASIC** |
| 来源 | UserServiceFeignConfig | UserServiceFeignConfig | UserServiceFeignConfig |

### 7.2 使用场景建议

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         使用场景建议                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  【default-to-properties: true（默认）】                                     │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│  适用场景:                                                                    │
│  • 生产环境 - 通过配置文件灵活调整，无需重新编译                                 │
│  • 多环境部署 - dev/prod/test 使用不同的 application-*.yml                   │
│  • 运维可调整 - 超时时间等可运维人员通过配置文件调整                              │
│  • 快速响应问题 - 出现超时问题时可快速调整配置                                   │
│                                                                             │
│  优点:                                                                       │
│  • 配置灵活，无需修改代码                                                      │
│  • 支持环境隔离                                                               │
│  • 支持 Spring Cloud Config 动态刷新                                         │
│                                                                             │
│  缺点:                                                                       │
│  • Configuration Bean 的配置可能被意外覆盖                                    │
│  • 开发人员可能不知道最终配置来自哪里                                           │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                             │
│  【default-to-properties: false】                                            │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│  适用场景:                                                                    │
│  • 开发/测试环境 - 确保代码中的配置不被意外覆盖                                  │
│  • 有硬性约束的服务 - 某些服务配置必须固定                                      │
│  • 安全相关配置 - 认证、加密等配置不应被配置文件覆盖                             │
│                                                                             │
│ 优点:                                                                        │
│  • Configuration Bean 中的配置有最终决定权                                    │
│  • 代码配置更可靠                                                             │
│                                                                             │
│ 缺点:                                                                        │
│  • 调整配置需要修改代码并重新部署                                              │
│  • 无法通过配置文件动态调整                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 九、特殊情况处理

### 8.1 没有 FeignClientProperties 时

```java
// 如果没有引入 spring-cloud-starter-openfeign 或没有配置
// FeignClientProperties bean 不存在
if (properties == null) {
    // 只使用 Configuration Bean 配置
    configureUsingConfiguration(context, builder);
}
```

### 8.2 没有指定 configuration 属性时

```java
// @FeignClient(name = "payment-service")  // 没有 configuration
// 只会查找全局配置 Bean（被 @Configuration 注解并扫描到的）
// 不会查找任何专用配置类
```

### 8.3 contextId 的作用

```java
/**
 * contextId 用于区分同名的多个 FeignClient
 *
 * 场景: 同一个服务需要多个不同的 FeignClient
 */
@FeignClient(name = "notification-service", contextId = "email-client")
public interface EmailClient { ... }

@FeignClient(name = "notification-service", contextId = "sms-client")
public interface SmsClient { ... }

// 配置文件中:
// spring.cloud.openfeign.client.config.email-client = Email 配置
// spring.cloud.openfeign.client.config.sms-client = SMS 配置

// 如果没有 contextId，两个 Client 会使用相同的 name "notification-service"
// 导致 Spring Bean 名称冲突
```

---

## 十、完整请求执行示例

```java
// 调用 UserClient.getUser(1L)
// 实际执行过程:

// 1. Feign 构建 Request
//    GET http://user-service/users/1

// 2. 执行拦截器链（按添加顺序）
//    → globalRequestInterceptor
//      ├── X-Global-Header: from-global-config
//      ├── X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
//
//    → userServiceInterceptor
//      ├── X-User-Header: from-user-config
//      ├── Authorization: Bearer user-service-token

// 3. 发送请求
//    → 使用 connectTimeout = 2000ms（来自 properties.user-service）
//    → 使用 readTimeout = 5000ms（来自 properties.user-service）

// 4. 日志输出
//    → loggerLevel = BASIC（来自 properties.user-service）
//    → 只记录请求方法和响应状态码

// 实际日志输出:
// 2026-05-23 10:00:00.000 INFO  [user-service] ---> GET http://user-service:8080/users/1
// 2026-05-23 10:00:00.150 INFO  [user-service] <--- HTTP/1.1 200 (150ms)
```

---

## 十一、总结

### 核心要点

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         核心要点总结                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 配置优先级由 defaultToProperties 控制                                    │
│     • true（默认）: Properties 配置 > Configuration Bean                    │
│     • false: Configuration Bean > Properties 配置                           │
│                                                                             │
│  2. inheritParentContext 控制是否继承父配置（OpenFeign 4.x 新增）             │
│     • true（默认）: 继承父上下文配置                                          │
│     • false: 仅使用当前 FeignClient 的 configuration                        │
│     • 通过 FeignClientConfigurer.inheritParentConfiguration() 控制          │
│                                                                             │
│  3. 配置层级（优先级从低到高）                                                 │
│     • 全局 Configuration Bean                                               │
│     • properties.default                                                   │
│     • 专用 Configuration Bean                                              │
│     • properties.<contextId>                                               │
│                                                                             │
│  4. 配置项合并策略                                                            │
│     • 覆盖型：loggerLevel, connectTimeout, readTimeout 等                   │
│     • 追加型：requestInterceptors, capabilities                             │
│     • 条件型：dismiss404                                                    │
│     • 默认值型：defaultRequestHeaders, defaultQueryParameters（不覆盖）      │
│                                                                             │
│  5. OpenFeign 4.x 新增配置项                                                 │
│     • followRedirects: 是否跟随重定向                                        │
│     • responseInterceptor: 响应拦截器                                        │
│     • capabilities: 扩展能力列表                                             │
│     • queryMapEncoder: QueryMap 编码器                                      │
│     • exceptionPropagationPolicy: 异常传播策略                               │
│     • defaultRequestHeaders: 默认请求头                                      │
│     • defaultQueryParameters: 默认查询参数                                   │
│     • url: 配置文件中设置 URL                                                │
│     • micrometer: Micrometer 监控配置                                       │
│                                                                             │
│  6. Request.Options 构造方式                                                 │
│     • 使用 TimeUnit.MILLISECONDS 参数                                       │
│     • 包含 followRedirects 参数                                             │
│     • 超时值采用增量更新                                                      │
│                                                                             │
│  7. 生产环境建议                                                              │
│     • 保持默认 defaultToProperties = true                                   │
│     • Configuration Bean 设置基础默认值                                      │
│     • Properties 文件按环境覆盖特定配置                                       │
│                                                                             │
│  8. contextId 的作用                                                         │
│     • 区分同名 FeignClient                                                   │
│     • 对应 Properties 配置中的 key                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 附录：相关源码类

| 类名 | 位置 | 作用 |
|-----|------|------|
| `FeignClientProperties` | `org.springframework.cloud.openfeign.FeignClientProperties` | 配置属性绑定类 |
| `FeignClientConfiguration` | `org.springframework.cloud.openfeign.FeignClientProperties.FeignClientConfiguration` | 单个客户端配置（内部静态类） |
| `MicrometerProperties` | `org.springframework.cloud.openfeign.FeignClientProperties.MicrometerProperties` | Micrometer 监控配置（内部静态类） |
| `FeignClientFactoryBean` | `org.springframework.cloud.openfeign.FeignClientFactoryBean` | FeignClient 工厂 Bean |
| `FeignClientFactory` | `org.springframework.cloud.openfeign.FeignClientFactory` | Feign 上下文，管理配置 Bean |
| `FeignClientConfigurer` | `org.springframework.cloud.openfeign.clientconfig.FeignClientConfigurer` | 控制是否继承父配置（4.x 新增） |
| `FeignErrorDecoderFactory` | `org.springframework.cloud.openfeign.FeignErrorDecoderFactory` | 错误解码器工厂（4.x 新增） |
| `FeignBuilderCustomizer` | `org.springframework.cloud.openfeign.FeignBuilderCustomizer` | Feign.Builder 定制器 |
| `Targeter` | `org.springframework.cloud.openfeign.Targeter` | Feign 目标对象创建器 |
| `RefreshableUrl` | `org.springframework.cloud.openfeign.RefreshableUrl` | 可刷新 URL（4.x 新增） |
| `Feign.Builder` | `feign.Feign.Builder` | Feign 客户端构建器 |

---

## 参考资料

- Spring Cloud OpenFeign 官方文档: https://docs.spring.io/spring-cloud-openfeign/reference/
- Spring Cloud OpenFeign 源码: https://github.com/spring-cloud/spring-cloud-openfeign
- Netflix Feign 源码: https://github.com/OpenFeign/feign
- Spring Cloud Commons 源码