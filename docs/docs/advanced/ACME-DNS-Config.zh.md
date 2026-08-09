# ACME DNS 配置

ACME DNS 可以实现通过 DNS 服务商 API 来获取证书, 该功能不依赖特定端口 (不占用 80/443) 和外部访问。

## 服务商支持

目前 ACME DNS 配置仅支持几个流行的 DNS 服务商, 这些服务商配置样例如下:

> 注意: 以下文档仅列出每个 DNS 服务商的配置选项, 由于开发资源有限, 配置选项应填写的值需要用户自行查找, 我们仅测试了 Cloudflare 配置.

> 注意: `namedotcom` 服务商已在 v2.11.0 中移除, 因其上游库未针对新的 libdns API 进行更新。使用该服务商的服务端将无法启动, 需要更换为其他服务商.

### Cloudflare

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: cloudflare
    config:
      cloudflare_api_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
```

### Duck DNS

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: duckdns
    config:
      duckdns_api_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
      duckdns_override_domain: abc.example.com
```

### Gandi.net

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: gandi
    config:
      gandi_api_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
```

### Godaddy

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: godaddy
    config:
      godaddy_api_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
```

### Namecheap

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: namecheap
    config:
      namecheap_api_key: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
      namecheap_api_user: your_api_user
      namecheap_client_ip: 203.0.113.1 # (1)!
      namecheap_api_endpoint: https://api.sandbox.namecheap.com/xml.response # (2)!
```

1. 可选。发起 API 请求的 IP 地址，需要先在 Namecheap 控制台中加入白名单。如果省略，会自动探测本机的公网 IP。
2. 可选。仅在需要指向 Namecheap 的沙箱环境而非正式环境时填写。

### Njalla

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: njalla
    config:
      njalla_api_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
```

### Porkbun

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: porkbun
    config:
      porkbun_api_key: pk1_Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
      porkbun_api_secret_key: sk1_Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
```

### Vultr

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: vultr
    config:
      vultr_api_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
```

## 域名匹配

目前 ACME DNS 配置针对 `domains` 内所有域名生效, 也就是说 **如果使用 ACME DNS 申请证书, 请保证 `domains` 内所有域名都使用同一个域名服务商.**

## 未支持的服务商

如果您正在使用当前尚未支持的 DNS 服务商, 您仍然可以将域名的 DNS 管理服务器指向已支持的服务商, 例如 Cloudflare; 这意味着: **您可以在 A 服务商购买域名并通过 B 服务商管理, 这样就仍然可以使用 ACME DNS 功能.**
