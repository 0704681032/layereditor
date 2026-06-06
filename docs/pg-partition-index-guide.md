# PostgreSQL 分区表在线建索引指南

> **适用场景：** 父表数据量大、按月分区，需要在不影响业务的情况下新增索引。下月分区尚未创建。

---

## 📋 速查卡

| 问题 | 答案 |
|:-----|:-----|
| 新分区会继承父表索引吗？ | ✅ 会，自动创建同名同构索引 |
| 父表能直接 `CONCURRENTLY` 建索引吗？ | PG 12+ 支持，但内部串行扫分区，不如手动并行快 |
| UNIQUE 约束有什么限制？ | 必须包含分区键列 |
| `CONCURRENTLY` 能放在事务里吗？ | ❌ 不能，每条必须独立执行 |

---

## 一、分区索引继承机制

### 核心规则

```
父表建索引 --> 所有已有分区自动创建对应索引
           --> 未来新建分区也会自动带上该索引
```

### 注意事项

| 特性 | 说明 |
|:-----|:-----|
| 自动继承 | 父表建索引 → 所有分区（含未来分区）自动创建 |
| 索引名自动生成 | 分区上的索引名由 PG 自动命名 |
| UNIQUE / PRIMARY KEY | 支持继承，但约束列**必须包含分区键** |
| CONCURRENTLY | 不能在事务中执行，必须逐条独立运行 |
| 级联删除 | 删除父表索引会级联删除所有分区索引 |

### UNIQUE 约束必须包含分区键

```sql
-- ❌ 错误：缺少分区键
CREATE UNIQUE INDEX idx_orders_id ON orders (id);
-- ERROR: unique constraint on partitioned table must include
--         all partitioning columns

-- ✅ 正确：包含分区键
CREATE UNIQUE INDEX idx_orders_id ON orders (id, created_at);
```

---

## 二、在线建索引三步法

> **核心思路：** 逐分区并发建索引（不锁表）→ 父表补空壳索引（秒级完成）→ 未来分区自动继承。

### Step 1：逐个分区并发建索引

对每个已有分区单独使用 `CONCURRENTLY`，**不阻塞读写**：

```sql
CREATE INDEX CONCURRENTLY idx_orders_status ON orders_2026_01 (status);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders_2026_02 (status);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders_2026_03 (status);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders_2026_04 (status);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders_2026_05 (status);
-- ... 逐月执行
```

**批量生成语句（省去手写）：**

```sql
SELECT format(
    'CREATE INDEX CONCURRENTLY idx_orders_status ON %I (status);',
    c.relname
)
FROM pg_inherits i
JOIN pg_class c ON c.oid = i.inhrelid
JOIN pg_class p ON p.oid = i.inhparent
WHERE p.relname = 'orders'
ORDER BY c.relname;
```

复制输出结果，逐条执行即可。

**提速技巧：** 可同时开 2-3 个 session 并行跑不同分区的建索引，互不干扰。

### Step 2：父表创建索引（瞬间完成）

等所有分区索引建好后，在父表上创建索引。PG 发现子分区已有同名索引会直接复用，**不重新扫表**：

```sql
-- 注意：不加 CONCURRENTLY
CREATE INDEX idx_orders_status ON orders (status);
```

> ⚠️ 这一步会加短暂锁，但因不需要扫数据，通常**几秒内完成**。建议在低峰期执行。

### Step 3：未来新分区自动继承

```sql
-- 创建下月分区，索引自动带上
CREATE TABLE orders_2026_07 PARTITION OF orders
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

PG 发现父表上有 `idx_orders_status`，自动在新分区上创建对应索引，**无需额外操作**。

---

## 三、流程图

```
Step 1：逐分区 CONCURRENTLY 建索引
  |
  |  不锁表，可并行跑 2-3 个分区
  |  每个分区独立，互不影响
  |
  v
Step 2：父表 CREATE INDEX
  |
  |  秒级完成（复用子分区已有索引）
  |  建议低峰期执行
  |
  v
Step 3：未来新分区
  |
  |  创建分区时索引自动继承
  |  无需额外操作
```

---

## 四、验证方法

### 验证所有分区是否都有索引

```sql
SELECT
    inhrelid::regclass AS partition,
    idx.indexname      AS index_name
FROM pg_inherits i
JOIN pg_indexes idx ON idx.tablename = inhrelid::regclass::text
WHERE i.inhparent = 'orders'::regclass
  AND idx.indexname LIKE '%status%'
ORDER BY inhrelid::regclass::text;
```

### 查看单个分区的索引详情

```sql
\d+ orders_2026_06
```

---

## 五、常见问题

### Q1：父表直接 `CREATE INDEX CONCURRENTLY` 行不行？

PG 12+ 支持，但内部仍然是**逐分区串行**扫描，不如手动开多 session 并行跑快。PG 11 及以下直接报错。

### Q2：Step 1 中各分区的索引名需要一致吗？

**不需要。** Step 2 创建父表索引时，PG 会根据索引定义自动匹配并复用子分区上的索引，不依赖索引名。

### Q3：建索引期间有 DML 会怎样？

`CONCURRENTLY` 不阻塞 INSERT/UPDATE/DELETE，但会占用一定 CPU 和 I/O。建议：

- 低峰期执行
- 同时只跑 2-3 个分区，避免 I/O 打满
- 监控数据库负载，必要时暂停

### Q4：建索引失败了怎么办？

`CONCURRENTLY` 失败会留下 `INVALID` 状态的索引，直接删除重建即可：

```sql
-- 查找无效索引
SELECT indexrelid::regclass, indrelid::regclass
FROM pg_index WHERE indisvalid = false;

-- 删除后重建
DROP INDEX idx_orders_status_2026_01;
CREATE INDEX CONCURRENTLY idx_orders_status ON orders_2026_01 (status);
```

### Q5：应该提前多久建下月分区？

建议**月底前**建好下月分区，避免月初业务高峰时创建分区出现问题。可以配合定时任务自动创建：

```sql
-- 每月 25 号自动创建下月分区（可用 pg_cron 扩展）
SELECT cron.schedule(
    'create-next-month-partition',
    '0 2 25 * *',
    $$
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS orders_%s PARTITION OF orders
         FOR VALUES FROM (%L) TO (%L)',
        to_char(date_trunc('month', current_date + interval '1 month'), 'YYYY_MM'),
        date_trunc('month', current_date + interval '1 month'),
        date_trunc('month', current_date + interval '2 month')
    )
    $$
);
```

---

## 六、最佳实践清单

| # | 实践 | 说明 |
|:-:|:-----|:-----|
| 1 | **逐分区 CONCURRENTLY** | 不锁表，业务无感知 |
| 2 | **并行 2-3 个分区** | 加速建索引，但不打满 I/O |
| 3 | **低峰期执行** | 减少对业务的潜在影响 |
| 4 | **最后补父表索引** | 秒级完成，让未来分区自动继承 |
| 5 | **提前建下月分区** | 月底前创建，避免月初出问题 |
| 6 | **验证后再收工** | 查 `pg_indexes` 确认所有分区索引就位 |
| 7 | **清理失败索引** | `CONCURRENTLY` 失败会留 INVALID 索引，及时清理 |

---

> 📌 **一句话总结：** 逐分区 `CONCURRENTLY` → 父表补索引 → 未来分区自动继承。三步走，业务零中断。
