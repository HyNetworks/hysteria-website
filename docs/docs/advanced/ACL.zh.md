# ACL

ACL 是 Hysteria 服务端中一个非常强大的功能，可以用来自定义处理客户端请求的方式，往往配合出站规则（outbounds）使用。例如，可以使用 ACL 来屏蔽某些地址，针对不同网站使用不同出口，或者让不同用户走不同出口。

从 2.14.0 版本开始，ACL 规则以表达式的形式编写，可以根据目标地址、协议、客户端地址以及客户端的验证 ID 进行匹配。之前版本使用的[旧版语法](#legacy-syntax)仍然可以使用。

## 规则 { #rules }

规则写在服务端配置的 `acl.rules` 下：

```yaml
acl:
  rules:
    - outbound: some_proxy # (1)!
      match: auth.id == "alice" # (2)!
    - outbound: reject
      match: geoip("cn") || suffix("example.com")
    - outbound: default
      match: proto == "udp" && dst.port == 53 && cidr("8.8.8.8")
      hijack: 1.1.1.1 # (3)!
    - outbound: direct # (4)!
```

1. 规则匹配时使用的出站名称。可以是你定义的[出站](Full-Server-Config.md#outbounds)，也可以是[内置出站](#built-in-outbounds)。不区分大小写。
2. 可选。一个[表达式](#expressions)，决定该规则是否匹配请求。
3. 可选。将连接改为发往此地址。必须是 IPv4/IPv6 地址，不能是域名。端口保持不变。
4. 没有 `match` 的规则匹配所有请求。通常放在最后，作为其他所有连接的默认规则。

规则按从上到下的顺序进行匹配，使用第一个匹配请求的规则。如果没有规则匹配，将使用默认出站（出站列表中的第一个）。

也可以把规则放在单独的文件中，并用 `acl.rulesFile` 指定该文件。文件内容是同样的列表，但不包含 `acl:` 和 `rules:` 这两层：

```yaml
- outbound: some_proxy
  match: auth.id == "alice"
- outbound: direct
```

## 表达式 { #expressions }

`match` 使用 [expr 语言](https://expr-lang.org/docs/language-definition)编写。其中最常用的部分有：

- 比较：`==`、`!=`、`<`、`<=`、`>`、`>=`
- 逻辑：`&&`（或 `and`）、`||`（或 `or`）、`!`（或 `not`），以及用于分组的括号
- 列表和范围：`auth.id in ["alice", "bob"]`、`dst.port in 8000..8999`
- 字符串：`startsWith`、`endsWith`、`contains`，以及用于正则表达式的 `matches`，例如 `dst.host matches "^cdn[0-9]+"`

规则的表达式的结果必须是 `true` 或 `false`。不支持 `now()` 和 `date()` 等时间函数。

### 变量 { #variables }

| 变量 | 说明 |
| --- | --- |
| `proto` | `"tcp"` 或 `"udp"` |
| `dst.host` | 请求的目标主机：客户端发送的域名（小写，不含末尾的点）或 IP 地址。如果启用了[协议嗅探](Full-Server-Config.md#sniff)，且嗅探到了域名，则为嗅探到的域名。 |
| `dst.port` | 请求的目标端口 |
| `dst.ipv4`、`dst.ipv6` | 目标主机解析得到的 IPv4 和 IPv6 地址（参见[域名和 IP 匹配](#domain-and-ip-matching)）。没有时为空字符串。 |
| `auth.id` | 客户端的验证 ID。使用 `userpass` 验证时为用户名；使用 `http` 验证时为你的验证服务器返回的 `id`；使用 `command` 验证时为命令的输出；使用 `password` 验证时始终为 `user`。 |
| `client.ip`、`client.port` | 客户端连接所用的 IP 地址和端口 |

### 匹配函数 { #matcher-functions }

| 函数 | 匹配 |
| --- | --- |
| `domain("example.com")` | 完全匹配一个域名（不包括子域名）。支持 `*` 通配符，例如 `domain("*.example.com")` 或 `domain("*.google.*")`。 |
| `suffix("example.com")` | 一个域名及其所有子域名：`example.com`、`www.example.com` 等 |
| `cidr("10.0.0.0/8")` | IPv4/IPv6 CIDR 或单个地址，例如 `cidr("1.1.1.1")` 或 `cidr("2001:db8::/32")` |
| `geoip("cn")` | GeoIP 国家代码 |
| `geosite("netflix")` | GeoSite 分类。支持标签，例如 `geosite("google@cn")`。 |
| `legacy("geoip:cn")` | 任何[旧版语法](#address-types)中的地址，例如 `legacy("suffix:example.com")`。用于[转换](#converting-legacy-rules)后的旧版规则。 |

只传一个参数时，匹配函数检查请求的目标：其主机名、解析得到的 IPv4 地址或解析得到的 IPv6 地址。因此 `geoip("cn")` 也会匹配解析到中国 IP 地址的域名。

传两个参数时，函数改为检查第二个参数。可以用来匹配客户端的地址，例如 `geoip("cn", client.ip)` 或 `cidr("192.168.0.0/16", client.ip)`。

第一个参数必须是直接写在规则中的字符串。Hysteria 会在启动时准备好所有匹配器，所以不能写 `geoip(auth.id)`。

> 要查看可用的 GeoSite 分类，可以参考这里：
>
> - <https://github.com/Loyalsoldier/v2ray-rules-dat>
> - <https://github.com/v2fly/domain-list-community/tree/master/data>

## 匹配行为 { #matching-behavior }

### 域名和 IP 匹配 { #domain-and-ip-matching }

当处理基于域名的请求时，Hysteria 首先会解析该域名，然后尝试匹配域名和 IP 规则。**换句话说，基于 IP 地址的规则将适用于所有最终指向该 IP 的连接，无论客户端请求是用的域名还是 IP。**

匹配时只使用域名的第一个 IPv4 地址和第一个 IPv6 地址。

### 错误 { #errors }

服务端启动时会检查规则。未知的变量、结果不是 `true` 或 `false` 的表达式、未知的出站、未知的 GeoIP 国家代码等错误会使服务端停止，并显示出错的规则：

```
invalid config: acl.rules: error at rules[0]: type acl.Auth has no field idd (1:6)
 | auth.idd == "alice"
 | .....^
```

如果表达式在求值时出错，例如 ID 不是数字时的 `int(auth.id) > 100`，该规则视为不匹配。

## 内置出站 { #built-in-outbounds }

除非在出站列表中明确地进行了覆盖（同名），否则 Hysteria 内置以下出站：

- `direct` - 使用默认配置（`auto`，无绑定）的本地出站
- `reject` - 拒绝连接
- `default` - 使用出站列表中的第一个出站；如果列表为空，等同于 `direct`

## 示例 { #examples }

假设有以下出站列表：

```yaml
outbounds:
  - name: v4_only
    type: direct
    direct:
      mode: 4
  - name: v6_only
    type: direct
    direct:
      mode: 6
  - name: some_proxy
    type: socks5
    socks5:
      addr: ohno.moe:1080
```

```yaml
acl:
  rules:
    # 用户 "alice" 的所有流量都走 some_proxy
    - outbound: some_proxy
      match: auth.id == "alice"

    # 用户 "bob" 和 "carol" 不能使用 UDP
    - outbound: reject
      match: auth.id in ["bob", "carol"] && proto == "udp"

    # 为 Google 使用 v6_only 出站
    - outbound: v6_only
      match: suffix("google.com")

    # 为 Twitter 使用 v4_only 出站，用户 "dave" 除外
    - outbound: v4_only
      match: suffix("twitter.com") && auth.id != "dave"

    # 也支持非英语 IDN 域名
    - outbound: v6_only
      match: domain("战狼*.中国")

    # 屏蔽 QUIC 和 SMTP
    - outbound: reject
      match: (proto == "udp" && dst.port == 443) || (proto == "tcp" && dst.port == 25)

    # 屏蔽中国和朝鲜
    - outbound: reject
      match: geoip("cn") || geoip("kp")

    # 屏蔽 Facebook 和 Google Ads
    - outbound: reject
      match: geosite("facebook") || geosite("google@ads")

    # 只有办公网络内的客户端可以访问 10.0.0.0/8
    - outbound: reject
      match: cidr("10.0.0.0/8") && !cidr("192.0.2.0/24", client.ip)

    # 将发往 8.8.8.8 的 DNS 查询劫持到 1.1.1.1，并使用默认（第一个）出站
    - outbound: default
      match: proto == "udp" && dst.port == 53 && cidr("8.8.8.8")
      hijack: 1.1.1.1

    # 直连所有其他地址
    - outbound: direct
```

> **注意：** ACL 也可以不配合出站规则单独使用。无论有没有出站列表，内置出站都会存在。实际上，ACL 最常见的用法之一就是单纯屏蔽一些地址：

```yaml
acl:
  rules:
    - outbound: reject
      match: geoip("cn") || geosite("facebook")
    - outbound: reject
      match: cidr("10.0.0.0/8") || cidr("172.16.0.0/12") || cidr("192.168.0.0/16") || cidr("fc00::/7")
```

## 测试规则 { #testing-rules }

`hysteria acl test` 可以显示服务端会对某个请求使用哪条规则和哪个出站，不会实际建立任何连接。它读取用 `-c` 指定的服务端配置：

```bash
hysteria acl test -c server.yaml --auth alice example.com:443
```

```
Request:   tcp example.com:443, auth.id "alice"
Resolved:  ipv4 172.66.147.243, ipv6 2606:4700:10::6814:179a
Rule:      rules[0]: some_proxy, match: auth.id == "alice"
Outbound:  some_proxy
```

```bash
hysteria acl test -c server.yaml --proto udp 8.8.8.8:53
```

```
Request:   udp 8.8.8.8:53
Resolved:  ipv4 8.8.8.8
Rule:      rules[9]: default, match: proto == "udp" && dst.port == 53 && cidr("8.8.8.8")
Outbound:  v4_only
Hijacked:  1.1.1.1:53
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `--proto` | `tcp` | `tcp` 或 `udp` |
| `--auth` | 空 | 客户端的验证 ID（`auth.id`） |
| `--client` | 无 | 客户端的地址，`IP` 或 `IP:端口`（`client.ip`、`client.port`） |
| `--ipv4`、`--ipv6` | 解析 | 使用这些地址，而不是解析目标主机 |
| `--no-resolve` | 关闭 | 不解析目标主机，即没有 IP 地址 |

默认情况下，会和服务端一样使用服务端配置中的 [DNS 解析](Full-Server-Config.md#dns)设置来解析目标主机。不会模拟协议嗅探：目标主机按原样使用。

## 旧版语法 { #legacy-syntax }

在 2.14.0 版本之前，ACL 规则使用另一种语法，通过 `acl.file` 或 `acl.inline` 设置。这种语法仍然受支持：Hysteria 会在启动时把这些规则转换为表达式，行为与之前相同，只有一处例外，见[下文](#protoport)。

```yaml
acl:
  inline:
    - reject(geoip:cn)
    - reject(all, udp/443)
    - direct(all)
```

一个有效的旧版规则必须符合以下格式之一：

- `outbound(address)`
- `outbound(address, proto/port)`
- `outbound(address, proto/port, hijack_address)`
- `# 这是一条注释`

### 地址类型 { #address-types }

`address` 字段可以是以下几种之一：

- 单一 IPv4/IPv6 地址，例如 `1.1.1.1` 或 `2606:4700:4700::1111`
- IPv4/IPv6 CIDR，例如 `73.0.0.0/8` 或 `2001:db8::/32`
- 域名，例如 `example.com` （不包括子域名）
- 通配域名，例如 `*.example.com` 或 `*.google.*`
- 域名后缀，例如 `suffix:example.com` （匹配 `example.com` 及其所有子域名）
- GeoIP 国家代码，例如 `geoip:cn` 或 `geoip:us`
- GeoSite 分类，例如 `geosite:netflix` 或 `geosite:google` （支持标签，例如 `geosite:google@cn`）
- `all` - 匹配所有地址

### Proto/port { #protoport }

- `tcp` 或 `tcp/*` - 匹配所有 TCP 端口
- `udp` 或 `udp/*` - 匹配所有 UDP 端口
- `tcp/80` - 匹配 TCP 端口 80
- `udp/53` - 匹配 UDP 端口 53
- `udp/20000-30000` - 匹配 UDP 端口 20000 到 30000
- `*/443` - 匹配 TCP 和 UDP 端口 443
- `*`、`*/*` 或省略 - 匹配所有协议和所有端口

> **注意：** 在 2.14.0 版本之前，从 0 开始的端口范围（例如 `udp/0-100`）或端口 `0`（例如 `tcp/0`）会匹配所有端口。现在只匹配指定的端口。

### 劫持地址 (Hijack address) { #hijack-address }

当指定了劫持地址时，匹配此规则的连接将被劫持到指定的地址。劫持地址必须是 IPv4/IPv6 地址，不能是域名。

### 在 `rules` 中混用旧版规则 { #mixing-legacy-rules-into-rules }

`rules` 列表中也可以包含旧版规则，这样无需转换现有的规则列表，就能在其中添加新规则（例如按用户区分的规则）。`legacy` 条目包含一行或多行旧版规则，`legacyFile` 条目引入一个旧版规则文件。它们的规则在列表中的对应位置进行匹配：

```yaml
acl:
  rules:
    - outbound: some_proxy
      match: auth.id == "alice"
    - legacy: reject(geoip:cn)
    - legacy: |
        reject(geosite:facebook)
        reject(all, tcp/25)
    - legacyFile: /etc/hysteria/acl.txt
    - outbound: direct
```

旧版条目中的错误会同时指出条目和行号，例如 `error at rules[3] (/etc/hysteria/acl.txt) line 2: outbound v6_only not found`。

### 转换旧版规则 { #converting-legacy-rules }

`hysteria acl translate` 会把旧版规则输出为等效的 `rules` 列表，这也是 Hysteria 内部实际运行的规则：

```bash
hysteria acl translate acl.txt
```

```
acl:
  rules:
    - outbound: v6_only
      match: legacy("suffix:google.com")
    - outbound: reject
      match: proto == "udp" && dst.port == 443
    - outbound: reject
      match: legacy("geoip:cn")
    - outbound: default
      match: legacy("8.8.4.4") && proto == "udp" && dst.port == 53
      hijack: 1.1.1.1
    - outbound: direct
```

如果没有指定文件，则从标准输入读取。它只检查语法：出站名称和 GeoIP/GeoSite 名称会在服务端载入规则时检查。
