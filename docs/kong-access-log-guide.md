# Kong Access Log 四指标详解（含 urt）

## 一、四个时间指标的定义

```
时间轴 ──►  0ms                    ▼ Kong前置    ▼ 建连  ▼ 发请求  ▼ 等首字节  ▼ 接收body  ▼ Kong后置  ▼ 发响应
             ├─────────────────────┤├────────────┤├─────┤├────────┤├──────────┤├──────────┤├─────────┤├──────────►
                                  t1            t2     t3        t4          t5          t6          t7

             ┌── Kong 视角（所有时间都从 Kong 内部测量）────────────────────────────────────────────────────────────┐
             │                                                                                                    │
  🟢 rt      │ ◄──────────────────────────────────── $request_time ────────────────────────────────────────────────► │
             │  t1=收到客户端首字节                                                             t7=发完最后一字节给客户端│
             │                                                                                                    │
             │  ◄─ Kong前置 ─►   ◄──────────────────── 上游交互 ────────────────────────────►  ◄─ Kong后置 ──────►│
             │   🟡 (插件before)                                                    🟡 (插件after + 发响应给客户端)│
             │                                                                                                    │
  🔵 uht     │                            ◄──────────── $upstream_header_time ────────────────────────────────────►│
             │                            t2                                                    t5=收到响应头首字节│
             │                            │                                                                         │
  🔴 uct     │                            ├─► ◄── $upstream_connect_time ──►                                       │
             │                            │   t2                         t3=TCP连接建立                             │
             │                            │     (DNS+TCP+SSL建连)        ├─► ◄─ 发请求 ──►                         │
             │                            │                             t3              t4                         │
             │                            │                                             ├─► ◄── 等首字节 ──►│
             │                            │                                                          t4         t5│
             │                            │                                                                         │
  🟠 urt     │                            ◄──────────── $upstream_response_time ───────────────────────────────────►│
             │                            t2                                                           t6=收完响应体│
             └────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

> **色标说明：** 🟢 rt = Kong 总耗时 ｜ 🔵 uht = 建连+请求+首字节 ｜ 🔴 uct = TCP 建连 ｜ 🟠 urt = 建连+请求+完整响应体 ｜ 🟡 Kong 自身处理
>
> ⚠️ **rt 不包含「客户端 → Kong」的网络传输时间，它是 Kong 进程内部计时。**

### 精确定义

| 指标 | 色标 | 变量 | 起点 | 终点 | 衡量什么 |
|------|------|------|------|------|---------|
| **rt** | 🟢 | `$request_time` | 收到客户端第一个字节 | 发完最后一个字节给客户端 | Kong 内部总耗时（不含客户端到Kong的网络延迟） |
| **uct** | 🔴 | `$upstream_connect_time` | 开始 connect() | TCP 连接建立 | 网络建连（含 DNS + TCP + SSL） |
| **uht** | 🔵 | `$upstream_header_time` | 同 uct 起点 | 收到上游**响应头**首字节 | 建连 + 发请求 + 上游处理到首字节 |
| **urt** | 🟠 | `$upstream_response_time` | 同 uct 起点 | 收完上游**响应体**最后一字节 | 建连 + 发请求 + 上游处理 + 传完整响应 |

### 包含关系

```
urt > uht > uct    （严格递增包含）

urt = uct                    ← 建连
   + 发送请求到上游耗时       ← 很小，通常忽略
   + 上游生成响应头耗时       ← 上游服务处理时间
   + 上游发送响应体耗时       ← 响应体越大这越长

uht = uct
   + 发送请求到上游耗时
   + 上游生成响应头耗时

所以：
urt - uht = 上游发送响应体的耗时（网络传输 body 的时间）
uht - uct = 上游服务处理时间（收到请求 → 返回首字节）
```

---

## 二、五段式耗时拆解

```
rt = ①Kong前置处理
   + ②uct（Kong→上游 网络建连）
   + ③uht - uct（上游服务处理）
   + ④urt - uht（上游→Kong 传输响应体）
   + ⑤rt - urt（Kong后置处理 + 发给客户端）
```

| 段 | 计算 | 衡量 | 正常基线 |
|----|------|------|---------|
| ① Kong前置 | `rt - urt` 中的一部分 | 插件 before 阶段 | < 5ms |
| ② 网络建连 | `uct` | Kong ↔ 上游 TCP 质量 | < 5ms 同机房 |
| ③ 上游处理 | `uht - uct` | 上游服务计算耗时 | 视业务 |
| ④ 传响应体 | `urt - uht` | 上游 → Kong 的带宽/网络 | 通常 < 10ms |
| ⑤ Kong后置 | `rt - urt` | 插件 after + 发给客户端 | < 10ms |

> 注意：① 和 ⑤ 无法单独从日志拆开，合起来是 `rt - urt`，统称为 **Kong 自身开销**。

---

## 三、推荐日志格式

```nginx
log_format kong_prod
'$remote_addr '
'[$time_local] '
'"$request" '
'status=$status '
'rt=$request_time '
'uct=$upstream_connect_time '
'uht=$upstream_header_time '
'urt=$upstream_response_time '
'upstream=$upstream_addr '
'rid=$request_id '
'host=$host '
'xff="$http_x_forwarded_for" '
'ua="$http_user_agent"';

