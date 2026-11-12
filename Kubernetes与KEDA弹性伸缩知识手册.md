# Kubernetes 与 KEDA 弹性伸缩知识手册

> 面向运维/前端开发的 K8s 快速入门，重点结合工作负载伸缩、HPA、ScaledObject、GPU 配额等实际场景。
> 所有命令均可用 kubectl 直接执行，Windows 下注意引号差异（见文末附录）。

---

## 目录

1. [K8s 是什么：声明式与控制循环](#1-k8s-是什么声明式与控制循环)
2. [集群架构：控制面与工作节点](#2-集群架构控制面与工作节点)
3. [核心资源对象全景](#3-核心资源对象全景)
4. [必须理解的三个机制：OwnerReference / Finalizer / GC](#4-必须理解的三个机制ownerreference--finalizer--gc)
5. [CRD、CR 与 Operator 模式](#5-crdcr-与-operator-模式)
6. [弹性伸缩体系：HPA → VPA → KEDA](#6-弹性伸缩体系hpa--vpa--keda)
7. [ScaledObject 完整控制链路（重点）](#7-scaledobject-完整控制链路重点)
8. [资源配额与 LimitRange](#8-资源配额与-limitrange)
9. [kubectl 常用命令大全](#9-kubectl-常用命令大全)
10. [实战排查案例集](#10-实战排查案例集)
11. [附录：输出技巧与 Windows 注意事项](#11-附录输出技巧与-windows-注意事项)

---

## 1. K8s 是什么：声明式与控制循环

### 1.1 声明式 vs 命令式

| 方式 | 含义 | 例子 |
|---|---|---|
| 命令式 | 告诉系统"做什么动作" | `kubectl scale deploy x --replicas=4`（把副本改成4） |
| 声明式 | 告诉系统"我期望的状态是什么" | 提交一个 YAML：`replicas: 4`，系统自己想办法达成 |

K8s 的所有 API 都是**声明式**的：你把期望状态（Spec）写入 etcd，控制器持续对比"期望状态"和"实际状态"，发现差异就执行动作消除差异——这个过程叫 **reconcile（调谐）**，这个循环叫**控制循环（control loop）**。

### 1.2 关键推论（排查问题时反复用到）

- **API 调用成功 ≠ 动作已完成**。`kubectl delete` 返回成功只代表对象被打上了删除标记，真正删除要等控制器处理完。
- **谁持有控制权，谁说了算**。手动改的副本数，如果和 HPA/Operator 的期望冲突，会被下一轮 reconcile 覆盖。
- **一切皆对象**，存放在 etcd 中，通过 API Server 统一读写（RESTful 风格）。

### 1.3 对象的通用结构

每个 K8s 对象都由四部分组成：

```yaml
apiVersion: apps/v1          # 资源组/版本
kind: Deployment             # 资源类型
metadata:                    # 元数据：名字、namespace、标签、注解
  name: order-service
  namespace: prod
  labels:
    app: order
  annotations: {}
  ownerReferences: []        # 归属关系（见第4节）
  finalizers: []             # 删除前置钩子（见第4节）
spec:                        # 期望状态（用户填）
  replicas: 3
status: {}                   # 实际状态（控制器回填，只读）
```

---

## 2. 集群架构：控制面与工作节点

```
┌─────────────────────── 控制面（Control Plane）───────────────────────┐
│                                                                      │
│  kube-apiserver        唯一入口，所有读写都经过它（REST API、鉴权）     │
│  etcd                  分布式 KV 存储，集群的唯一数据源（存所有对象）   │
│  scheduler             调度器：决定新 Pod 放到哪个节点                 │
│  kube-controller-manager 内置一堆控制器（Deployment/HPA/节点/副本…）   │
│  cloud-controller-manager  云厂商对接（可选）                         │
│                                                                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ watch / 下发
┌──────────────────────────────────┴───────────────────────────────────┐
│  工作节点 Node（可以有很多个）                                         │
│                                                                      │
│  kubelet       节点管家：接收 Pod 定义、拉起/销毁容器、上报状态         │
│  kube-proxy    Service 流量转发（iptables/ipvs）                       │
│  容器运行时     containerd / CRI-O（跑容器的引擎）                     │
│                                                                      │
│  业务 Pod：[containerd] → container(container) → container            │
└──────────────────────────────────────────────────────────────────────┘
```

要点：

- **apiserver 是唯一直接操作 etcd 的组件**，其他组件全部通过 apiserver 的 **watch 机制**订阅对象变化（长连接 + 事件推送），这就是控制器能"实时响应"的原理。
- 控制器和 apiserver 通常以 Pod 形式跑在控制面节点（kube-system 命名空间），业务应用不需要、也不应该自己实现控制逻辑。

---

## 3. 核心资源对象全景

### 3.1 工作负载类（决定容器怎么跑）

| 对象 | 作用 | 副本管理 | 典型场景 |
|---|---|---|---|
| **Pod** | 最小调度单位，1~N 个容器的集合，共享网络/存储 | 无（裸 Pod 挂了没人管） | 一般不直接创建 |
| **ReplicaSet** | 保证指定数量的 Pod 永远在线 | 有 | 由 Deployment 管理，很少直接用 |
| **Deployment** | 管理 ReplicaSet，提供滚动升级、回滚、扩缩容 | 有 | 无状态服务（绝大多数后端） |
| **StatefulSet** | 提供稳定网络标识、稳定存储、有序启停 | 有 | 有状态服务（MySQL、Kafka、ES） |
| **DaemonSet** | 每个节点（或选定节点）跑一个 Pod | 按节点数 | 日志采集、监控 Agent、网络插件 |
| **Job / CronJob** | 跑完即退的任务 / 定时任务 | — | 数据批处理、定时备份 |

Deployment 的嵌套关系（排查副本问题必懂）：

```
Deployment (replicas: 3)
   └─ ReplicaSet (每次滚动升级生成一个新的，旧的保留用于回滚)
        └─ Pod × 3
```

### 3.2 网络与配置类

| 对象 | 作用 |
|---|---|
| **Service** | 给一组 Pod 提供稳定的虚拟 IP 和 DNS 名，做负载均衡（Pod IP 会变，Service 不变） |
| **Ingress** | 七层路由（HTTP 域名/路径 → Service），相当于集群入口网关规则 |
| **ConfigMap** | 非敏感配置（配置文件、环境变量） |
| **Secret** | 敏感配置（密码、证书、token），值是 base64 编码（注意：是编码不是加密） |
| **Namespace** | 虚拟集群隔离边界，配额、权限、网络策略大多按 ns 划分 |

Service 的三种常用类型：

- `ClusterIP`（默认）：集群内部访问
- `NodePort`：在每个节点开一个端口对外暴露
- `LoadBalancer`：对接云厂商负载均衡器

### 3.3 存储类

| 对象 | 作用 |
|---|---|
| **PV (PersistentVolume)** | 集群里的一块存储资源（管理员创建或动态供给） |
| **PVC (PersistentVolumeClaim)** | 用户对存储的申请（要多大、什么访问模式） |
| **StorageClass** | 动态建盘的模板，PVC 引用它即可自动创建 PV |

### 3.4 安全类

- **ServiceAccount**：Pod 的身份（Pod 里的进程调 K8s API 时用）
- **RBAC**：Role / ClusterRole（权限集合）+ RoleBinding / ClusterRoleBinding（绑定给用户/SA）
- **NetworkPolicy**：Pod 间防火墙规则

### 3.5 Labels 与 Annotations 的区别

- **Label**：可索引、可被 selector 筛选，用于"关联"（Service 找 Pod、Deployment 找 Pod 全靠它）
- **Annotation**：纯备注元数据，不参与筛选，用于存配置说明、版本信息、第三方组件的附加配置

---

## 4. 必须理解的三个机制：OwnerReference / Finalizer / GC

这三个机制是理解"为什么删 ScaledObject 会连带删 HPA""为什么删除会卡住"的钥匙。

### 4.1 OwnerReference（属主引用）与垃圾回收（GC）

每个对象的 `metadata.ownerReferences` 可以指向它的"属主"。规则：

- **属主被删除 → 从属对象被 K8s 垃圾回收器自动级联删除**（默认 `Foreground/Background` 级联策略）。
- 例：Deployment → ReplicaSet → Pod 是一条属主链；**Keda 中 ScaledObject → HPA 也是属主链**。

```bash
# 查一个对象的属主
kubectl get hpa <name> -n <ns> -o jsonpath='{.metadata.ownerReferences}'
```

### 4.2 Finalizer（终结器）

Finalizer 是一串字符串，存在 `metadata.finalizers` 里。**只要 finalizer 数组非空，delete 操作就不会真正删除对象**，而是：

1. 给对象打上 `metadata.deletionTimestamp`（进入 Terminating 状态）
2. 等待对应控制器完成清理工作后，把自己负责的 finalizer 字符串移除
3. 数组清空后，对象才被 apiserver 真正删除

**这就是"删除接口返回成功但对象还在"的根本原因。** 如果负责的控制器（如 keda-operator）挂了，对象会永远卡在 Terminating。

排障命令：

```bash
# 看是否卡在 Terminating
kubectl get scaledobject <name> -n <ns> \
  -o jsonpath='{.metadata.deletionTimestamp}{"\n"}{.metadata.finalizers}'

# 应急强制移除 finalizer（确认控制器已不可恢复时才用，绕过清理逻辑！）
kubectl patch scaledobject <name> -n <ns> --type=merge \
  -p '{"metadata":{"finalizers":[]}}'
```

### 4.3 三种删除传播策略

| 策略 | 行为 |
|---|---|
| Background（默认常见） | 属主立即消失，GC 异步在后台删从属 |
| Foreground | 属主先进入 Terminating，等所有从属删完才真正删除 |
| Orphan | 只删属主，从属保留（变成孤儿对象） |

---

## 5. CRD、CR 与 Operator 模式

### 5.1 概念

- **CRD（CustomResourceDefinition）**：自定义资源的"类型定义"，告诉 K8s 新增一种对象。例如 Keda 安装时注册了 `scaledobjects.keda.sh` 这个 CRD。
- **CR（Custom Resource）**：按 CRD 创建出来的具体对象，例如一个名叫 `order-service` 的 ScaledObject。**CR 本身只是 etcd 里的一段数据，不产生任何动作**。
- **Operator**：一个常驻 Pod 形式的控制器，watch 特定 CR 的变化，执行 reconcile 把期望变成现实。

```
CRD = 表结构定义      CR = 表里的一行数据      Operator = 盯着这张表干活的程序
```

### 5.2 通用排查命令

```bash
# 集群里装了哪些 CRD
kubectl get crd | grep keda

# 查某类 CR 的所有实例（短名不行就用全限定名  <复数>.<组>）
kubectl get scaledobjects.keda.sh -n <ns>

# 查 CRD 支持的版本和字段定义
kubectl get crd scaledobjects.keda.sh -o yaml
```

---

## 6. 弹性伸缩体系：HPA → VPA → KEDA

### 6.1 三种原生伸缩能力

| 机制 | 调什么 | 触发方式 | 备注 |
|---|---|---|---|
| **HPA** (Horizontal Pod Autoscaler) | 副本数（横向） | CPU/内存/自定义/外部指标 | 最常用，本项目使用 |
| **VPA** (Vertical Pod Autoscaler) | 单 Pod 的 CPU/内存 request（纵向） | 资源使用趋势 | 会重建 Pod，与 HPA 通常不混用 |
| **CA** (Cluster Autoscaler) | 节点数 | Pod 因资源不足 Pending 时扩节点 | 集群层面，运维负责 |

### 6.2 HPA 的工作原理

HPA 本身也是一个对象 + kube-controller-manager 里的 HPA 控制器，默认每 **15 秒** reconcile 一次：

```
期望副本数 = ceil(当前副本数 × 当前指标值 / 目标指标值)
多指标时取所有指标算出结果的最大值
最终结果被 clamp 到 [minReplicas, maxReplicas] 区间
```

**核心约束（手动伸缩被"拉回"的原因）**：

```
实际副本数永远被限制在 minReplicas ~ maxReplicas 之间
手动 scale 到区间外的值，下一轮 reconcile（≤15s）就会被改回去
```

HPA 对象示例：

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: keda-hpa-order-service     # Keda 生成的 HPA 通常带 keda-hpa- 前缀
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 3
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 6.3 原生 HPA 的局限与 KEDA 的价值

原生 HPA 只认 Metrics API 里的指标，做不了"定时伸缩""按 Kafka 积压消息数伸缩"。**KEDA（Kubernetes Event-driven Autoscaling）** 在 HPA 之上加了一层 Operator：

- 用户写 **ScaledObject**（声明触发器：CPU/Prometheus/Cron/Kafka/Redis…）
- keda-operator 负责拉指标、算副本数，并**自动创建和托管一个 HPA**
- 真正的扩缩动作仍由 K8s 原生 HPA 控制器执行

Keda 还支持把副本缩到 **0**（原生 HPA 一般 min=1），这对定时任务类负载很有价值。

---

## 7. ScaledObject 完整控制链路（重点）

### 7.1 全链路图

```
① 发布系统（app-manager）按交付配置渲染出 ScaledObject，写入 apiserver
                                  │
                                  ▼
② ScaledObject CR 存入 etcd（只是配置，无动作）
                                  │ watch
                                  ▼
③ keda-operator（常驻 Deployment，通常在 keda 命名空间）
   ├─ 校验配置（admission webhook 配合）
   ├─ 按触发器拉取指标 / 计算 cron 时间段副本数
   └─ 创建/更新 HPA（ownerReference 指向 ScaledObject）
                                  │
                                  ▼
④ HPA 对象（keda-hpa-<工作负载名>）
                                  │ watch
                                  ▼
⑤ kube-controller-manager 的 HPA 控制器
   └─ 修改目标工作负载的 scale 子资源（spec.replicas）
                                  │
                                  ▼
⑥ Deployment/StatefulSet 控制器 → ReplicaSet → kubelet 拉起/删除 Pod
```

配套组件（安装 Keda 时一起部署，全集群共用一套）：

| 组件 | 职责 |
|---|---|
| keda-operator | 核心控制器，watch ScaledObject、管理 HPA、算指标 |
| keda-admission-webhooks | 准入校验（如多个 ScaledObject 不能指向同一工作负载） |
| keda-metrics-apiserver | 把 Keda 的外部指标注册成 K8s 指标 API，供 HPA 消费 |

### 7.2 ScaledObject 示例（含字段解读）

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: order-service            # 通常与工作负载同名
  namespace: prod
spec:
  scaleTargetRef:
    name: order-service          # 目标工作负载
    kind: Deployment
  minReplicaCount: 2             # 对应表单的"最小副本数"
  maxReplicaCount: 3             # 对应表单的"最大副本数"，手动伸缩超此值会被拉回
  pollingInterval: 30            # 每隔多少秒查一次指标
  cooldownPeriod: 300            # 缩容冷却时间（秒）
  triggers:
  - type: cpu                    # 触发器类型：cpu/memory/cron/prometheus/...
    metadata:
      type: Utilization
      value: "70"
```

### 7.3 删除 ScaledObject 时发生了什么（结合本项目）

```
DELETE customResource/ScaledObject/<name>
   │
   ├─ 1. apiserver 给对象打 deletionTimestamp（接口此刻即可返回成功）
   ├─ 2. keda-operator 监听到，执行 finalizer：
   │       ├─ 删除名下 HPA（HPA 消失后，工作负载副本数停在当前值，不再被夹逼）
   │       └─ 移除 finalizer
   └─ 3. 对象真正从 etcd 消失
```

注意两个异步窗口：

1. **删除窗口**：接口成功 ≠ 对象已消失（finalizer 处理需要时间，operator 异常时永久卡住）。
2. **HPA 残留窗口**：HPA 未消失前，手动伸缩仍可能被拉回。

### 7.4 验证 Keda 是否健康

```bash
# 三个控制组件是否都在 Running
kubectl get deploy -n keda

# CRD 是否注册
kubectl get crd scaledobjects.keda.sh

# operator 日志（删除卡住、HPA 不生成时看这里）
kubectl logs -n keda deploy/keda-operator --tail=200
```

---

## 8. 资源配额与 LimitRange

### 8.1 三件套的区别

| 对象 | 作用层级 | 管什么 |
|---|---|---|
| **ResourceQuota** | 命名空间总额度 | 整个 ns 的 CPU/内存/GPU/对象数量上限 |
| **LimitRange** | 命名空间内单个 Pod/容器 | 默认/最大/最小的 request、limit |
| **平台 GPU 配额（本项目）** | 应用/资源池维度 | 应用可使用的 GPU 卡数或显存，发布/扩容时后端校验 |

### 8.2 requests 与 limits

```yaml
resources:
  requests:        # 调度依据：节点至少剩这么多资源才放得下这个 Pod
    cpu: "500m"    # 500m = 0.5 核
    memory: "512Mi"
  limits:          # 运行时上限：超限后 CPU 被限流，内存 OOM 会被杀
    cpu: "1"
    memory: "1Gi"
```

### 8.3 本项目 GPU 配额校验规则

```
允许扩容 ⇔ 应用已配置 GPU 配额 ≥ 单副本卡数 × 目标副本数
例外：原始副本数 = 0 且配置了 gpu 分时复用策略（允许平时不占配额、定时扩容）
```

GPU 资源名形如 `nvidia.com/gpu`，是整数型 extended resource，**不可超卖**（request 必须等于 limit）。

```bash
# 看节点有多少 GPU、已分配多少
kubectl describe node <node> | grep -A5 Allocated

# 看 ns 配额
kubectl get resourcequota -n <ns>
kubectl describe resourcequota <name> -n <ns>
```

---

## 9. kubectl 常用命令大全

### 9.1 上下文与集群信息

```bash
kubectl config get-contexts                          # 所有可切换的集群上下文
kubectl config current-context                       # 当前上下文
kubectl config use-context <ctx>                     # 切换集群
kubectl cluster-info                                 # 集群入口信息
kubectl get nodes -o wide                            # 节点列表及详情
```

### 9.2 通用查询（get / describe / yaml）

```bash
kubectl get <资源类型> [-n <ns>]                     # 列表
kubectl get <资源类型> <名字> -n <ns> -o wide         # 带更多列
kubectl get <资源类型> <名字> -n <ns> -o yaml         # 完整 YAML（排查第一神器）
kubectl get <资源类型> <名字> -n <ns> -o json         # 完整 JSON
kubectl describe <资源类型> <名字> -n <ns>            # 聚合详情 + 事件（排查第二神器）
kubectl get all -n <ns>                              # 该 ns 下主要工作负载一览
kubectl api-resources                                # 集群支持的所有资源类型（含 CRD、是否带 ns）
```

常用缩写：`po`=pod, `deploy`=deployment, `sts`=statefulset, `ds`=daemonset,
`svc`=service, `ing`=ingress, `cm`=configmap, `secret`=secret, `ns`=namespace,
`hpa`=horizontalpodautoscaler, `rs`=replicaset, `no`=node, `pv`/`pvc`。

### 9.3 日志与进容器

```bash
kubectl logs <pod> -n <ns>                           # 查日志
kubectl logs <pod> -n <ns> -c <容器名>                # 多容器 Pod 指定容器
kubectl logs -f <pod> -n <ns>                        # 实时跟踪（类似 tail -f）
kubectl logs <pod> --previous                        # 上一个（已崩溃）容器的日志，查崩溃原因必备
kubectl exec -it <pod> -n <ns> -- /bin/sh            # 进容器交互终端
kubectl exec <pod> -- ls /data                       # 非交互执行单条命令
```

### 9.4 创建、更新、删除

```bash
kubectl apply -f xxx.yaml                            # 声明式创建/更新（最推荐，可重复执行）
kubectl apply -f dir/                                # 应用整个目录
kubectl create deploy nginx --image=nginx:1.25       # 命令式快速创建
kubectl edit <类型> <名字> -n <ns>                    # 直接调编辑器改在线对象（临时救火用）
kubectl delete -f xxx.yaml                           # 按文件删
kubectl delete <类型> <名字> -n <ns>                  # 按名字删
kubectl delete <类型> <名字> -n <ns> --cascade=orphan # 删除但保留从属对象
kubectl delete pod <pod> -n <ns> --grace-period=0 --force   # 强制删 Pod（最后手段）
```

### 9.5 扩缩容与升级回滚

```bash
kubectl scale deploy <name> --replicas=4 -n <ns>     # 手动改副本数
kubectl rollout status deploy/<name> -n <ns>         # 观察滚动升级进度
kubectl rollout history deploy/<name> -n <ns>        # 升级历史版本号
kubectl rollout undo deploy/<name> -n <ns>           # 回滚到上一版
kubectl rollout undo deploy/<name> --to-revision=3   # 回滚到指定版本
kubectl rollout restart deploy/<name> -n <ns>        # 滚动重启（不改镜像也会重建所有 Pod）
```

### 9.6 局部修改：patch

```bash
# JSON Merge 方式（覆盖字段）
kubectl patch scaledobject <name> -n <ns> --type=merge \
  -p '{"metadata":{"finalizers":[]}}'

# JSON Patch 方式（精确操作数组元素）
kubectl patch deploy <name> -n <ns> --type='json' \
  -p='[{"op":"replace","path":"/spec/replicas","value":5}]'
```

### 9.7 事件与监控

```bash
kubectl get events -n <ns> --sort-by=.lastTimestamp          # 按时间看事件
kubectl get events -n <ns> --field-selector reason=Scheduled # 按原因过滤
kubectl top nodes                                            # 节点资源使用（需 metrics-server）
kubectl top pods -n <ns>                                     # Pod 资源使用
kubectl get hpa -n <ns>                                      # HPA 状态（当前/目标指标、副本数）
```

### 9.8 字段抽取：jsonpath 与 custom-columns

```bash
# 只取创建时间和代数（判断对象是否被重建过）
kubectl get scaledobject <name> -n <ns> \
  -o jsonpath='{.metadata.creationTimestamp}{"\n"}{.metadata.generation}'

# 自定义列表列（Windows PowerShell 下推荐，免处理引号换行）
kubectl get scaledobject <name> -n <ns> \
  -o custom-columns=NAME:.metadata.name,CREATED:.metadata.creationTimestamp,GEN:.metadata.generation

# 看 HPA 的副本边界
kubectl get hpa <name> -n <ns> \
  -o custom-columns=MIN:.spec.minReplicas,MAX:.spec.maxReplicas,CUR:.status.currentReplicas
```

### 9.9 实时观察（watch）

```bash
kubectl get pods -n <ns> -w                           # Pod 变化实时刷屏
kubectl get deploy <name> -n <ns> -w                  # 观察手动伸缩后副本数是否被 HPA 拉回
```

### 9.10 调试排障三板斧

```bash
# 1. Pod 为什么 Pending/起不来？（事件里有调度失败、镜像拉取、探针失败原因）
kubectl describe pod <pod> -n <ns>

# 2. 容器为什么崩溃/重启？
kubectl logs <pod> -n <ns> --previous

# 3. 网络通不通？起一个临时调试 Pod
kubectl run debug --rm -it --image=busybox:1.36 --restart=Never -- sh
```

常见 Pod 状态速查：

| 状态/现象 | 典型原因 |
|---|---|
| Pending | 资源不足/调度约束不满足（GPU 配额、节点选择器、亲和性） |
| ImagePullBackOff | 镜像名错/镜像仓库凭证缺失 |
| CrashLoopBackOff | 容器启动后反复崩溃，看 `--previous` 日志 |
| OOMKilled | 内存超过 limit，调大 memory limit |
| Evicted | 节点资源压力（磁盘/内存）导致 Pod 被驱逐 |
| Terminating 卡住 | finalizer 未被控制器移除 |

---

## 10. 实战排查案例集

以下均来自实际项目场景。

### 案例 1：手动伸缩填 4，但 HPA 限制 max=3，副本数被拉回

**机理**：HPA 控制器每 15s reconcile，`clamp(4, min=2, max=3)=3`。

```bash
kubectl get hpa -n <ns>                     # 找到 keda-hpa-xxx
kubectl get deploy <name> -n <ns> -w        # 现场观察 4 → 3 的回拉过程
```

**解法**：
- 临时：先删 ScaledObject（HPA 级联消失）再伸缩；或把 maxReplicas 调到 ≥4。
- 长期：修改 HPA 表单的最大副本数并重新发布。

### 案例 2：删了 ScaledObject，副本数还是改不了

按链路逐环排查：

```bash
# 环①：SO 真删了吗？卡 Terminating？
kubectl get scaledobject -n <ns>
kubectl get scaledobject <name> -n <ns> \
  -o jsonpath='{.metadata.deletionTimestamp}{"\n"}{.metadata.finalizers}'

# 环②：HPA 是否成了孤儿还在工作？
kubectl get hpa -n <ns>
# 若 HPA 残留：kubectl delete hpa <hpa-name> -n <ns>

# 环③：keda-operator 是否健康？
kubectl get pod -n keda
kubectl logs -n keda deploy/keda-operator --tail=100
```

同时检查前端 Network：删除后是否真的发出了第二个 `deployment/scale` 请求（旧版本代码删除成功后不链式调用伸缩接口）。

### 案例 3：判断 ScaledObject 是"旧对象没删掉"还是"发布重建的新对象"

```bash
kubectl get scaledobject <name> -n <ns> \
  -o custom-columns=NAME:.metadata.name,CREATED:.metadata.creationTimestamp,GEN:.metadata.generation
```

- 时间戳是很久以前 → 删除从未成功，旧对象一直在。
- 时间戳是刚才发布时刻、generation=1 → 发布按平台存储的交付配置**原样重建**（删集群 CR 不会清理平台侧配置）。
- 时间戳新且 generation>1 → 重建后又被原地改过 spec。

### 案例 4：GPU 配额报错

> 应用未配置于目标工作负载数匹配的 GPU 配额，仅原始副本为 0 且存在分时策略时允许扩容

```
校验公式：GPU 配额 ≥ 单副本卡数 × 目标副本数
```

- 常规解：配额中心申请足够卡数 → 组件 GPU 调度面板绑定配额（型号必须一致）→ 重新发布。
- 定时负载解：基础副本设 0 + HPA 面板选「gpu 分时复用」配置时间段。

### 案例 5：发布创建 ScaledObject 撞 409 Conflict

同名对象处于 Terminating 时新建会冲突。说明删除尚未完成就发起了发布：

```bash
kubectl get scaledobject <name> -n <ns>   # 确认 deletionTimestamp 存在
# 等其消失后再发布；长期不消失则排查 keda-operator 或按 4.2 应急清 finalizer
```

### 案例 6：谁在改我的副本数？

```bash
# managedFields 记录每个字段最后是哪个管理器写的
kubectl get deploy <name> -n <ns> -o yaml --show-managed-fields

# 事件里能看到 Scaled 记录及发起组件
kubectl describe deploy <name> -n <ns> | grep -A10 Events
```

---

## 11. 附录：输出技巧与 Windows 注意事项

### 11.1 输出格式选择

| 参数 | 适用场景 |
|---|---|
| `-o wide` | 列表多看几列（IP、节点、镜像） |
| `-o yaml` | 排查问题、导出对象完整定义 |
| `-o json` + jq | 脚本化处理 |
| `-o jsonpath` | 精确取字段（Linux/Mac/Git Bash 友好） |
| `-o custom-columns` | 自制表格，PowerShell 友好 |
| `--no-headers` | 配合 shell 文本处理 |

### 11.2 Windows 引号问题

Git Bash / CMD：单引号 jsonpath 可直接用。
**PowerShell** 中单引号模板里的花括号有时被吞，优先用 custom-columns，或双引号转义：

```powershell
# 推荐
kubectl get scaledobject order-service -n prod -o custom-columns=CREATED:.metadata.creationTimestamp,GEN:.metadata.generation

# 或者用双引号包 jsonpath
kubectl get scaledobject order-service -n prod -o jsonpath="{.metadata.creationTimestamp}"
```

### 11.3 学习路径建议

1. 先吃透第 1、3 节（声明式 + 工作负载对象），能解释 Deployment→RS→Pod 的关系。
2. 再学第 4 节三个机制，删除类问题 80% 与此有关。
3. 结合本项目伸缩流程理解第 6、7 节，动手用 9.8 的命令观察真实 ScaledObject/HPA。
4. 排查时固定套路：`get -o yaml` 看现状 → `describe` 看事件 → `logs` 看控制器 → `get -w` 看动态变化。

### 11.4 官方资料

- 官方文档（中文）：https://kubernetes.io/zh-cn/docs/home/
- KEDA 文档：https://kedacore.github.io/keda/
- API 参考：`kubectl explain <类型>.<字段>`，例如 `kubectl explain scaledobject.spec`
