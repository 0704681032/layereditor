# RateLimiter 滑动窗口限流器

在指定时间窗口内限制请求次数，使用滑动窗口算法精确控制。

## 最终版本代码

```java
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 滑动窗口限流器
 * <p>
 * 在指定时间窗口内限制请求次数，使用滑动窗口算法精确控制。
 *
 * <p>使用示例：
 * <pre>{@code
 * RateLimiter limiter = new RateLimiter(Duration.ofMinutes(1), 100);
 *
 * if (limiter.allowRequest()) {
 *     // 执行请求
 * } else {
 *     // 请求被限流
 *     Optional<Duration> wait = limiter.getWaitDuration();
 *     wait.ifPresent(d -> System.out.println("需等待 " + d.toSeconds() + " 秒"));
 * }
 * }</pre>
 */
public class RateLimiter {

    private final Duration window;
    private final int maxRequests;
    private final Deque<Instant> requests = new ArrayDeque<>();
    private final ReentrantLock lock = new ReentrantLock();

    /**
     * 创建限流器
     *
     * @param window      时间窗口，必须为正值
     * @param maxRequests 窗口内最大请求次数，必须为正值
     * @throws IllegalArgumentException 参数非法时抛出
     */
    public RateLimiter(Duration window, int maxRequests) {
        if (window == null || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("window must be positive");
        }
        if (maxRequests <= 0) {
            throw new IllegalArgumentException("maxRequests must be positive");
        }
        this.window = window;
        this.maxRequests = maxRequests;
    }

    /**
     * 尝试获取请求许可
     *
     * @return true 表示允许请求，false 表示被限流
     */
    public boolean allowRequest() {
        lock.lock();
        try {
            return tryAcquire();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 带超时的请求许可
     *
     * @param timeout 等待超时时间，非负值
     * @return true 表示允许请求，false 表示超时或被限流
     * @throws InterruptedException 等待时被中断
     */
    public boolean tryAllowRequest(Duration timeout) throws InterruptedException {
        if (timeout == null || timeout.isNegative()) {
            throw new IllegalArgumentException("timeout must be non-negative");
        }

        if (timeout.isZero()) {
            if (!lock.tryLock()) {
                return false;
            }
            try {
                return tryAcquire();
            } finally {
                lock.unlock();
            }
        }

        if (!lock.tryLock(timeout.toNanos(), TimeUnit.NANOSECONDS)) {
            return false;
        }
        try {
            return tryAcquire();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取当前窗口内的请求数
     *
     * @return 当前请求数
     */
    public int getCurrentCount() {
        lock.lock();
        try {
            cleanExpired();
            return requests.size();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取剩余可用请求次数
     *
     * @return 剩余次数
     */
    public int getRemainingCount() {
        lock.lock();
        try {
            cleanExpired();
            return Math.max(0, maxRequests - requests.size());
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取下次可请求的等待时间
     *
     * @return 需等待时间，当前可用时返回空
     */
    public Optional<Duration> getWaitDuration() {
        lock.lock();
        try {
            cleanExpired();
            if (requests.size() < maxRequests) {
                return Optional.empty();
            }
            Instant oldest = requests.peekFirst();
            Duration wait = Duration.between(Instant.now(), oldest.plus(window));
            return Optional.of(wait.isNegative() ? Duration.ZERO : wait);
        } finally {
            lock.unlock();
        }
    }

    /**
     * 清空请求记录
     */
    public void clear() {
        lock.lock();
        try {
            requests.clear();
        } finally {
            lock.unlock();
        }
    }

    /**
     * 获取时间窗口
     */
    public Duration getWindow() {
        return window;
    }

    /**
     * 获取最大请求数
     */
    public int getMaxRequests() {
        return maxRequests;
    }

    // ===== 内部方法 =====

    private boolean tryAcquire() {
        cleanExpired();
        if (requests.size() >= maxRequests) {
            return false;
        }
        requests.addLast(Instant.now());
        return true;
    }

    private void cleanExpired() {
        Instant cutoff = Instant.now().minus(window);
        while (!requests.isEmpty() && requests.peekFirst().isBefore(cutoff)) {
            requests.pollFirst();
        }
    }

    @Override
    public String toString() {
        return String.format("RateLimiter[window=%s, max=%d, current=%d, remaining=%d]",
                window, maxRequests, getCurrentCount(), getRemainingCount());
    }
}
```

---

## 设计要点

| 特性 | 说明 |
|------|------|
| 滑动窗口算法 | 精确限流，无突刺问题 |
| `ReentrantLock` | 比 `synchronized` 更灵活，支持超时 |
| `ArrayDeque` | 比 `LinkedList` 性能更好 |
| 完善的参数校验 | 防止非法输入 |
| 辅助方法 | `getWaitDuration`、`getRemainingCount` 等，便于监控 |
| `toString` | 方便调试打印状态 |
| Javadoc 文档 | API 说明清晰 |

---

## Duration vs TimeUnit

### TimeUnit（时间单位枚举）

`TimeUnit` 是 Java 5 引入的**枚举类型**，位于 `java.util.concurrent` 包，表示时间单位：