access_log /dev/stdout kong_prod;
```

---

## 四、故障定位全景

### 🟢 正常请求

```
rt=0.065 uct=0.002 uht=0.050 urt=0.052
```

| 段 | 耗时 | 状态 |
|----|------|------|
| ② 网络建连 | `uct = 2ms` | ✅ |
| ③ 上游处理 | `uht - uct = 48ms` | ✅ |
| ④ 传响应体 | `urt - uht = 2ms` | ✅ 小 body |
| ①+⑤ Kong开销 | `rt - urt = 13ms` | ✅ |

---

### 🔴 网络问题（Kong → 上游）

#### 4a. TCP 建连慢

```
rt=1.560 uct=1.000 uht=1.050 urt=1.055
```

| 段 | 耗时 | 判断 |
|----|------|------|
| ② 网络建连 | **`uct = 1s`** | 🔴 **网络建连极慢** |
| ③ 上游处理 | `uht - uct = 50ms` | ✅ 服务没问题 |
| ④ 传响应体 | `urt - uht = 5ms` | ✅ |
| ①+⑤ Kong开销 | `rt - urt = 505ms` | ⚠️ 但主要是等上游关闭连接 |

**口诀：`uct` 单独飙高 → 网络建连问题**

```bash
# 排查
time nc -zv upstream-host 8080   # 测试纯 TCP 连接耗时
dig upstream-host                 # DNS 解析耗时
mtr upstream-host                 # 网络链路质量
```

#### 4b. 上游 → Kong 传 body 慢（带宽/网络抖动）

```
rt=3.100 uct=0.002 uht=0.060 urt=3.000
```

| 段 | 耗时 | 判断 |
|----|------|------|
| ② 网络建连 | `uct = 2ms` | ✅ 建连正常 |
| ③ 上游处理 | `uht - uct = 58ms` | ✅ 服务很快返回了首字节 |
| ④ 传响应体 | **`urt - uht = 2.94s`** | 🔴 **传 body 极慢** |
| ①+⑤ Kong开销 | `rt - urt = 100ms` | ✅ |

**口诀：`urt - uht` 飙高 → 上游到 Kong 的网络带宽/质量问题**

> **这是没有 urt 就看不出来的问题！** 只有 uht 时，你只知道「上游 60ms 就返回了首字节」，以为一切正常，但实际响应体传了 3 秒。

```bash
# 排查
iperf3 -c upstream-host           # 测到上游的带宽
ping -s 1400 upstream-host        # 大包测试，检查 MTU 问题
```

---

### 🔵 上游服务问题

```
rt=5.060 uct=0.003 uht=5.000 urt=5.010
```

| 段 | 耗时 | 判断 |
|----|------|------|
| ② 网络建连 | `uct = 3ms` | ✅ |
| ③ 上游处理 | **`uht - uct = 4.997s`** | 🔵 **服务处理 5 秒** |
| ④ 传响应体 | `urt - uht = 10ms` | ✅ 处理完后秒发 |
| ①+⑤ Kong开销 | `rt - urt = 50ms` | ✅ |

**口诀：`uht - uct` 飙高 → 上游服务慢**

```bash
# 绕过 Kong 直连验证
time curl http://upstream-host:8080/api/endpoint
# 如果直连也慢 → 确认是服务问题
```

**常见原因：**

| 原因 | uht-uct 表现 | 解决 |
|------|-------------|------|
| 慢 SQL / 数据库锁 | 特定接口持续高 | 加索引、优化查询、查锁等待 |
| GC 停顿 | 间歇性 spike（Java/Go） | 调整 GC 参数 |
| 下游依赖慢（微服务级联） | 部分接口高 | 追踪调用链（OpenTelemetry） |
| CPU 打满 | 全面变慢 | 扩容 / 限流 |
| 冷启动（Serverless） | 首次请求极慢 | 预热 / 保持实例活跃 |

---

### 🟡 Kong 自身问题

```
rt=3.060 uct=0.003 uht=0.050 urt=0.060
```

| 段 | 耗时 | 判断 |
|----|------|------|
| ② 网络建连 | `uct = 3ms` | ✅ |
| ③ 上游处理 | `uht - uct = 47ms` | ✅ |
| ④ 传响应体 | `urt - uht = 10ms` | ✅ |
| ①+⑤ Kong开销 | **`rt - urt = 3s`** | 🟡 **Kong 自己花了 3 秒** |

**口诀：`rt - urt` 飙高 → Kong 自身开销大**

**进一步区分 ① 前置和 ⑤ 后置：**

| 如果是 ① 前置慢 | 如果是 ⑤ 后置慢 |
|-----------------|-----------------|
| request-transformer 重写大 body | response-transformer 重写大 body |
| rate-limiting 数据库查询 | logging 插件写日志阻塞 |
| LDAP/外部认证调用慢 | 发给客户端的网络慢（客户端 → Kong） |

---

### 🔀 组合问题

```
rt=6.020 uct=1.000 uht=3.010 urt=5.010
```

| 段 | 耗时 | 判断 |
|----|------|------|
| ② 网络建连 | `uct = 1s` | 🔴 建连慢 |
| ③ 上游处理 | `uht - uct = 2.01s` | 🔵 服务也慢 |
| ④ 传响应体 | `urt - uht = 2s` | 🔴 传 body 也慢 |
| ①+⑤ Kong开销 | `rt - urt = 1.01s` | 🟡 Kong 也有开销 |

**全链路都有问题** → 逐层解决，优先解决最大的那个。

---

## 五、完整判断口诀

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   uct 高            → 🔴 网络建连问题                │
│                                                     │
│   uht - uct 高      → 🔵 上游服务处理慢              │
│                                                     │
│   urt - uht 高      → 🔴 网络(传body) / 上游流式输出  │
│                                                     │
│   rt - urt 高       → 🟡 Kong 自身开销               │
│                                                     │
│   uct = -1          → 请求没到上游（Kong直接拒绝）    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### `urt - uht` 高需要二次判断

`urt - uht` 高有两种可能：

| 情况 | 特征 | 归属 |
|------|------|------|
| 网络 | 小 body 也慢、或跟 body 大小不成比例 | 🔴 网络 |
| 上游流式输出 | 上游 SSE/分块传输、大 JSON 序列化慢 | 🔵 上游 |

```bash
# 判断方法：对比不同接口
# 如果所有接口 urt-uht 都高 → 网络问题
# 如果只有大响应接口高 → 上游生成/流式输出慢
# 查上游响应的 Transfer-Encoding: chunked → 流式输出
curl -v http://upstream-host:8080/api/endpoint 2>&1 | grep -i transfer-encoding
```

---

## 六、uct 高的常见原因

| 原因 | uct 表现 | 解决 |
|------|---------|------|
| DNS 解析慢 | 首次请求 uct 高，后续正常 | 配置 `dns_resolver`，启用 `dns_cache` |
| TCP 队列满 | 高并发时 uct 飙升 | 调大上游 `somaxconn`，检查 backlog |
| 跨区域/跨机房 | 所有请求 uct 都高 | 同机房部署，减少网络跳数 |
| SSL 握手慢 | HTTPS 上游 uct 比 HTTP 高 50ms+ | 启用 session reuse，检查证书链长度 |
| 连接池耗尽 | 突发时 uct 从 1ms 跳到 100ms+ | 调大 `upstream_keepalive` |
| **网络丢包** | **1s/3s/7s 整数秒跳变** | 见下方详细分析 |

### 网络丢包对 uct 的影响（重点）

TCP 建连过程：`SYN → SYN-ACK → ACK`（三次握手），只要其中任何一个包丢了，就要等重传。

```
正常： SYN ──→ SYN-ACK ──→ ACK     uct ≈ 2ms
                 2ms

