# Конфигурация ACME DNS

ACME DNS позволяет получать сертификаты через API DNS-провайдера. Эта функция не зависит от конкретных портов (не занимает 80/443) и внешнего доступа.

## Поддержка провайдеров

В настоящее время конфигурация ACME DNS поддерживает лишь несколько популярных DNS-провайдеров. Ниже приведены примеры конфигурации для каждого из них.

> Примечание: В следующей документации перечислены только параметры конфигурации для каждого DNS-провайдера. Из-за ограниченных ресурсов разработки значения, которые следует указать для параметров конфигурации, пользователь должен определить самостоятельно. Мы протестировали только конфигурацию Cloudflare.

> Примечание: Провайдер `namedotcom` был удалён в версии v2.11.0, так как его библиотека не была обновлена для нового API libdns. Серверы, использующие его, не смогут запуститься — необходимо перейти на другого провайдера.

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

1. Необязательно. IP-адрес, с которого выполняется API-запрос; он должен быть добавлен в список разрешённых в консоли Namecheap. Если не указан, публичный IP машины определяется автоматически.
2. Необязательно. Нужно только для того, чтобы использовать песочницу Namecheap вместо продакшена.

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

## Работа с несколькими доменами

В настоящее время ACME DNS настроен для работы со всеми доменами в `domains`, т.е. **если вы используете ACME DNS для получения сертификата, убедитесь, что все домены в `domains` используют одного и того же DNS-провайдера.**

## Неподдерживаемые провайдеры

Если вы используете DNS-провайдера, который в настоящее время не поддерживается, вы можете направить DNS-серверы управления вашего домена на поддерживаемого провайдера, например Cloudflare. Это означает: **вы можете приобрести домен у провайдера A и управлять им через провайдера B, при этом используя функциональность ACME DNS.**
