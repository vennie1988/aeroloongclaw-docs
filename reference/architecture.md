# 系统架构

本文档描述当前版本的实际运行架构，重点是：

- 一条普通消息如何进入系统并得到回复
- 当前对话线程如何观察和控制本线程正在运行的任务
- 容器内的 OpenCode runtime 如何执行固定 native-agent 流水线

## OpenCode-First 约束

当前架构的默认约束是：新增运行时能力时，先尝试使用 OpenCode 原生 surface 表达，包括 `instructions`、`.opencode` 资产、`agents`、`commands`、`skills`、provider/MCP 配置、events 和公开 SDK API。只有在这些原生能力无法覆盖需求，或者必须处理消息通道、主机侧密钥、容器隔离、文件边界等宿主职责时，才新增 AeroLoongClaw 自定义桥接层。

## 系统图

```mermaid
flowchart LR
    subgraph Host["Host Runtime (Node.js)"]
        CH["Channels
WeCom / others"]
        DB[("SQLite
messages / groups / tasks / sessions")]
        LOOP["Polling Loop
src/index.ts"]
        GQ["Group Queue
src/group-queue.ts"]
        TS["Task Scheduler
src/task-scheduler.ts"]
        CR["Container Runner
src/container-runner.ts"]
        IPCW["IPC Watcher
src/ipc.ts"]
        ROUTER["Router
src/router.ts"]
        BRIDGE["Runtime Operator Bridge
src/runtime-operator-bridge.ts"]
    end

    subgraph Container["Per-Group Container"]
        ENTRY["agent-runner
container/agent-runner/src/index.ts"]
        OCR["OpenCode Runner
opencode-runner.ts"]
        SUP["Run Supervisor
opencode-session-supervisor.ts"]
        OCS["Embedded OpenCode Server"]
        MCP["IPC MCP Server
container/agent-runner/src/ipc-mcp-stdio.ts"]
        ASSETS[".opencode Runtime Assets
agents / commands / mirrored skills / instructions"]
        WS["Workspace Mounts
/workspace/group
/workspace/ipc
/workspace/skills
/workspace/project (all chats, read-only)"]
    end

    CH -->|"inbound message"| DB
    LOOP -->|"poll new messages"| DB
    TS -->|"due tasks"| GQ
    LOOP -->|"trigger match + prompt build"| GQ
    GQ -->|"spawn / reuse active run"| CR
    CR -->|"stdin ContainerInput JSON"| ENTRY
    ENTRY --> OCR
    OCR --> OCS
    OCR --> SUP
    OCR --> ASSETS
    OCR --> MCP
    OCR --> WS
    SUP -->|"native OpenCode session + events"| OCS
    MCP -->|"atomic JSON files"| IPCW
    IPCW -->|"messages / task ops / group ops"| ROUTER
    ROUTER -->|"outbound text / media"| CH
    CR -->|"runtime events"| BRIDGE
    BRIDGE -->|"progress / audit / status"| CH
    BRIDGE -->|"numeric control 4-6"| GQ
    GQ -->|"run-scoped IPC control file"| WS
```

## 主要数据流

```mermaid
flowchart LR
    U["User"] -->|"send message with trigger"| C["Channel"]
    C -->|"store inbound message"| D[("SQLite")]
    L["Polling Loop"] -->|"poll new messages"| D
    L -->|"enqueue group run"| Q["Group Queue"]
    Q -->|"start container for group"| R["Container Runner"]
    R -->|"pass ContainerInput via stdin"| A["Container Runtime"]
    A -->|"run simple path or native-agent pipeline"| A
    A -->|"write send_message / schedule_task / register_group files"| I["IPC Watcher"]
    I -->|"convert IPC payloads to outbound actions"| RT["Router"]
    RT -->|"send final or intermediate reply"| C
    C -->|"deliver response"| U
```

## 运行时控制流

控制线程不是单独的 Web UI，而是当前消息对话本身。当前协议主路径是数字回复 `4-6`；当同群有多个活跃 run 时，可用 `4 2`、`5 1`、`6 3` 指定槽位。