丢 SYN：     SYN ──✗  (等1s重传) ──→ SYN ──→ SYN-ACK ──→ ACK
             uct ≈ 1002ms   (多了 1s 等待)

丢 SYN-ACK： SYN ──→ SYN-ACK ✗ (等1s) ──→ SYN-ACK ──→ ACK
             uct ≈ 1002ms
```

#### 特征：uct 出现整数秒跳变

| 丢包次数 | uct 增加 | 原因 |
|---------|---------|------|
| 丢 1 次 | +**1s** | TCP 首次重传超时 ≈ 1s（Linux 默认 `tcp_syn_retries` 的基础 RTO） |
| 连丢 2 次 | +**3s** | 第二次重传超时 ≈ 2s（指数退避 1s → 2s → 4s） |
| 连丢 3 次 | +**7s** | 1s + 2s + 4s |
| 连丢 5 次 | +**63s** | 1+2+4+8+16+32，之后返回 502 |

#### 在日志中的表现

```
# 正常请求
rt=0.055 uct=0.002 uht=0.050 urt=0.052

# 丢了一次 SYN
rt=1.055 uct=1.002 uht=1.050 urt=1.052
              ^^^^^ uct 从 2ms 跳到 1002ms，精确多了 1 秒

# 连丢了两次
rt=3.058 uct=3.003 uht=3.052 urt=3.055
              ^^^^^ 精确多了 3 秒
```

> **判断口诀：uct 出现 1s/3s/7s 这种整数秒跳变 → 几乎可以确定是丢包。**

#### 丢包 vs 其他原因的区别

| 原因 | uct 模式 | 特征 |
|------|---------|------|
| **丢包** | 1s / 3s / 7s 离散跳变 | 🎯 **整数秒**，随机分布 |
| DNS 慢 | 首次高，后续正常 | 周期性（跟 DNS TTL 一致） |
| TCP 队列满 | 高并发时持续高 | 跟 QPS 正相关 |
| 跨区域 | 所有请求都高 | 持续稳定（如 30ms） |
| 连接池耗尽 | 高峰期偶尔高 | 跟流量正相关 |

#### 丢包排查命令

```bash
# 1. 从 Kong 机器测到上游的丢包率
ping -c 100 upstream-host
# 看 packet loss 百分比

# 2. 用 mtr 看哪一跳丢包
mtr -r -c 100 upstream-host
# 找到丢包的具体网段/路由器

# 3. 查 TCP 重传统计
ss -ti | grep retrans
# 或
cat /proc/net/snmp | grep TcpExt | head -2

