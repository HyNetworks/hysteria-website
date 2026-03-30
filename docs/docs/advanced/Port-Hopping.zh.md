# 端口跳跃

中国用户有时报告运营商会阻断或限速 UDP 连接。不过，这些限制往往仅限单个端口。端口跳跃可用作此情况的解决方法。

## 客户端

Hysteria 客户端支持一种特殊的多端口地址格式：

```python
example.com:1234,5678,9012 # (1)!
example.com:20000-50000 # (2)!
example.com:1234,5000-6000,7044,8000-9000 # (3)!
```

1. 多个单端口。
2. 端口范围。
3. 两者的组合。

可指定的端口数量没有限制。

客户端将随机选择一个端口进行初始连接，并定期随机跳跃到另一个端口。用于控制时间间隔的选项在 `transport` 部分中：

=== "固定间隔"

    ```yaml
    transport:
      udp:
        hopInterval: 30s # (1)!
    ```

    1. 默认 30s。必须至少为 5s。

=== "随机间隔"

    ```yaml
    transport:
      udp:
        minHopInterval: 15s # (1)!
        maxHopInterval: 45s # (2)!
    ```

    1. 最小端口跳跃间隔。必须至少为 5s。
    2. 最大端口跳跃间隔。

    每次跳跃将使用 `minHopInterval` 和 `maxHopInterval` 之间的随机间隔。这使得跳跃模式更难以预测和检测。

> **注意：** 可以使用 `hopInterval` 设置固定间隔，或使用 `minHopInterval`/`maxHopInterval` 设置随机间隔。两者不能同时使用。

假设服务器确实在所有指定的端口上可达，跳跃过程对上层应用是透明的，不会导致数据丢失/连接断开。

## 服务器

### 内置端口范围（仅 Linux）

在 Linux 上，Hysteria 服务端内置支持监听端口范围。只需在 `listen` 字段中指定端口范围：

```yaml
listen: :20000-50000
```

服务器将监听范围内的第一个端口，并自动设置防火墙规则（使用 nftables 或 iptables）将其他端口的流量重定向到第一个端口。服务器关闭时会自动清理这些规则。

> **注意：** 需要系统上有 `nft`（nftables）或 `iptables`/`ip6tables`。服务器可能需要以适当的权限运行（例如 root 或 `CAP_NET_ADMIN`）才能修改防火墙规则。

### 手动设置

通常不需要，但你也可以使用 iptables 或 nftables 的 DNAT 手动转发端口：

=== "iptables"

    ```bash
    # IPv4
    iptables -t nat -A PREROUTING -i eth0 -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
    # IPv6
    ip6tables -t nat -A PREROUTING -i eth0 -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
    ```

=== "nftables"

    ```nginx
    define INGRESS_INTERFACE="eth0"
    define PORT_RANGE=20000-50000
    define HYSTERIA_SERVER_PORT=443

    table inet hysteria_porthopping {
      chain prerouting {
        type nat hook prerouting priority dstnat; policy accept;
        iifname $INGRESS_INTERFACE udp dport $PORT_RANGE counter redirect to :$HYSTERIA_SERVER_PORT
      }
    }
    ```

在这个示例中，服务器监听 443 端口，但客户端可以通过 20000-50000 范围内的任何端口连接。
