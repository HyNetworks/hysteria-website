# ECH

ECH (Encrypted Client Hello) 会对 TLS ClientHello 进行加密，其中包括 SNI，因此中间设备只能看到一个用作幌子的「公开域名」而非真实域名。

不使用 ECH 的情况下，SNI 会在握手中以明文形式传输，使中间设备可以基于域名进行探测和针对性屏蔽。使用 ECH 后，真实的域名会被放在一段加密的负载中。

注意 ECH 只保护 QUIC/TLS 握手中的 SNI。如果开启了[混淆](Full-Server-Config.md#obfuscation)，整条连接根本无法被识别为 QUIC，因此 ECH 不会带来额外的好处。ECH 适合用在非混淆模式下，此时 QUIC 握手是标准的，SNI 是最主要的明文特征。

## 工作原理

ECH 部署包含两个部分，作为一对密钥一起生成：

- **私钥**（private key），保存在服务端，用于解密真实的 ClientHello。
- **配置列表**（config list，公开），供客户端用来加密 ClientHello。包含**公开域名**（public name）- 以明文出现的、用作幌子的 SNI。

当客户端使用 ECH 连接时，ClientHello 中可见的 SNI 是公开域名（如 `decoy.example.com`），而真实的 SNI 以及握手的其余部分则被加密封装在 ECH 负载中。

## 生成密钥

从 2.12.3 版本开始，可以使用 Hysteria 内置的生成命令：

```bash
hysteria ech --public-name decoy.example.com
```

`--public-name` 是必填参数：它是以明文传输的外层伪装 SNI，并非真实服务器域名。

该命令会创建 `ech.pem`，并输出可直接复制粘贴的服务端和客户端配置块。

文件中包含以下两个 PEM 块：

```
-----BEGIN ECH KEYS-----
...
-----END ECH KEYS-----
-----BEGIN ECH CONFIGS-----
...
-----END ECH CONFIGS-----
```

**请妥善保管 `ech.pem`，不要公开分享。** 该文件包含私钥。只需分享输出的客户端 `tls.ech` 设置下的 base64 值。服务端会读取 `ECH KEYS` 块，并从中派生出对应的公开配置列表。

选项：

| 选项 | 默认值 | 含义 |
| --- | --- | --- |
| `--public-name` | 必填 | 以明文传输的外层 SNI。 |
| `--output`, `-o` | `ech.pem` | 包含私钥的 PEM 输出文件。 |
| `--config-id` | 随机字节 | 配置标识符，范围为 0-255；`-1` 表示随机选择 ID。轮换密钥时，应为同时生效的密钥使用不同的 ID。 |
| `--max-name-length` | `0` | 用于填充的内层域名长度提示，范围为 0-255。零表示未知；此值不会限制真实服务器域名的长度。 |
| `--aead` | `aes-128-gcm` | 按优先顺序排列、以逗号分隔的 HPKE AEAD 算法：`aes-128-gcm`、`aes-256-gcm`、`chacha20-poly1305`。 |
| `--overwrite` | 关闭 | 覆盖已有的密钥文件。 |

生成的密钥不能替代服务器 TLS 证书。请保留现有证书和客户端验证设置。更换 ECH 密钥后，需要向客户端分发新的配置；当服务端不再接受旧配置时，使用旧配置的客户端将无法连接。

通过 `sing-box generate ech-keypair` 生成的密钥文件也与 Hysteria 兼容。

## 服务端配置

添加一个指向密钥文件的 `ech` 块。

```yaml
ech:
  keyPath: ech.pem
```

服务端在启动时会在日志中输出客户端所需的配置：

```
INFO ECH enabled, set the following config list on clients (tls.ech) {"configList": "AEz+DQBIAAAg..."}
```

这段 base64 字符串就是要交给客户端的内容。（它与 `ECH CONFIGS` 块的值相同，只是以单行 base64 编码的形式呈现。）

## 客户端配置

将 `tls.ech` 设置为 `hysteria ech` 或服务端日志输出的配置列表。取值可以直接是那段 base64 字符串，也可以是一个包含它的文件路径（文件内容可以是 base64，也可以是 `ECH CONFIGS` PEM 块）：

```yaml
tls:
  sni: real.example.com # (1)!
  ech: AEz+DQBIAAAg... # (2)!
```

1. 真实的服务器域名，用于证书验证。
2. `hysteria ech` 或服务端日志输出的配置列表，或是一个包含它的文件路径。

ECH 配置也可以通过 `ech` 查询参数携带在[分享 URI](../developers/URI-Scheme.md) 中。

## 重要行为

- **ECH 向后兼容。** 开启了 ECH 的服务端仍然接受不开启 ECH 的客户端；这些客户端像以前一样以明文发送 SNI。这意味着可以在服务端开启 ECH 而不会影响现有客户端配置的使用。

- **Fail-closed** 如果客户端配置了 ECH，但服务端拒绝（例如因 ECH 配置不匹配，或服务端根本没有开启 ECH），连接会**失败**。

- **`insecure` 对 ECH 错误不生效。** 当 ECH 被拒绝时，TLS 栈会针对公开域名执行强制的证书检查，并忽略 `tls.insecure`。如果用自签名证书进行测试，而服务端没有接受 ECH，会遇到证书验证错误。