# 4. 查看当前 TCP 连接的重传次数
ss -ti state established '( dport = :8080 or sport = :8080 )'
# 输出中 retrans 字段表示重传次数
```

#### 丢包的常见原因与解决

| 丢包位置 | 原因 | 解决 |
|---------|------|------|
| Kong 主机网卡 | 网卡队列溢出、ring buffer 太小 | `ethtool -G eth0 rx 4096 tx 4096`，调大 ring buffer |
| 中间交换机 | 端口带宽跑满、缓冲区溢出 | 升级带宽、启用流量控制 |
| 上游主机 | `somaxconn` 太小、TCP backlog 满 | `sysctl -w net.core.somaxconn=65535` |
| 虚拟化层 | 虚机网络 I/O 竞争、SR-IOV 未启用 | 启用 SR-IOV 或 DPDK，减少虚拟化开销 |
| 容器网络 | veth pair 性能瓶颈、iptables 规则过多 | 优化 iptables 规则、考虑 eBPF/Cilium |

---

## 七、生产日志分析脚本

### 实时分析

```bash
tail -f /var/log/kong/access.log | awk '
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^rt=/)  rt=substr($i,4)+0
    if($i ~ /^uct=/) uct=substr($i,5)+0
    if($i ~ /^uht=/) uht=substr($i,5)+0
    if($i ~ /^urt=/) urt=substr($i,5)+0
    if($i ~ /^status=/) st=substr($i,8)
  }
  if(uct == -1) {
    printf "🚫 NO_UPSTREAM  rt=%.3f  status=%s\n", rt, st
    next
  }
  net_c = uct
  net_t = urt - uht
  app   = uht - uct
  kong  = rt - urt

  tag = "✅OK"
  if(net_c > 0.1)       tag = "🔴NET_CONNECT"
  else if(net_t > 0.5)  tag = "🔴NET_TRANSFER"
  else if(app > 1.0)    tag = "🔵APP_SLOW"
  else if(kong > 0.1)   tag = "🟡KONG"

  printf "%-18s connect=%.3f app=%.3f transfer=%.3f kong=%.3f total=%.3f status=%s\n",
    tag, net_c, app, net_t, kong, rt, st
}'
```

输出示例：

```
✅OK               connect=0.002 app=0.045 transfer=0.003 kong=0.008 total=0.058 status=200
🔵APP_SLOW         connect=0.003 app=2.500 transfer=0.010 kong=0.012 total=2.525 status=200
🔴NET_CONNECT      connect=0.800 app=0.050 transfer=0.005 kong=0.010 total=0.865 status=502
🔴NET_TRANSFER     connect=0.003 app=0.050 transfer=1.500 kong=0.010 total=1.563 status=200
🟡KONG             connect=0.003 app=0.050 transfer=0.005 kong=0.300 total=0.358 status=200
🚫 NO_UPSTREAM     rt=0.005  status=401
```

### 汇总统计（P50/P95/P99）

```bash
awk '
BEGIN { OFS="\t" }
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^rt=/)  { rt=substr($i,4)+0; rts[++n]=rt }
    if($i ~ /^uct=/) { uct=substr($i,5)+0; if(uct>=0) ucts[n]=uct }
    if($i ~ /^uht=/) { uht=substr($i,5)+0; if(uht>=0) uhts[n]=uht }
    if($i ~ /^urt=/) { urt=substr($i,5)+0; if(urt>=0) urts[n]=urt }
  }
}
END {
  asort(rts); asort(ucts); asort(uhts); asort(urts)
  n=length(rts); nu=length(ucts)
  printf "指标\t\t\tP50\tP95\tP99\tMax\n"
  printf "总耗时(rt)\t\t%.3f\t%.3f\t%.3f\t%.3f\n",
    rts[int(n*0.5)], rts[int(n*0.95)], rts[int(n*0.99)], rts[n]
  printf "网络建连(uct)\t\t%.3f\t%.3f\t%.3f\t%.3f\n",
    ucts[int(nu*0.5)], ucts[int(nu*0.95)], ucts[int(nu*0.99)], ucts[nu]
  split("",apps)
  for(i=1;i<=nu;i++) apps[i]=uhts[i]-ucts[i]
  asort(apps)
  printf "上游处理(uht-uct)\t%.3f\t%.3f\t%.3f\t%.3f\n",
    apps[int(nu*0.5)], apps[int(nu*0.95)], apps[int(nu*0.99)], apps[nu]
  split("",trans)
  for(i=1;i<=nu;i++) trans[i]=urts[i]-uhts[i]
  asort(trans)
  printf "传body(urt-uht)\t\t%.3f\t%.3f\t%.3f\t%.3f\n",
    trans[int(nu*0.5)], trans[int(nu*0.95)], trans[int(nu*0.99)], trans[nu]
  split("",kongs)
  for(i=1;i<=nu;i++) kongs[i]=rts[i]-urts[i]
  asort(kongs)
  printf "Kong开销(rt-urt)\t%.3f\t%.3f\t%.3f\t%.3f\n",
    kongs[int(nu*0.5)], kongs[int(nu*0.95)], kongs[int(nu*0.99)], kongs[nu]
}' /var/log/kong/access.log
```

输出示例：

```
指标                    P50     P95     P99     Max
总耗时(rt)              0.055   0.230   1.500   5.200
网络建连(uct)           0.002   0.005   0.010   0.500
上游处理(uht-uct)       0.040   0.200   1.400   4.800
传body(urt-uht)         0.003   0.010   0.050   1.200
Kong开销(rt-urt)        0.008   0.015   0.040   0.300
```

> 一眼看去：**网络正常、Kong 正常、瓶颈在上游服务（P99 = 1.4s）**。

---

## 八、状态码辅助判断

| 状态码 | upstream_status | uct 值 | 归属 | 说明 |
|--------|----------------|--------|------|------|
| 401/403 | `-` | `-1` | 🟡 Kong | 认证/鉴权插件拦截 |
| 404 | `-` | `-1` | 🟡 Kong | 路由不匹配 |
| 429 | `-` | `-1` | 🟡 Kong | 限流插件触发 |
| 502 | 502/`-` | 正常或 `-` | 🔵 上游 | 上游崩溃/连接被拒 |
| 502 | `-` | 高 | 🔴 网络 | 连接超时导致 |
| 503 | `-` | `-1` | 🔵 上游 | 无健康节点 |
| 503 | `-` | 高 | 🔴 网络 | DNS 解析失败 |
| 504 | 200 | 正常 | 🟡 Kong | Kong 后置处理超时 |
| 504 | `-` | 高 | 🔴 网络 | 连接上游超时 |
| 504 | 200 | 正常 | 🔵 上游 | 上游处理慢但未到 timeout |

---

## 九、实战排查案例

### 案例 1：某接口 P99 突然从 100ms 飙到 3s

**现象：** 凌晨 2:00 告警，`/api/orders` 接口 P99 延迟从 100ms 飙到 3s，但成功率仍是 99.8%。

**Step 1 — 看日志，定位慢在哪一层**

```bash
# 过滤该接口的最近 1000 条日志，取最慢的 5 条
grep '/api/orders' /var/log/kong/access.log | tail -1000 | awk '
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^rt=/)  rt=substr($i,4)+0
    if($i ~ /^uct=/) uct=substr($i,5)+0
    if($i ~ /^uht=/) uht=substr($i,5)+0
    if($i ~ /^urt=/) urt=substr($i,5)+0
  }
  if(rt > 1) printf "%.3f  uct=%.3f uht=%.3f urt=%.3f | net=%.3f app=%.3f body=%.3f kong=%.3f\n",
    rt, uct, uht, urt, uct, uht-uct, urt-uht, rt-urt
}' | sort -rn | head -5
```

输出：

```
3.210  uct=0.003 uht=3.150 urt=3.160 | net=0.003 app=3.147 body=0.010 kong=0.050
3.055  uct=0.003 uht=3.000 urt=3.010 | net=0.003 app=2.997 body=0.010 kong=0.045
2.880  uct=0.002 uht=2.830 urt=2.840 | net=0.002 app=2.828 body=0.010 kong=0.040
2.610  uct=0.003 uht=2.560 urt=2.570 | net=0.003 app=2.557 body=0.010 kong=0.040
2.402  uct=0.003 uht=2.350 urt=2.360 | net=0.003 app=2.347 body=0.010 kong=0.042
```

**Step 2 — 判断**

| 层 | 耗时 | 结论 |
|----|------|------|
| 网络(uct) | 3ms | ✅ 网络没问题 |
| 上游(app) | **3.15s** | 🔵 **上游服务处理极慢** |
| 传body | 10ms | ✅ 小响应体 |
| Kong | 50ms | ✅ Kong 没问题 |

**结论：瓶颈在上游服务 `app=3.147s`。**

**Step 3 — 绕过 Kong 直连验证**

```bash
time curl http://10.0.1.50:8080/api/orders?date=today
# 输出：real 0m3.120s  → 直连也慢，确认是服务问题
```

**Step 4 — 查上游服务日志**

```bash
# 查上游应用慢查询日志
grep '/api/orders' /var/log/order-service/slow.log | tail -5
# 发现：
# [SLOW] SELECT * FROM orders WHERE created_at > '2026-06-05' ... took 2.9s
# 原因：created_at 缺少索引 + 凌晨跑批写入导致锁表
```

**根因：** 数据库 `orders` 表凌晨跑批量写入任务，持有行锁，导致该查询排队等锁。

**解决：**

1. 给 `created_at` 加索引
2. 批量写入任务改用分段提交，缩短锁持有时间
3. 加读写分离，查询走从库

**验证：** 修复后 P99 恢复到 80ms。

---

### 案例 2：间歇性 502，但大部分请求正常

**现象：** 每天 10:00-12:00 高峰期，`/api/products` 接口偶尔返回 502，大概每 1000 次请求出现 2-3 次。其他时段完全正常。

**Step 1 — 提取 502 请求的日志**

```bash
grep 'status=502' /var/log/kong/access.log | grep '/api/products' | tail -20 | awk '
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^rt=/)  rt=substr($i,4)+0
    if($i ~ /^uct=/) uct=substr($i,5)+0
    if($i ~ /^uht=/) uht=substr($i,5)+0
    if($i ~ /^urt=/) urt=substr($i,5)+0
    if($i ~ /^upstream=/) ups=substr($i,10)
  }
  printf "rt=%.3f uct=%.3f uht=%.3f urt=%.3f upstream=%s\n", rt, uct, uht, urt, ups
}'
```

输出：

```
rt=0.052 uct=0.003 uht=0.003 urt=0.003 upstream=10.0.1.51:8080
rt=0.003 uct=0.001 uht=-     urt=-     upstream=10.0.1.52:8080
rt=0.048 uct=0.003 uht=0.003 urt=0.003 upstream=10.0.1.51:8080
rt=0.002 uct=0.001 uht=-     urt=-     upstream=10.0.1.52:8080
rt=0.055 uct=0.002 uht=0.003 urt=0.003 upstream=10.0.1.51:8080
rt=0.003 uct=0.001 uht=-     urt=-     upstream=10.0.1.52:8080
```

**Step 2 — 判断**

关键发现：**502 全部来自 `10.0.1.52` 这个 target**。

- `10.0.1.51` 的请求：uct=3ms, uht=3ms → 正常
- `10.0.1.52` 的请求：uct=1ms, uht=`-` → 连上了但上游立刻断开

| 层 | 耗时 | 结论 |
|----|------|------|
| 网络(uct) | 1ms | ✅ 能连上 |
| 上游(uht) | `-` (空) | 🔵 **上游立刻关闭连接** |
| 传body/ Kong | - | 不涉及 |

**结论：`10.0.1.52` 实例有问题，连接建立后立刻被关闭。**

**Step 3 — 查 52 实例日志**

```bash
ssh 10.0.1.52 'tail -100 /var/log/products-service/error.log'
# 发现：
# [ERROR] worker process exited with signal 11 (SIGSEGV)
# [ERROR] failed to allocate memory
# OOM killer 杀掉了 worker 进程
```

**根因：** 高峰期流量打满，`10.0.1.52` 内存不够，worker 被 OOM Killer 杀掉后重启。重启间隙 Kong 连上就断，产生 502。

**解决：**

1. 给 52 实例加内存
2. Kong Health Check 配置：active check 间隔从 5s 缩短到 2s，unhealthy 阈值从 3 降到 1，快速摘除故障节点
3. 加第三个实例做冗余

---

### 案例 3：所有接口 P95 普遍升高，但上游服务没问题

**现象：** 全站 P95 从 150ms 升到 800ms，所有接口都受影响。上游团队反馈服务指标一切正常。

**Step 1 — 全站 P95 分层统计**

```bash
# 取最近 10000 条日志做分层汇总
tail -10000 /var/log/kong/access.log | awk '
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^rt=/)  { rt=substr($i,4)+0; rts[++n]=rt }
    if($i ~ /^uct=/) { uct=substr($i,5)+0; if(uct>=0) ucts[n]=uct }
    if($i ~ /^uht=/) { uht=substr($i,5)+0; if(uht>=0) uhts[n]=uht }
    if($i ~ /^urt=/) { urt=substr($i,5)+0; if(urt>=0) urts[n]=urt }
  }
}
END {
  asort(rts); asort(ucts); asort(uhts); asort(urts)
  nu=length(ucts)
  printf "指标\t\t\tP50\tP95\tP99\n"
  printf "总耗时(rt)\t\t%.3f\t%.3f\t%.3f\n",
    rts[int(n*0.5)], rts[int(n*0.95)], rts[int(n*0.99)]
  printf "网络建连(uct)\t\t%.3f\t%.3f\t%.3f\n",
    ucts[int(nu*0.5)], ucts[int(nu*0.95)], ucts[int(nu*0.99)]
  split("",apps); for(i=1;i<=nu;i++) apps[i]=uhts[i]-ucts[i]; asort(apps)
  printf "上游处理(uht-uct)\t%.3f\t%.3f\t%.3f\n",
    apps[int(nu*0.5)], apps[int(nu*0.95)], apps[int(nu*0.99)]
  split("",trans); for(i=1;i<=nu;i++) trans[i]=urts[i]-uhts[i]; asort(trans)
  printf "传body(urt-uht)\t\t%.3f\t%.3f\t%.3f\n",
    trans[int(nu*0.5)], trans[int(nu*0.95)], trans[int(nu*0.99)]
  split("",kongs); for(i=1;i<=nu;i++) kongs[i]=rts[i]-urts[i]; asort(kongs)
  printf "Kong开销(rt-urt)\t%.3f\t%.3f\t%.3f\n",
    kongs[int(nu*0.5)], kongs[int(nu*0.95)], kongs[int(nu*0.99)]
}'
```

输出：

```
指标                    P50     P95     P99
总耗时(rt)              0.150   0.800   1.500
网络建连(uct)           0.002   0.010   0.050
上游处理(uht-uct)       0.040   0.060   0.100
传body(urt-uht)         0.003   0.010   0.030
Kong开销(rt-urt)        0.100   0.720   1.350
```

**Step 2 — 判断**

| 层 | P95 | 结论 |
|----|-----|------|
| 网络建连 | 10ms | ✅ |
| 上游处理 | 60ms | ✅ 上游确实没问题 |
| 传body | 10ms | ✅ |
| **Kong开销** | **720ms** | 🟡 **Kong 自身开销 P95 = 720ms！** |

**结论：瓶颈在 Kong 层，与上游无关。**

**Step 3 — 定位是 Kong 哪个环节**

Kong 开销 = 前置插件 + 后置插件 + 发响应给客户端。逐个排除：

```bash
# 1. 禁用 rate-limiting 插件测试
curl -X PATCH http://localhost:8001/plugins/{rate-limiting-id} -d enabled=false
# 观察 5 分钟 → P95 无变化 → 不是 rate-limiting

