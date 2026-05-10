# Hysteria Realms

Hysteria Realms 是一种允许 Hysteria 服务端**在没有公网 IP 或端口转发的情况下**运行的 P2P 模式。一个轻量的牵线服务器 (rendezvous server) 负责把服务端和客户端介绍给彼此，之后两端通过 UDP 打洞建立直接的 QUIC 连接。一旦打通，牵线服务就退出整个流程——所有流量在客户端和服务端之间直接传输。

## 适用场景

- 在 NAT 后的**家用宽带**上开服务器。
- 在你无法控制路由器的**咖啡店、酒店或手机流量**上开服务器。
- 需要快速测试服务器配置但嫌配置 VPS 太麻烦。
- 在无法获得入站端口的 **CGNAT** 环境中开服务器。

使用 Realms 仍然需要 UDP 流量能正常传输到牵线服务器和对端网络。只要 NAT 不是完全禁止 UDP 流量即可。

## 工作原理

1. Hysteria **服务端**通过 STUN 发现自己的 UDP 公网地址，把这些地址连同你选择的 *realm*（一个名字）注册到牵线服务。
2. **客户端**用相同的 realm 地址，请求牵线服务发起连接。牵线服务把服务端的地址返回给客户端，同时把客户端的地址推送给服务端。
3. 双方同时朝彼此发送 UDP 包，从而在各自的 NAT 上打洞。
4. 一旦洞打开，常规的 Hysteria QUIC 握手就在直连之上继续进行。

牵线服务器只负责帮双方 "牵线搭桥"。**不代理任何流量。**

## Realm 地址

客户端和服务端使用同一个 URI 标识一个 realm：

```
realm://<token>@<rendezvous-host>[:port]/<realm-name>
```

- `realm://` —— 通过 HTTPS 与牵线服务器通信（默认端口 443）。**推荐**
- `realm+http://` —— 通过明文 HTTP 通信（默认端口 80）。建议仅用于开发测试。
- `<token>` —— 牵线服务器的共享密码。
- `<realm-name>` —— 你选择的 realm 名称。客户端和服务端必须使用相同的名称才能建立连接。

例如：`realm://mytoken@rendezvous.example.com/my-server`

URL 还支持以下可选参数：

