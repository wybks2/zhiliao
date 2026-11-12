# Docker 快速上手指南

> 面向已了解 K8s 基础概念（或正在学）的开发者，目标：理解核心概念 + 掌握 90% 日常命令。
> 配套阅读同目录《Kubernetes与KEDA弹性伸缩知识手册》：Docker 解决"怎么打包运行单个应用"，K8s 解决"怎么管理一堆容器组成的集群"。

---

## 目录

1. [Docker 是什么](#1-docker-是什么)
2. [核心概念与生命周期](#2-核心概念与生命周期)
3. [安装与最小验证](#3-安装与最小验证)
4. [镜像操作命令](#4-镜像操作命令)
5. [容器操作命令（高频）](#5-容器操作命令高频)
6. [Dockerfile 详解与实战示例](#6-dockerfile-详解与实战示例)
7. [镜像构建与多阶段构建](#7-镜像构建与多阶段构建)
8. [数据持久化：Volume 与 Bind Mount](#8-数据持久化volume-与-bind-mount)
9. [容器网络](#9-容器网络)
10. [Docker Compose 多容器编排](#10-docker-compose-多容器编排)
11. [私有仓库与推送拉取](#11-私有仓库与推送拉取)
12. [清理磁盘与常用排障](#12-清理磁盘与常用排障)
13. [命令速查表](#13-命令速查表)
14. [Docker 与 K8s 的概念对照](#14-docker-与-k8s-的概念对照)

---

## 1. Docker 是什么

Docker 是一个**容器化平台**，把应用和它的依赖（运行时、库、配置）一起打包成一个**镜像（Image）**，镜像在任何装了 Docker 的机器上运行出来的容器行为完全一致——解决"我本地能跑，你那里不行"。

### 1.1 容器 vs 虚拟机

| 对比项 | 虚拟机 (VM) | 容器 (Container) |
|---|---|---|
| 隔离级别 | 硬件级，每个 VM 有完整客户机 OS | 进程级，共享宿主机内核 |
| 启动速度 | 分钟级 | 秒级（本质就是一个进程） |
| 体积 | GB 级 | MB 级 |
| 性能损耗 | 有 Hypervisor 开销 | 接近原生 |
| 代表技术 | VMware、KVM | Docker、containerd |

一句话：**容器是被 namespace（隔离视图）和 cgroup（限制资源）约束的普通进程**，不是轻量虚拟机。

### 1.2 底层三件套（了解即可）

- **namespace**：让容器只能看到自己的进程、网络、文件系统（PID/Net/Mount/UTS/IPC/User namespace）
- **cgroup**：限制容器最多用多少 CPU、内存
- **UnionFS（联合文件系统）**：镜像分层存储的基础，下面讲

---

## 2. 核心概念与生命周期

```
Dockerfile ──build──▶ Image（镜像，只读模板，存在仓库/本地）
                          │
                        run（实例化，可 run 出多个）
                          ▼
                      Container（容器，可读写的运行实例）
                          │
                    commit（可选，把容器改动存成新镜像，一般不用，应改 Dockerfile）
```

| 概念 | 类比 K8s | 说明 |
|---|---|---|
| **Image 镜像** | Pod 里的 `image:` | 只读模板，分层结构，用「仓库名/镜像名:标签」定位，如 `nginx:1.25` |
| **Container 容器** | Pod 中的容器 | 镜像的运行实例，一个镜像可同时跑 N 个容器 |
| **Registry 仓库** | — | 存镜像的服务，默认 Docker Hub，企业内一般用 Harbor |
| **Dockerfile** | — | 构建镜像的脚本（声明式，一条条指令叠层） |
| **Volume** | PV/PVC | 容器删了数据还在的持久化存储 |
| **Network** | Service/网络策略 | 容器间互通的虚拟网络 |
| **Docker Compose** | 简化版 Deployment 集合 | 一个 YAML 定义并启动多个容器（本机开发用） |

### 2.1 镜像的分层结构（重要）

镜像不是一个大文件，而是**多层只读层（layer）**叠起来的，Dockerfile 里每条指令基本产生一层：

```
┌─────────────────────────┐
│ 可读写层（容器运行时才有） │  ← 容器内的改动写在这里，容器删掉就没了
├─────────────────────────┤
│ Layer: COPY 应用代码      │
├─────────────────────────┤
│ Layer: RUN 安装依赖       │
├─────────────────────────┤
│ Layer: 基础镜像 node:18   │  ← 多镜像可共享同一基础层，拉取/存储都省空间
└─────────────────────────┘
```

推论：

- 已构建过的层会被**缓存**，改 Dockerfile 时只重建变化层及其后的层——所以常把"先装依赖、后拷代码"写在前面以利用缓存。
- 容器里的修改不影响镜像；同镜像起的容器互相隔离。

### 2.2 容器状态流转

```
        docker run                docker stop           docker start
   不存在 ────────▶ 运行中(running) ───────▶ 已停止(exited) ───────▶ running
                     │                         │
              docker exec（进去操作）     docker rm（删除，运行中的要 -f）
                     │
              docker kill（直接 SIGKILL，非正常退出）
```

---

## 3. 安装与最小验证

Windows 安装 **Docker Desktop**（需 WSL2 后端），安装后开 PowerShell 或 Git Bash：

```bash
docker version              # 客户端+服务端版本，能显示 Server 段说明守护进程正常
docker info                 # 引擎详情：存储驱动、容器/镜像数量、资源限制
docker run hello-world      # 官方最小验证镜像，跑通即环境 OK
```

Windows 两个实用设置（Docker Desktop → Settings）：

- **Resources → WSL Integration**：确认你的 WSL 发行版已开启集成
- **Docker Engine → registry-mirrors**：配国内镜像加速，否则拉 Docker Hub 很慢

---

## 4. 镜像操作命令

```bash
# 拉取镜像（不写 tag 默认 :latest，生产环境永远显式指定版本号！）
docker pull nginx:1.25

# 查看本地镜像
docker images                       # 等价 docker image ls
docker images | grep nginx          # 过滤

# 查看镜像构建历史（每层对应 Dockerfile 的一条指令，排查镜像大小用）
docker history nginx:1.25

# 查看镜像详细信息（环境变量、入口、层摘要）
docker inspect nginx:1.25
docker inspect nginx:1.25 --format '{{.Config.Env}}'    # 只取某字段

# 打标签（常用于推私有仓库前改名）
docker tag nginx:1.25 harbor.myhexin.com/library/nginx:1.25

# 删除镜像（有容器引用时删不掉，先删容器）
docker rmi nginx:1.25               # 等价 docker image rm
docker rmi $(docker images -q)      # 危险：删全部镜像

# 登录/登出仓库
docker login harbor.myhexin.com
docker logout harbor.myhexin.com

# 推送（镜像名必须带仓库地址前缀）
docker push harbor.myhexin.com/library/nginx:1.25

# 导入导出（离线环境传镜像）
docker save -o nginx.tar nginx:1.25          # 导出为 tar
docker load -i nginx.tar                     # 导入
```

镜像名完整格式：

```
harbor.myhexin.com / library / nginx : 1.25
└── 仓库地址 ──────┘ └ 项目/命名空间 ┘ └镜像名┘ └tag┘
```

---

## 5. 容器操作命令（高频）

### 5.1 启动容器：docker run

`docker run` = 先查本地有没有镜像（没有自动 pull）→ 创建容器 → 启动。最常用的参数组合：

```bash
docker run -d \
  --name my-nginx \
  -p 8080:80 \
  -e TZ=Asia/Shanghai \
  -v /d/data/nginx:/usr/share/nginx/html \
  --restart=unless-stopped \
  nginx:1.25
```

| 参数 | 含义 |
|---|---|
| `-d` | 后台运行（detached），不加则前台运行、日志直接打印在终端 |
| `--name` | 容器名，不填会随机生成一个 |
| `-p 宿主端口:容器端口` | 端口映射，浏览器访问宿主机 8080 → 容器 80 |
| `-e KEY=VAL` | 环境变量，可重复多个 |
| `-v 宿主路径:容器路径` | 挂载数据/配置（bind mount） |
| `--restart=策略` | 开机/异常退出后的重启策略：`no`(默认) / `always` / `unless-stopped` / `on-failure` |
| `-it` | 交互式 + 分配 TTY，进 shell 时必加（如跑 busybox） |
| `--rm` | 容器停止后自动删除，临时调试用 |
| `--memory=512m --cpus=1` | 资源限制（对应 K8s 的 limits） |
| `--network=xxx` | 加入指定网络 |
| `-w /app` | 工作目录 |
| `-u 1000:1000` | 指定运行用户（安全实践，不用 root 跑应用） |

典型调试用法：

```bash
# 起一个临时容器进去玩，退出即自动删除
docker run --rm -it busybox:1.36 sh

# 覆盖镜像默认入口命令
docker run --rm -it nginx:1.25 bash
```

### 5.2 查看与进入

```bash
docker ps                           # 查看运行中的容器
docker ps -a                        # 含已停止的（排查"容器为什么没了"先看这个）
docker ps -q                        # 只输出容器 ID，给别的命令喂参数

docker logs <容器名/ID>              # 查日志
docker logs -f --tail=200 <容器>    # 跟踪 + 最后200行（最常用组合）
docker logs --since=30m <容器>      # 最近30分钟

docker inspect <容器>               # 完整元数据：挂载、网络、环境变量、重启次数…
docker inspect -f '{{.State.Status}} | {{.State.ExitCode}}' <容器>   # 状态+退出码

docker exec -it <容器> bash         # 进运行中的容器（没有 bash 就试 sh）
docker exec <容器> ls /app          # 非交互执行单条命令

docker stats                        # 实时资源占用（类似 docker 版 top）
docker top <容器>                   # 看容器内进程
```

### 5.3 停止、启动、删除

```bash
docker stop <容器>                  # 发 SIGTERM，等10秒(默认)没退再 SIGKILL，优雅停止
docker kill <容器>                  # 直接 SIGKILL，等同 kill -9
docker start <容器>                 # 启动已停止的容器（保留原有参数和可读写层）
docker restart <容器>               # = stop + start

docker rm <容器>                    # 只能删已停止容器
docker rm -f <容器>                 # 强制删运行中的
docker container prune             # 清掉所有已停止容器
```

**注意**：`docker stop` 的 10 秒宽限期对优雅下线很重要——应用要在收到 SIGTERM 后处理完存量请求再退出，这和 K8s Pod 终止时的 preStop + terminationGracePeriodSeconds 是同一类问题。

---

## 6. Dockerfile 详解与实战示例

### 6.1 高频指令

| 指令 | 作用 |
|---|---|
| `FROM` | 基础镜像，一切从这里开始；多阶段构建可出现多次 |
| `WORKDIR` | 设工作目录（相当于 cd，不存在会自动建），后续指令都基于它 |
| `COPY` | 把构建上下文的文件拷进镜像（推荐，只做拷贝） |
| `ADD` | 类似 COPY，但自带解压 tar、支持 URL（行为隐晦，除解压场景外都用 COPY） |
| `RUN` | 构建时执行命令，产生一层（装依赖用） |
| `ENV` | 环境变量，构建期和运行期都生效 |
| `ARG` | 构建参数，仅构建期生效（build 时 `--build-arg` 传入） |
| `EXPOSE` | 声明端口，**只是文档性质**，真正暴露还要 `run -p` |
| `CMD` | 容器默认启动命令，可被 `docker run` 后的参数覆盖，一个文件只生效最后一条 |
| `ENTRYPOINT` | 固定入口，不会被 run 参数覆盖（参数会追加给它），适合做可执行镜像 |
| `VOLUME` | 声明匿名卷 |
| `USER` | 切换运行用户（不要用 root 跑应用） |

**CMD 与 ENTRYPOINT 的区别（面试常问）**：

```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
CMD ["--spring.profiles.active=prod"]
# 最终执行：java -jar app.jar --spring.profiles.active=prod
# docker run 镜像 test  → CMD 被替换成 test：java -jar app.jar test
```

注意都用 **exec 形式（JSON 数组）**，shell 形式 `CMD java -jar app.jar` 会包一层 `/bin/sh -c`，导致信号（SIGTERM）传不到应用进程，容器优雅停止会失效。

### 6.2 实战：前端 Node 项目 Dockerfile

```dockerfile
# ---------- 阶段1：构建 ----------
FROM node:18-alpine AS builder
WORKDIR /app

# 先拷依赖清单再安装：只要 package.json 没变，这层走缓存，构建飞快
COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com

# 再拷源码构建（代码天天改，放在依赖层之后）
COPY . .
RUN npm run build

# ---------- 阶段2：运行（最终镜像不含 node 构建环境，体积小、攻击面小）----------
FROM nginx:1.25-alpine
# 把构建产物从 builder 阶段拷过来
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# 优雅停止相关：nginx 官方镜像已处理 SIGQUIT
CMD ["nginx", "-g", "daemon off;"]
```

### 6.3 .dockerignore（必备）

构建时 Docker 会把**整个上下文目录**发给守护进程，不排除会把 node_modules、.git 一起打包，又慢又可能污染镜像。在 Dockerfile 同目录建 `.dockerignore`：

```
node_modules
dist
.git
*.log
.env.local
Dockerfile
README.md
```

---

## 7. 镜像构建与多阶段构建

```bash
# 基本构建：-t 打名字和标签，末尾的 . 是构建上下文路径
docker build -t my-app:1.0.0 .

# 传构建参数
docker build --build-arg HTTP_PROXY=http://proxy:8080 -t my-app:1.0.0 .

# 指定 Dockerfile 文件名/位置
docker build -f docker/Dockerfile.prod -t my-app:1.0.0 .

# 不用缓存强制全量重建（怀疑缓存脏了时用）
docker build --no-cache -t my-app:1.0.0 .

# 平台构建（Mac M 芯片上构建给 Linux x86 服务器用的镜像，非常容易踩的坑）
docker buildx build --platform linux/amd64 -t my-app:1.0.0 --load .
```

**多阶段构建（multi-stage）要点**：

- 一个 Dockerfile 多个 `FROM ... AS 名字`，最终镜像只保留最后一个阶段的内容
- 中间阶段的编译器、依赖全部丢弃 → 最终镜像可从 1GB+ 降到几十 MB
- `COPY --from=builder` 跨阶段取产物，这是最常用的手法
- Go 项目同理：`golang:1.22` 阶段编译出二进制 → `FROM alpine` 里只放二进制

镜像瘦身排查：`docker history <镜像>` 看哪层最大；能选 alpine/slim/distroless 基础镜像就别用完整版。

---

## 8. 数据持久化：Volume 与 Bind Mount

容器的可读写层随容器删除而消失，要保留数据有两种挂载：

| 方式 | 写法 | 数据位置 | 适用场景 |
|---|---|---|---|
| **Bind Mount** | `-v D:/data:/var/lib/mysql` | 你指定的宿主机目录 | 开发时挂源码、挂配置，改文件实时生效 |
| **Volume（推荐生产）** | `-v mydata:/var/lib/mysql` | Docker 管理的目录（`docker volume inspect` 可查） | 数据库数据、备份，跨平台路径一致、性能好 |
| **tmpfs** | `--tmpfs /tmp` | 宿主机内存 | 敏感临时数据，容器停即消失 |

```bash
# Volume 管理
docker volume create mydata
docker volume ls
docker volume inspect mydata
docker volume rm mydata
docker volume prune                       # 清无主 volume（数据库下线后常忘，占盘大户）

# 容器中使用（同名 volume 可被多个容器共享）
docker run -d --name db -v mydata:/var/lib/mysql mysql:8.0

# Bind Mount：Windows 路径示例（Git Bash 下 //d 或 /d 开头；PowerShell 用 D:\ 或 D:/）
docker run -d -v /d/data/nginx/conf:/etc/nginx/conf.d nginx:1.25

# 只读挂载（挂配置时建议加 :ro，防止容器误改宿主文件）
docker run -d -v /d/data/conf:/etc/nginx/conf.d:ro nginx:1.25
```

权限提示：Windows/Mac 上 Docker Desktop 的挂载经过虚拟化文件共享，**数据库类高 IO 场景优先用 named volume**，bind mount 性能明显差。

---

## 9. 容器网络

### 9.1 默认网络模式

| 模式 | 说明 |
|---|---|
| `bridge`（默认） | 每个容器接入 docker0 虚拟网桥，获得内网 IP，靠 `-p` 对外发布 |
| `host` | 直接用宿主机网络栈，无网络隔离、无需 -p（Linux 支持，Desktop 上有限模拟） |
| `none` | 只有 lo 回环，完全隔离 |
| 自定义 bridge | **推荐**，容器间可以用「容器名」当域名互访，还能互相 DNS 解析 |

### 9.2 自定义网络（Compose 会自动帮你做）

```bash
docker network create app-net
docker network ls
docker network inspect app-net

# 两个容器加入同一网络后，可以直接用容器名通信
docker run -d --name redis --network app-net redis:7
docker run --rm -it --network app-net busybox:1.36 sh
# 容器内执行：ping redis  → 能解析、能通
```

同网络内容器互访走「容器名:容器端口」，**不需要也不应该**写 `-p` 映射；`-p` 只用于宿主机/外部访问。这和 K8s 里"集群内走 Service 名、对外才暴露"的思想一致。

---

## 10. Docker Compose 多容器编排

单机开发/测试环境定义一组容器的标准方式，一个 `docker-compose.yml` 搞定：

```yaml
services:
  web:
    build: .                          # 用当前目录 Dockerfile 构建
    image: my-app:1.0.0               # 构建后的镜像名
    ports:
      - "8080:80"
    environment:
      - TZ=Asia/Shanghai
      - REDIS_HOST=redis              # 同 compose 内容器名直接解析
    depends_on:
      - redis
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

常用命令（在 compose 文件所在目录执行）：

```bash
docker compose up -d                 # 构建+后台启动全部服务（最常用）
docker compose ps                    # 本组容器状态
docker compose logs -f web           # 看某个服务日志
docker compose exec web sh           # 进容器
docker compose restart web           # 重启单个服务
docker compose down                  # 停止并删除容器、网络（volume 保留）
docker compose down -v               # 连 volume 一起删（彻底清空，谨慎）
docker compose build --no-cache web  # 强制重建某个服务镜像
docker compose pull                  # 拉 compose 里所有镜像的最新版
```

要点：

- Compose 自动创建一个专属 bridge 网络，服务名即 DNS 名。
- `depends_on` 只保证**启动顺序**，不保证对端应用已就绪（如 MySQL 还要几秒初始化），应用侧要有重试逻辑。
- Compose 管的是**单机**；跨机器编排、自愈、滚动发布这些是 K8s 的领域。

---

## 11. 私有仓库与推送拉取

完整发布流程（你们项目里推 Harbor 就是这套）：

```bash
# 1. 登录
docker login harbor.myhexin.com

# 2. 构建镜像
docker build -t my-app:1.0.0 .

# 3. 打成仓库要求的全名（仓库地址/项目名/镜像名:tag）
docker tag my-app:1.0.0 harbor.myhexin.com/devops/my-app:1.0.0

# 4. 推送
docker push harbor.myhexin.com/devops/my-app:1.0.0

# 5. 其他机器拉取
docker pull harbor.myhexin.com/devops/my-app:1.0.0
```

常见问题：

- **http: server gave HTTP response to HTTPS client**：私有仓库是 http 的，需要在 Docker daemon 配置 `insecure-registries`。
- **pull 401/403**：先 login，或确认账号对该 Harbor 项目有权限。
- **tag 规范**：不要依赖 `latest`（语义模糊、缓存坑多），用版本号或代码 commit 短 hash，如 `my-app:1.4.2`、`my-app:abc1234`。

---

## 12. 清理磁盘与常用排障

### 12.1 磁盘清理（Docker 用久了 C 盘爆满是常态）

```bash
docker system df                     # 总览：镜像/容器/volume/构建缓存各占多少
docker system prune                  # 交互式清理停止容器、悬空镜像、无用网络、构建缓存
docker system prune -a --volumes     # 核弹级：连未使用的镜像和 volume 一起清（先确认数据！）

docker image prune                   # 只清悬空镜像（<none> 标签那些）
docker container prune               # 清停止的容器
docker volume prune                  # 清无主 volume
docker builder prune                 # 清构建缓存
```

### 12.2 排障套路

**容器一启动就退出（`docker ps` 看不到，`ps -a` 显示 Exited）**：

```bash
docker ps -a                                    # 先看 Exit Code
docker logs <容器>                               # 再看应用日志，90% 问题在这
docker inspect <容器> -f '{{json .State}}'      # 看 OOMKilled、错误信息
```

常见退出码：

| Exit Code | 含义 | 排查方向 |
|---|---|---|
| 0 | 正常退出（任务型容器跑完了） | 常驻服务退出说明启动命令不对 |
| 1 | 应用自身报错 | 看日志堆栈 |
| 125 | docker 本身参数错误 | 端口冲突、挂载路径不存在 |
| 126/127 | 命令不可执行/找不到 | 镜像里没这个命令、没执行权限 |
| 137 | 被 SIGKILL（=128+9） | 多半 OOM，调大 memory 限制或查内存泄漏 |
| 139 | 段错误（=128+11） | 原生库崩溃 |
| 143 | 收到 SIGTERM 退出（=128+15） | 正常停止的信号，异常出现则查谁发的停止 |

**端口访问不通**：

```bash
docker port <容器>                    # 确认映射关系
# 容器内自测，排除是应用还是网络问题
docker exec -it <容器> sh -c "wget -qO- localhost:80"
```

**容器间 ping 不通**：确认在同一个自定义网络（`docker network inspect`），默认 bridge 下容器名不能互相解析。

**挂载不生效/挂载目录是空的**：Windows 路径问题，先 `docker inspect <容器> | grep -A5 Mounts` 看实际挂载源；确认 Docker Desktop 的文件共享已授权该盘符。

**构建很慢**：检查 Dockerfile 指令顺序是否利用了层缓存（依赖清单先 COPY 先装），以及 `.dockerignore` 是否生效。

---

## 13. 命令速查表

```bash
# ── 镜像 ──
docker pull <img:tag>                    拉取
docker images                            本地镜像列表
docker build -t name:tag .               构建
docker tag src:tag registry/dst:tag      重命名打标签
docker push registry/name:tag            推送
docker rmi <img>                         删除
docker save/load                         导出/导入
docker history <img>                     分层详情

# ── 容器生命周期 ──
docker run -d --name n -p 80:80 -e K=V -v a:b --restart=always img
docker ps / docker ps -a                 查看（全部）
docker stop/start/restart/kill <c>       停止/启动/重启/强杀
docker rm -f <c>                         删除
docker logs -f --tail=200 <c>            日志
docker exec -it <c> bash                 进入
docker inspect <c>                       元数据
docker stats / docker top <c>            资源/进程

# ── 网络与存储 ──
docker network create/ls/inspect/rm
docker volume create/ls/inspect/rm/prune

# ── Compose ──
docker compose up -d / ps / logs -f / exec / down

# ── 系统 ──
docker system df / prune
docker info / version
```

---

## 14. Docker 与 K8s 的概念对照

学完 Docker 再看 K8s，很多东西是同一思想的集群化升级：

| Docker | K8s | 关系 |
|---|---|---|
| Image | Pod 中容器的 `image` | 同一个镜像标准（OCI），K8s 节点上靠 containerd 运行 |
| `docker run -p 80:80` | Service + Ingress | 单机端口映射 → 集群级服务发现与负载均衡 |
| `-e` 环境变量 | Pod `env` / ConfigMap / Secret | K8s 把配置外置成独立对象 |
| `-v` bind mount / volume | PV / PVC / 存储类 | 单机目录 → 集群级分布式存储声明 |
| 自定义 bridge + 容器名互访 | Service DNS 名互访 | 都是"名字即域名"，K8s 跨节点生效 |
| `--memory/--cpus` 限制 | resources.requests/limits | cgroup 是共同的底层实现 |
| `--restart=always` | 控制器自愈（Deployment 始终维持期望副本） | Docker 只管本机拉起，K8s 节点挂了会在别的节点重建 |
| Docker Compose | Deployment + Service + … 一组 YAML | Compose 管单机，K8s 管集群 |
| Dockerfile 里的 HEALTHCHECK | livenessProbe / readinessProbe | 健康检查思想一致，K8s 区分"活着"和"能接流量" |
| SIGTERM 宽限期 | terminationGracePeriodSeconds | 优雅终止同一套信号机制 |

学习建议路径：

1. 装好 Docker Desktop，跑通 `nginx`、`redis`、自己写的前端镜像三个容器
2. 把第 6-7 节的多阶段 Dockerfile 对着你们前端项目实际写一遍并推到 Harbor
3. 用 Compose 把「前端 + redis」组合起来，理解服务名互访
4. 再回到 K8s，会发现 Deployment 不过是"带自愈和滚动升级能力的、分布式的 docker run 声明"
