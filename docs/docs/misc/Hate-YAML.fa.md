# اگر از YAML خوشم نمی‌آید؟

با اینکه مستندات ما از YAML استفاده می‌کند، Hysteria به طور کامل از JSON و TOML نیز پشتیبانی می‌کند.

## مثال‌ها

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

مطمئن شوید که پسوند فایل با فرمتی که استفاده می‌کنید مطابقت دارد. کلاینت را با دستور زیر اجرا کنید:

```bash
./hysteria-linux-amd64-avx -c config.json
# یا
./hysteria-linux-amd64-avx -c config.toml
```

## تبدیل

اگر قبلاً یک فایل پیکربندی YAML دارید، می‌توانید آن را با استفاده از `yq` (https://github.com/mikefarah/yq) به JSON تبدیل کنید:

```bash
yq config.yaml -o json > config.json
```

همچنین وب‌سایت‌هایی برای تبدیل وجود دارند:

- YAML به JSON: https://www.convertsimple.com/convert-yaml-to-json/
- YAML به TOML: https://www.convertsimple.com/convert-yaml-to-toml/