- `stun=<host:port>` —— 覆盖默认的 STUN 服务器。重复多次可以指定多个服务器（例如 `?stun=stun1.example.com:3478&stun=stun2.example.com:3478`）。设置后会优先于 YAML 配置中的 [`realm.stunServers`](Full-Server-Config.md#realm)。
- `lport=<1-65535>` —— 指定本地 UDP socket 绑定的端口。可用于特定环境下适配防火墙规则或获取更好的 NAT 映射等。默认为随机端口。

## 选择牵线服务器

你可以使用**公共牵线服务器**或**自建**牵线服务器。

### 公共牵线服务器 (`realm.hy2.io`)

Hysteria 项目运行了一个公共牵线服务器，地址为 `realm.hy2.io`，密码为 `public`：

```
realm://public@realm.hy2.io/<your-realm-name>
```

> **无任何保证** 这是一个免费公益牵线服务器。可能在没有任何通知的情况下下线、修改设置、被屏蔽，或者消失。不要依赖它做任何重要的事情。

> **所有 realm 都由用户自行运行。** Hysteria 项目永远不会运营、支持或审核 `realm.hy2.io` 上注册的任何代理服务器。任何人都可以用任意名称注册 realm。**请务必只连接你信任的 realm**——陌生人的节点可能是记录流量、进行 MITM 攻击的蜜罐。

由于密码是共享的，**任何知道或猜出你 realm 名称的人都可以探测到你服务端的 IP 地址。** 为了防止暴力猜测：

- 选一个**长且随机的 realm 名称**并保密。比如 `my-cabin-1f3a8c2e9b` 比 `home` 难猜得多。
- 避免使用能识别你身份的名字（用户名、主机名等）。

如果以上任何一点对你来说无法接受，**请改用自建牵线服务器**。

#### 当前限制

Realm 名称必须为 6–64 个字符，以字母或数字开头，其余字符仅可使用字母、数字、`-` 或 `_`。每个 IP 同时最多只能拥有 2 个活跃的 realm。这些限制可能在没有通知的情况下变更；如果希望绕开这些限制，请自建牵线服务器。

### 自建

牵线服务器开源且易于部署：<https://github.com/apernet/hysteria-realm-server>

强烈建议在生产环境下使用强密码保护的自建实例：

- 只有知道密码的客户端和服务端才能注册和连接。
- 自行掌控运维、设置和日志。
- 内存占用很小（每个 realm 几 KB）。

详细的部署方式请参考[项目 README](https://github.com/apernet/hysteria-realm-server)。

## 服务端配置

要让 Hysteria 服务端运行在 realm 模式下，将 `listen` 设为一个 realm URI。服务端会通过出站 TCP 连接到牵线服务器，注册 realm，然后等待连接——不需要任何入站端口。

```yaml
listen: realm://public@realm.hy2.io/your-realm-name
```

服务端的其它字段（auth、tls、obfs、bandwidth 等）保持不变。STUN、打洞和心跳的调优选项请参见[完整服务端配置](Full-Server-Config.md#realm)。

> **如果担心 DPI 审查，建议启用 [`obfs`](Full-Server-Config.md#obfuscation)。** 在 realm 模式下，服务端监听的是随机 UDP 端口。非标准端口上的 HTTP/3 流量本身可能成为一个检测信号。

## 客户端配置

将 `server` 设为服务端注册时使用的同一个 realm URI：

```yaml
server: realm://public@realm.hy2.io/your-realm-name
auth: your-hysteria-password
```

客户端的其它字段保持不变。STUN 和打洞的调优选项请参见[完整客户端配置](Full-Client-Config.md#realm)。

客户端先做 STUN 发现，请求牵线服务介绍服务端，打通连接，然后照常进行 Hysteria 的 QUIC 握手——包括 TLS 验证和密码认证。**Realm 密码不会代替 Hysteria 服务端的密码。**

## TLS

在 realm 模式下，客户端没有可用于校验服务端证书的 DNS 名称（因为是直接用 IP 连接）。在没有额外配置的情况下，客户端会回退到使用牵线服务器的主机名作为 SNI，这通常和服务端证书不匹配。有三种选择：

**1. 使用 `pinSHA256` 加自签名证书。** 在服务端运行 `hysteria cert`，会生成密钥和证书，并打印可直接粘贴到 `server.yaml`（cert/key）和 `client.yaml`（`insecure: true` + `pinSHA256`）的 `tls` 配置。pin 可以保证客户端只接受这个特定的证书，因此 SNI 与 CA 校验都不再重要。

**2. 真实 CA 证书 + `tls.sni` 覆盖。** 通过你拥有的域名使用 [DNS-01 ACME](ACME-DNS-Config.md) 申请证书（HTTP-01 / TLS-ALPN-01 无法在没有公网 IP 的情况下使用），部署到服务端，并在客户端将 [`tls.sni`](Full-Client-Config.md#tls) 设为该域名。

**3. 使用与牵线服务器同名的证书。** 仅在你同时自建牵线服务器时可用：把 Hysteria 服务端的证书签发给和牵线服务器相同的主机名，客户端默认的 SNI 即可匹配，无需额外配置。

## NAT 兼容性

UDP 打洞能在大多数家用和移动网络上正常工作，不过并非所有。

| NAT 类型 | 可用性 |
| --- | --- |
| 公网 IP，无 NAT | **可用** |
| 全锥 NAT (full cone) | **可用** |
| 限制锥 NAT (restricted) | **可用** |
| 对称 NAT (symmetric) | **也许可用** |

对于对称 NAT，Hysteria 会尝试一些启发式方法，在很多情况下依然能成功打通，**但无法保证**。尤其如果两端都在对称 NAT 后，成功率会进一步下降。

某些运营商级 NAT（CGNAT）的行为类似对称 NAT，因此并不稳定。如果你发现 Realms 在你的网络上无法工作，最可能的原因是至少一侧是对称 NAT——请退而使用有公网 IP 的服务器。

## STUN 服务器

服务端和客户端都需要通过 STUN 获取自己的 UDP 公网地址。如果不做额外配置，Hysteria 会使用内置的 STUN 服务器列表：

- `stun.nextcloud.com:3478`
- `stun.sip.us:3478`
- `global.stun.twilio.com:3478`

这些服务器由第三方运行，仅供顺手使用。它们可能会下线、限速，或在你的网络环境中被屏蔽。如果需要更高可用性，建议通过服务端的 [`realm.stunServers`](Full-Server-Config.md#realm) 和客户端的 [`realm.stunServers`](Full-Client-Config.md#realm) 指向自己的（或其他可信的）STUN 服务器。

## 报告连接问题

Realms 涉及多个环节（STUN、牵线服务器、NAT 打洞、TLS、QUIC 握手），"连不上" 这种报告如果没有日志很难定位问题。提交 issue 时，请在**客户端和服务端两边**都使用 `HYSTERIA_LOG_LEVEL=debug` 运行，并附上两端完整的日志输出：

```bash
HYSTERIA_LOG_LEVEL=debug ./hysteria server -c server.yaml
HYSTERIA_LOG_LEVEL=debug ./hysteria client -c client.yaml
```

## 其他协议

Realms 本质上是一个通用的 UDP 打洞框架——其牵线协议、STUN 发现和打洞逻辑并不和 Hysteria 耦合。Hysteria 只是它的第一方用户。

[牵线服务器](https://github.com/apernet/hysteria-realm-server) 和[客户端 / 服务端打洞库](https://github.com/apernet/hysteria/tree/master/extras/realm)都开源发布。欢迎其他基于 UDP 的工具和协议的作者集成同一套协议，让任何兼容的客户端能通过任何牵线服务器连接到任何兼容的服务器，将 Realms 发展为一个标准。欢迎在 GitHub 上发起 PR、issue 或集成相关讨论。
