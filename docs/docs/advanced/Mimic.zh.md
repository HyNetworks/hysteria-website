# Mimic

[Mimic](https://github.com/hack3ric/mimic) 是一个可以把 UDP 包伪装成 TCP 的第三方工具。Hysteria 内置了对它的支持，可以直接在配置中启用，无需手动配置 mimic。

对网络中间设备而言，Hysteria 连接会看起来是 TCP 而非 UDP - 在一些有相关限制的网络环境中，这可能更为理想，甚至是 Hysteria 能正常工作的必要条件。

注意：这并不代表 Hysteria 真的改用 TCP。它依然使用基于 UDP 的 QUIC，只是在链路上将包修改成了 TCP 的样子。**这是一种混淆手段，而非协议层面的改变。**

## 工作原理

Mimic 会通过 eBPF 在数据包进出本机时对其进行改写：发出的 UDP 包加上伪造的 TCP 头，收到的包则被去掉。改写发生在 socket 之下，因此 Hysteria 收发的仍然是正常的 QUIC。

由于两端都需要改写数据包，**服务端和客户端都必须启用 mimic。**

## 前置条件

Mimic **仅支持 Linux**，且不随 Hysteria 一起分发。两端的机器都需要：

- `mimic` 程序位于 `PATH` 中（或在配置中显式指定，见下文）。
- 已加载其内核模块（`modprobe mimic`）。
- Hysteria 自身以 **root 权限**运行，因为安装 eBPF 程序需要足够权限。

安装方法请参阅 mimic 自己的 [Getting Started](https://github.com/hack3ric/mimic/blob/master/docs/getting-started.md) 文档，完整的命令行说明请参阅 [mimic(1)](https://github.com/hack3ric/mimic/blob/master/docs/mimic.1.md)。

**不需要**配置 mimic 的 systemd 服务，也不需要手动编写配置文件。Hysteria 会自动启动并管理 mimic。

## 配置

服务端和客户端使用相同的 `mimic` 配置块。

最简示例：

```yaml
mimic:
  enabled: true
```

**大多数情况下，两端都设置 `enabled: true` 就足够了。**

完整示例：

```yaml
mimic:
  enabled: true # (1)!
  interface: eth0 # (2)!
  xdpMode: skb # (3)!
  path: /usr/bin/mimic # (4)!
  extraArgs: [] # (5)!
```

1. 是否启用 mimic。**两端必须一致。**
2. 要附加到的网络接口。可选；默认情况下 Hysteria 会自动选择与对端通信所使用的接口。
3. 强制指定 XDP 模式，`native` 或 `skb`。可选；除非 mimic 附加失败（某些网卡驱动在 native 模式下工作不正常），否则请保持不填。
4. mimic 可执行文件的路径。可选；默认从 `PATH` 中查找。
5. 原样传递给 mimic 的额外参数，用于调整 Hysteria 没有对应选项的部分（填充、握手与保活参数）。可选。

## 重要行为

- **启用了 mimic 的服务端，在不使用 mimic 的情况下无法连接。** 未启用的客户端不会收到任何响应，看起来像是网络故障而不是配置错误。启用它对现有客户端来说是破坏性变更 - 必须两端都启用才能继续通信。

- **不能与[端口跳跃](Port-Hopping.md)同时使用。** Mimic 按单个地址和端口匹配流量，而端口跳跃会在一个范围内变化。这样的配置会在启动时被 Hysteria 拒绝。

- **一台机器共用一个 mimic 实例。** 由于 mimic 绑定在网卡而非 socket 层上，连接同一服务端的多个 Hysteria 进程会共用一个实例。如果已经运行的实例的过滤规则已经覆盖了所需地址，Hysteria 会直接复用；如果没有覆盖，Hysteria 会拒绝启动。
