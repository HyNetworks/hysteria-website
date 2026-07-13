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

Hysteria 自身不生成 ECH 密钥。推荐使用 [sing-box](https://github.com/SagerNet/sing-box) 命令创建密钥：

```bash
sing-box generate ech-keypair decoy.example.com
```

参数是公开域名。这**不必**是你自己的域名，但为了达到伪装效果，建议选择一个看起来无害、合理的域名。该命令会输出两个 PEM 块：

```
-----BEGIN ECH CONFIGS-----
...
-----END ECH CONFIGS-----
-----BEGIN ECH KEYS-----
...
-----END ECH KEYS-----
```

将输出完整保存到一个文件中（例如 `ech.pem`）。服务端会从中读取 `ECH KEYS` 块；不需要手动把这两个块拆分开。

```bash
sing-box generate ech-keypair decoy.example.com > ech.pem
```

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

将 `tls.ech` 设置为服务端日志中的配置。取值可以直接是那段 base64 字符串，也可以是一个包含它的文件路径（文件内容可以是 base64，也可以是 `ECH CONFIGS` PEM 块）：

```yaml
tls:
  sni: real.example.com # (1)!
  ech: AEz+DQBIAAAg... # (2)!
```

1. 真实的服务器域名，用于证书验证。
2. 服务端日志中的配置，或是一个包含它的文件路径。

ECH 配置也可以通过 `ech` 查询参数携带在[分享 URI](../developers/URI-Scheme.md) 中。

## 重要行为

- **ECH 向后兼容。** 开启了 ECH 的服务端仍然接受不开启 ECH 的客户端；这些客户端像以前一样以明文发送 SNI。这意味着可以在服务端开启 ECH 而不会影响现有客户端配置的使用。

- **Fail-closed** 如果客户端配置了 ECH，但服务端拒绝（例如因 ECH 配置不匹配，或服务端根本没有开启 ECH），连接会**失败**。

- **`insecure` 对 ECH 错误不生效。** 当 ECH 被拒绝时，TLS 栈会针对公开域名执行强制的证书检查，并忽略 `tls.insecure`。如果用自签名证书进行测试，而服务端没有接受 ECH，会遇到证书验证错误。
