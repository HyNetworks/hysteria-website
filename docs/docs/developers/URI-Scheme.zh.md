# URI 格式

Hysteria 2 的 URI 格式旨在提供一种简洁的方式来表示连接到 Hysteria 2 服务器所需的必要信息。它包括各种参数，如服务器地址、验证密码、混淆，TLS 设置等。

## 结构

```
hysteria2://[auth@]hostname[:port]/?[key=value]&[key=value]...
```

## 组件

### 协议名

`hysteria2` 或 `hy2`

### 验证

验证密码应在 URI 的 `auth` 中指定。这部分实际上就是标准 URI 格式中的用户名部分，因此如果包含特殊字符，需要进行 [百分号编码](https://datatracker.ietf.org/doc/html/rfc3986#section-2.1)。

一种特殊情况是服务器使用 `userpass` 验证时，`auth` 应格式化为 `username:password`。

### 地址

服务器的地址和可选端口。如果省略端口，则默认为 443。

端口部分支持 [端口跳跃](../advanced/Port-Hopping.md) 的「多端口地址格式」。

### 参数

- `obfs`：要使用的混淆类型。目前支持 `salamander` 和 `gecko`。

- `obfs-password`：混淆所需的密码。

- `sni`：用于 TLS 连接的服务器 SNI。

- `insecure`：是否允许不安全的 TLS 连接。接受 `1` 表示 `true`，`0` 表示 `false`。

- `pinSHA256`：服务器证书 SHA-256 指纹。

## 示例

```
hysteria2://letmein@example.com:123,5000-6000/?insecure=1&obfs=salamander&obfs-password=gawrgura&pinSHA256=deadbeef&sni=real.example.com
```

## Realm 模式

[Hysteria Realms](../advanced/Realms.md) 通常使用自己的 `realm://` URI，Hysteria 密码在配置中另外提供。`hysteria2+realm://` 格式将 Realm 地址与 Hysteria 连接参数打包在一起，从而可以通过单个 URI 分享 Realm 模式 Hysteria 服务器的完整信息。

### 结构

```
hysteria2+realm://<token>@<rendezvous-host>[:port]/<realm-name>?[key=value]&[key=value]...
```

地址部分与 `realm://` URI 一致，而非 `hysteria2://`：

- **协议名：** `hysteria2+realm` 使用 HTTPS，`hysteria2+realm+http` 使用 HTTP。
- **Token：** userinfo 部分是牵线服务器的 token，**而非** Hysteria 密码（见下方 `auth` 参数）。
- **地址：** 牵线服务器的地址，**而非** Hysteria 服务器的地址。目前不支持端口跳跃格式。
- **Realm 名称：** 路径部分。服务器和客户端必须使用相同的名称。

### 参数

所有 `hysteria2://` 参数均适用（`obfs`、`obfs-password`、`sni`、`insecure`、`pinSHA256`），**此外添加**：

- `auth`：Hysteria 验证密码。（在 `hysteria2://` 格式中位于 userinfo 部分，但这里 userinfo 已被 Realm token 占用。）

- `stun`：覆盖 STUN 服务器。重复该参数可指定多个服务器。

- `lport`：将本地 UDP socket 绑定到指定端口（1-65535）。默认为随机端口。

### 示例

```
hysteria2+realm://mytoken@rendezvous.example.com/my-cabin-1f3a8c2e9b?auth=your_password&insecure=1&pinSHA256=deadbeef
```

## 注意事项

这个 URI 故意只包含连接到 Hysteria 2 服务器所需的基础信息。尽管第三方实现可以根据需要添加额外的参数，但它们不应假设其他实现能理解这些额外参数。

此外，参数不应包括客户端模式（如 HTTP、SOCKS5 等）或带宽值。用户需要明白这些内容不应该被其他人随意共享和使用，需要每个用户根据自己的情况进行配置。