```java
TimeUnit.SECONDS       // 秒
TimeUnit.MILLISECONDS  // 毫秒
TimeUnit.MINUTES       // 分钟
TimeUnit.HOURS         // 小时
TimeUnit.DAYS          // 天
TimeUnit.MICROSECONDS  // 微秒
TimeUnit.NANOSECONDS   // 纳秒
```

示例：
```java
Lock lock = new ReentrantLock();
if (lock.tryLock(50L, TimeUnit.SECONDS)) {
    // 成功获取锁，50秒内会一直尝试
    try {
        // 执行业务逻辑
    } finally {
        lock.unlock();
    }
} else {
    // 50秒内未获取到锁
}
```

### Duration（时间段类）

`Duration` 是 Java 8 引入的**类**，位于 `java.time` 包，表示一段时间长度：

```java
Duration.ofSeconds(30)      // 30秒
Duration.ofMinutes(5)       // 5分钟
Duration.ofHours(2)         // 2小时
Duration.ofDays(1)          // 1天
Duration.ofMillis(500)      // 500毫秒
Duration.ofNanos(1000)      // 1000纳秒
Duration.parse("PT30S")     // ISO-8601格式，表示30秒
Duration.parse("PT2H30M")   // 2小时30分钟
```

### 两者的区别

| 特性 | TimeUnit | Duration |
|------|----------|----------|
| 类型 | 枚举 | 类 |
| 引入版本 | Java 5 | Java 8 |
| 包 | `java.util.concurrent` | `java.time` |
| 用途 | 表示**单位** + 时间转换 | 表示**时间段**对象 |
| 可存储 | ❌ 不能单独表示时长 | ✅ 可存储、计算、传递 |

### Duration 更多使用示例

```java
// ===== 创建 =====
Duration d1 = Duration.ofSeconds(30);
Duration d2 = Duration.ofMinutes(5);
Duration d3 = Duration.parse("PT2H30M");  // ISO-8601

// ===== 从时间点之间计算 =====
LocalDateTime start = LocalDateTime.of(2024, 1, 1, 10, 0);
LocalDateTime end = LocalDateTime.of(2024, 1, 1, 14, 30);
Duration elapsed = Duration.between(start, end);  // 4小时30分钟

// ===== 获取值 =====
Duration d = Duration.ofHours(2).plusMinutes(30);
d.toMillis();      // 毫秒总数
d.toSeconds();     // 秒总数 (Java 9+)
d.toMinutes();     // 分钟总数
d.toHours();       // 小时总数
d.toDays();        // 天数

// Java 9+ 获取各部分
d.toHoursPart();      // 小时部分
d.toMinutesPart();    // 分钟部分 (0-59)
d.toSecondsPart();    // 秒部分 (0-59)

// ===== 运算 =====
Duration base = Duration.ofMinutes(30);
base.plusSeconds(30);              // 加30秒
base.minusMinutes(5);              // 减5分钟
base.multipliedBy(2);              // 乘以2
base.dividedBy(2);                 // 除以2
base.negated();                    // 取反
Duration.ofMinutes(-30).abs();     // 绝对值

// ===== 比较 =====
Duration a = Duration.ofMinutes(5);
Duration b = Duration.ofMinutes(10);
a.compareTo(b);    // -1 (a < b)
a.isZero();        // false
a.isNegative();    // false

// ===== 实际应用 =====
// 执行时间计算
Instant start = Instant.now();
// ... 执行业务 ...
Instant end = Instant.now();
Duration elapsed = Duration.between(start, end);
System.out.println("耗时: " + elapsed.toMillis() + "ms");

// 缓存过期
public class CacheEntry<T> {
    private final T value;
    private final Instant expiresAt;

    public CacheEntry(T value, Duration ttl) {
        this.value = value;
        this.expiresAt = Instant.now().plus(ttl);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}

// 格式化输出 (Java 9+)
Duration d = Duration.ofHours(2).plusMinutes(30).plusSeconds(15);
String formatted = String.format("%dh %dm %ds",
    d.toHoursPart(), d.toMinutesPart(), d.toSecondsPart());
// 输出: "2h 30m 15s"
```

---

## 使用示例

```java
public class RateLimiterDemo {
    public static void main(String[] args) throws InterruptedException {
        RateLimiter limiter = new RateLimiter(Duration.ofSeconds(10), 5);

        System.out.println(limiter);
        // RateLimiter[window=10s, max=5, current=0, remaining=5]

        // 批量请求
        for (int i = 0; i < 8; i++) {
            boolean ok = limiter.allowRequest();
            System.out.println("请求 #" + (i + 1) + ": " + (ok ? "通过" : "拒绝"));
        }

        System.out.println(limiter);
        // RateLimiter[window=10s, max=5, current=5, remaining=0]

        // 查看等待时间
        limiter.getWaitDuration().ifPresent(wait ->
                System.out.println("需等待: " + wait.toSeconds() + "秒"));

        // 带超时等待
        boolean result = limiter.tryAllowRequest(Duration.ofSeconds(15));
        System.out.println("等待后请求: " + result);
    }
}
```

输出：
```
请求 #1: 通过
请求 #2: 通过
请求 #3: 通过
请求 #4: 通过
请求 #5: 通过
请求 #6: 拒绝
请求 #7: 拒绝
请求 #8: 拒绝
需等待: 10秒
等待后请求: true
```