# 2. 禁用 ldap-auth 插件
curl -X PATCH http://localhost:8001/plugins/{ldap-auth-id} -d enabled=false
# 观察 5 分钟 → P95 降到 150ms！
```

**Step 4 — 查 ldap-auth 慢的原因**

```bash
# 从 Kong 机器测试 LDAP 服务器响应时间
time ldapsearch -x -H ldap://ldap.company.com -b "ou=users,dc=company,dc=com" "(uid=test)" -LLL
# 输出：real 0m0.650s → LDAP 服务器响应慢

# 为什么突然变慢？
ssh ldap.company.com 'top -bn1 | grep slapd'
# 发现 slapd 进程 CPU 95% → 有人在跑全量同步
```

**根因：** LDAP 服务器在跑全量同步，CPU 打满，每个认证请求都要 600ms+。Kong 的 `ldap-auth` 插件在每个请求的前置阶段都会查询 LDAP，导致所有接口变慢。

**解决：**

1. 短期：切换到备用 LDAP 服务器
2. 长期：启用 `ldap-auth-advanced` 插件的缓存功能（`config.cache_ttl=30`），避免每次请求都查 LDAP
3. 优化 LDAP 全量同步的时间窗口（移到凌晨低峰期）

---

### 案例 4：`urt - uht` 异常高，大文件下载慢

**现象：** `/api/reports/export` 接口返回 Excel 文件（约 5MB），用户反馈下载经常超时。P99 从 2s 升到 15s。

**Step 1 — 提取该接口日志**

```bash
grep '/api/reports/export' /var/log/kong/access.log | tail -100 | awk '
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^rt=/)  rt=substr($i,4)+0
    if($i ~ /^uct=/) uct=substr($i,5)+0
    if($i ~ /^uht=/) uht=substr($i,5)+0
    if($i ~ /^urt=/) urt=substr($i,5)+0
  }
  printf "rt=%.3f  net=%.3f  app=%.3f  body_transfer=%.3f  kong=%.3f\n",
    rt, uct, uht-uct, urt-uht, rt-urt
}' | sort -rn | head -5
```

输出：

```
rt=14.800  net=0.003  app=1.200  body_transfer=13.500  kong=0.100
rt=12.500  net=0.003  app=1.100  body_transfer=11.300  kong=0.100
rt=10.200  net=0.003  app=1.000  body_transfer=9.000   kong=0.200
rt=8.500   net=0.003  app=0.950  body_transfer=7.350   kong=0.200
rt=6.300   net=0.003  app=0.900  body_transfer=5.200   kong=0.200
```

**Step 2 — 判断**

| 层 | 耗时 | 结论 |
|----|------|------|
| 网络建连 | 3ms | ✅ |
| 上游处理 | ~1s | ⚠️ 生成报表本身有点慢，但不是主因 |
| **传body** | **13.5s** | 🔴 **5MB 响应体传了 13.5 秒！** |
| Kong | 100ms | ✅ |

**结论：瓶颈在 `urt - uht`，响应体传输极慢。** 5MB / 13.5s ≈ 370KB/s，远低于千兆网卡的理论速度。

**Step 3 — 判断是网络还是上游流式输出**

```bash
# 直连上游，看响应头
curl -v http://10.0.1.50:8080/api/reports/export 2>&1 | head -20
# 发现：Transfer-Encoding: chunked  → 上游在流式输出
# 上游服务日志：Generating report... streaming rows...
```

**这里是 `urt - uht` 需要二次判断的典型场景：**

| 可能性 | 验证方法 | 本案结果 |
|--------|---------|---------|
| 网络 | 从 Kong 机器 `iperf3` 测到上游带宽 | 带宽 900Mbps → 正常 |
| 上游流式输出 | 看上游是否边生成边吐（chunked） | **✅ 上游在逐行生成 Excel 并流式返回** |

**根因：** 上游服务生成报表时采用流式输出，边查数据库边写 Excel 行，每查一批数据写一批。`uht` 时间是上游开始返回第一行的时间，`urt` 是写完所有行的时间。所以 `urt - uht = 13.5s` 实际上是**上游生成报表的时间**，不是网络传输时间。

**但 Kong 的 `proxy_read_timeout` 默认 60s，不会超时。真正的问题是：用户等待时间 = 1.2s（首字节）+ 13.5s（生成）= 14.7s。**

**解决：**

1. 报表导出改为异步：先返回任务 ID，后台生成，生成完发通知下载
2. 缓存热门报表，避免重复生成
3. 如果必须同步：在 Kong 对该 Route 调大 `proxy_read_timeout`

---

### 案例 5：DNS 解析导致 uct 周期性飙升

**现象：** 每隔约 30 秒，所有接口的 uct 从 2ms 飙到 200ms，持续几秒后恢复。

**Step 1 — 观察 uct 的时间规律**

```bash
# 提取 uct > 0.05 的请求，看时间分布
awk '
{
  for(i=1;i<=NF;i++) {
    if($i ~ /^\[/) ts=$i
    if($i ~ /^uct=/) { uct=substr($i,5)+0; if(uct>0.05) print ts, $0 }
  }
}' /var/log/kong/access.log | head -20
```

输出：

```
[05/Jun/2026:10:00:30] ... uct=0.210 ...
[05/Jun/2026:10:00:31] ... uct=0.180 ...
[05/Jun/2026:10:00:32] ... uct=0.050 ...
[05/Jun/2026:10:01:00] ... uct=0.250 ...
[05/Jun/2026:10:01:01] ... uct=0.190 ...
[05/Jun/2026:10:01:30] ... uct=0.230 ...
```

**规律：每隔约 30 秒集中出现，持续 2-3 秒后恢复。**

**Step 2 — 排查 DNS**

```bash
# 测试 DNS 解析耗时
for i in $(seq 1 5); do
  time dig +short upstream-service.internal @10.0.0.53
done
# 输出：
# 0.050s  → 快（命中缓存）
# 0.050s
# 0.210s  → 慢（缓存过期，重新解析）
# 0.050s
# 0.050s
```

**Step 2 分析：**

| 层 | 耗时 | 结论 |
|----|------|------|
| 网络建连(uct) | 周期性 200ms | 🔴 DNS 缓存过期后重新解析耗时 200ms |
| 其余层 | 正常 | ✅ |

**根因：** 上游服务使用域名 `upstream-service.internal`，Kong 默认 DNS 缓存 TTL 较短。缓存过期后，Kong 需要重新解析，解析耗时 200ms，解析完成后恢复正常。

**解决：**

```ini
# kong.conf
dns_resolver = 10.0.0.53:53        # 指定专用 DNS
dns_order = LAST,A,CNAME            # 解析顺序
```

```bash
# 或通过 Kong Admin API 设置 Upstream 用 IP 直连
curl -X PATCH http://localhost:8001/upstreams/my-upstream/targets/{target-id} \
  -d "target=10.0.1.50:8080"   # 用 IP 替代域名
```

**验证：** 修改后 uct 稳定在 1-3ms，不再有周期性波动。

---

### 案例 6：连接池耗尽导致高峰期 uct 飙升

**现象：** 平时 uct 稳定在 2ms，但每天 10:00-11:00 流量高峰期 uct 飙到 100-500ms，非高峰期立刻恢复。

**Step 1 — 对比高峰 vs 非高峰**

```bash
# 高峰期（10:30）
awk '/uct=/{for(i=1;i<=NF;i++) if($i~/^uct=/) print substr($i,5)+0}' /var/log/kong/access.log | \
  awk '{sum+=$1; n++; if($1>0.1) slow++} END{printf "avg=%.3f max=%.3f slow_ratio=%.1f%%\n", sum/n, max, slow/n*100}'
# avg=0.085 max=0.520 slow_ratio=35.0%

# 非高峰（14:00）
# avg=0.003 max=0.010 slow_ratio=0.0%
```

**Step 2 — 判断**

uct 随 QPS 升高 → 典型的连接池耗尽特征。QPS 升高时，需要新建连接（TCP 三次握手），排队等可用连接。

```bash
# 查看 Kong 当前连接池配置
curl -s http://localhost:8001/upstreams/my-upstream | jq '.slots, .healthchecks'
# 确认 keepalive 连接池大小
grep upstream_keepalive /usr/local/kong/conf/kong.conf
# upstream_keepalive = 60    ← 默认值太小
```

**Step 3 — 计算所需连接池大小**

```
高峰 QPS = 5000/s
平均请求耗时 = 50ms (0.05s)
所需并发连接数 = QPS × 平均耗时 = 5000 × 0.05 = 250

当前连接池 = 60 → 严重不足
```

**解决：**

```ini
# kong.conf
upstream_keepalive = 300       # 调大连接池
upstream_keepalive_timeout = 60000  # 保持 60s
```

**验证：** 修改后高峰期 uct 稳定在 3-5ms，不再飙升。

---

## 十、排查流程总结

面对一个性能问题，按以下步骤操作：

```
Step 1：分层统计
    ↓
    用 awk 脚本跑 P50/P95/P99 分层统计
    ↓
Step 2：看哪一层最大
    ↓
    ├── uct 最大        → Step 3a：查网络
    │                     ├── nc -zv 测试 TCP 连接
    │                     ├── dig 测试 DNS
    │                     ├── mtr 查链路质量
    │                     └── 对比高峰/非高峰 → 连接池？
    │
    ├── uht-uct 最大    → Step 3b：查上游服务
    │                     ├── curl 直连验证
    │                     ├── 查服务慢查询/慢日志
    │                     ├── 查 CPU/内存/GC
    │                     └── 查下游依赖（调用链追踪）
    │
    ├── urt-uht 最大    → Step 3c：判断是网络还是流式输出
    │                     ├── iperf3 测带宽
    │                     ├── curl -v 看 Transfer-Encoding
    │                     └── 对比不同接口（全慢=网络，特定接口=流式）
    │
    └── rt-urt 最大     → Step 3d：查 Kong 插件
                          ├── 逐个禁用插件定位
                          ├── 检查外部调用（LDAP/Redis/DB）
                          └── 检查大 body 转换插件
```