```mermaid
sequenceDiagram
    participant Agent as Container Runtime
    participant Runner as Container Runner
    participant Bridge as Runtime Operator Bridge
    participant Boss as Current Chat
    participant Queue as Group Queue

    Agent->>Runner: Emit runtime event
    Runner->>Bridge: Forward run.step / permission.requested / summarized / aborted
    Bridge->>Boss: Show current step or audit notice
    Boss->>Bridge: Reply with 4 / 5 / 6 or 4 2 / 5 1 / 6 3
    Bridge->>Queue: Map digit to runtime control action
    Queue->>Agent: Write control JSON into /workspace/ipc/runs/<runId>/input
    Agent->>Agent: Apply summarize / abort / restart
    Agent->>Runner: Emit session.summarized / run.aborted / session.reverted
    Runner->>Bridge: Forward result event
    Bridge->>Boss: Send updated status
```

## 容器运行时流

复杂任务的当前正式主路径是固定 native-agent 流水线，不再依赖 `team_*`。

```mermaid
flowchart LR
    IN["Inbound prompt"] --> TRIAGE["Complexity triage"]
    TRIAGE -->|simple| SIMPLE["Direct prompt execution"]
    TRIAGE -->|complex| PLAN["/complex-plan
planner"]
    PLAN --> RESEARCH["/complex-research
researcher"]
    RESEARCH --> APPROVAL["Approval gate
planner summary + main-control decision"]
    APPROVAL -->|approved| EXEC["/complex-execute
executor"]
    APPROVAL -->|rejected| STOP["Safe stop / revise / restart"]
    EXEC --> REVIEW["/complex-review
reviewer"]
    REVIEW --> OUT["Final response + run.completed"]
    SIMPLE --> OUT
```

## 各层职责

### 主机侧

- Channel adapters 接收和发送消息
- SQLite 存储消息、群组、sessions、任务和路由状态
- `src/index.ts` 轮询入站消息并编排执行
- `src/group-queue.ts` 确保按群组串行执行，全局并发上限
- `src/container-runner.ts` 启动容器、绑定挂载、传递 stdin 输入、解析结构化 stdout
- `src/ipc.ts` 消费容器写入的 IPC 文件
- `src/runtime-operator-bridge.ts` 将运行时事件转换为 boss 面向的更新和数字控制

### 容器侧

- `container/agent-runner/src/index.ts` 读取 stdin 并启动运行时
- `opencode-runner.ts` 启动嵌入式 OpenCode server，写入 config/assets，协调消息/控制循环
- `opencode-session-supervisor.ts` 监督实时运行，正规化事件，处理 summarize / abort / restart 语义
- `ipc-mcp-stdio.ts` 暴露 host 面向的工具如 `send_message`、`schedule_task`、`register_group`
- `.opencode/` 资产按群组生成并发布到挂载的工作区

## 挂载数据边界

每个活跃群组，容器获得隔离的挂载：

- `/workspace/group`：该群组的可写工作区
- `/workspace/ipc`：该群组的 IPC 命名空间
- `/workspace/skills`：只读运行时 skills
- `/workspace/project`：每个授权聊天的只读主机项目挂载
- `/home/node/.local`：按群组的 OpenCode 数据目录

## 当前运行时契约

### 容器 stdin

Host 传递 `ContainerInput` JSON payload，包含：
- prompt
- runId
- sessionId
- groupFolder
- chatJid
- secrets
- model
- runtimeFlags
- mounted skill metadata

### 容器 stdout

结构化输出包装在：
- `---AEROLOONGCLAW_OUTPUT_START---`
- `---AEROLOONGCLAW_OUTPUT_END---`

`src/container-runner.ts` 解析这些标记来提取 `ContainerOutput`。

### 运行时事件

当前正规化运行时事件包括：
- `run.started`
- `run.step`
- `run.blocked`
- `permission.requested`
- `permission.resolved`
- `session.summarized`
- `session.reverted`
- `run.completed`
- `run.aborted`
- `run.failed`
- `workspace.reloaded`

### Boss 端数字协议

- `1`：同意这一次
- `2`：后面都同意
- `3`：先不要做
- `4`：现在进展
- `5`：停下来
- `6`：从头再来

## 代码阅读顺序

如果你要顺着代码追一条真实消息，推荐顺序：

1. `src/index.ts`
2. `src/group-queue.ts`
3. `src/container-runner.ts`
4. `container/agent-runner/src/opencode-runner.ts`
5. `container/agent-runner/src/opencode-session-supervisor.ts`
6. `container/agent-runner/src/ipc-mcp-stdio.ts`
7. `src/ipc.ts`
8. `src/runtime-operator-bridge.ts`
