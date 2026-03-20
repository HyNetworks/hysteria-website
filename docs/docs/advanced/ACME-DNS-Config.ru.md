# Конфигурация ACME DNS

ACME DNS позволяет получать сертификаты через API DNS-провайдера. Эта функция не зависит от конкретных портов (не занимает 80/443) и внешнего доступа.

## Поддержка провайдеров

В настоящее время конфигурация ACME DNS поддерживает лишь несколько популярных DNS-провайдеров. Ниже приведены примеры конфигурации для каждого из них.

> Примечание: В следующей документации перечислены только параметры конфигурации для каждого DNS-провайдера. Из-за ограниченных ресурсов разработки значения, которые следует указать для параметров конфигурации, пользователь должен определить самостоятельно. Мы протестировали только конфигурацию Cloudflare.

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

### Name.com

```yaml
acme:
  domains:
    - "*.example.com"
  email: your@email.address
  type: dns
  dns:
    name: namedotcom
    config:
      namedotcom_token: Dxabckw9dB_jYBdi89kgyaS8wRjqqSsd679urScKOBP
      namedotcom_user: user
      namedotcom_server: api.name.com
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
