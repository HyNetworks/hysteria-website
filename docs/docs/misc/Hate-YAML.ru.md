# Не нравится YAML?

Несмотря на то что наша документация использует YAML, Hysteria полностью поддерживает также JSON и TOML.

## Примеры

=== "config.json"

    ```json
    {
      "server": "your.server.net",
      "auth": "i_still_love_jason",
      "bandwidth": {
        "up": "30 mbps",
        "down": "100 mbps"
      },
      "fastOpen": true,
      "lazy": true,
      "socks5": {
        "listen": "127.0.0.1:1080"
      },
      "http": {
        "listen": "127.0.0.1:8080"
      }
    }
    ```

=== "config.toml"

    ```toml
    server = "your.server.net"
    auth = "i_still_love_tom"
    fastOpen = true
    lazy = true

    [bandwidth]
    up = "30 mbps"
    down = "100 mbps"

    [socks5]
    listen = "127.0.0.1:1080"

    [http]
    listen = "127.0.0.1:8080"
    ```

Убедитесь, что расширение файла соответствует используемому формату. Запустите клиент следующей командой:

```bash
./hysteria-linux-amd64-avx -c config.json
# или
./hysteria-linux-amd64-avx -c config.toml
```

## Конвертация

Если у вас уже есть конфигурационный файл YAML, вы можете преобразовать его в JSON с помощью `yq` (https://github.com/mikefarah/yq):

```bash
yq config.yaml -o json > config.json
```

Также есть онлайн-сервисы:

- YAML в JSON: https://www.convertsimple.com/convert-yaml-to-json/
- YAML в TOML: https://www.convertsimple.com/convert-yaml-to-toml/
