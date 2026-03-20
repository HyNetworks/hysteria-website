# Настройка TPROXY

TPROXY — это фреймворк прозрачного проксирования, доступный только в Linux, поддерживающий протоколы TCP и UDP.

## Избегание петель

> Пропустите этот раздел, если вам не нужно проксировать трафик с самого устройства, на котором запущен клиент Hysteria.

В сценариях, когда собственный трафик устройства необходимо проксировать, для избежания петель трафика с Hysteria важно отделить собственный трафик клиента Hysteria от проксируемого трафика. Лучший способ — запустить клиент Hysteria от имени отдельного пользователя и затем выполнить сопоставление по пользователю в iptables или nftables.

> Мы также рекомендуем запускать Hysteria от имени отдельного пользователя при использовании скриптов установки в один клик и пакетов дистрибутивов Linux, и настраивать его в соответствии с этим разделом.

1.  Создайте отдельного пользователя специально для запуска клиента Hysteria.

    ```bash
    useradd --system hysteria
    ```

2.  Предоставьте необходимые [`capabilities(7)`](https://man7.org/linux/man-pages/man7/capabilities.7.html) для нормальной работы клиента Hysteria.

    ```bash
    setcap CAP_NET_ADMIN,CAP_NET_BIND_SERVICE+ep /path/to/hysteria # (1)!
    ```

    1. Замените на фактический путь установки Hysteria.

    Этот шаг необходимо выполнять каждый раз при ручном обновлении клиента Hysteria.

3.  Настройте клиент Hysteria для запуска от имени этого пользователя.

    При ручном запуске клиента Hysteria:

    ```bash
    sudo -u hysteria /path/to/hysteria -c config.yaml
    ```

    Если вы используете systemd для управления сервисом Hysteria, добавьте `User=hysteria` в секцию `[Service]` конфигурации systemd для сервиса.

## Настройка клиента

> В следующих примерах мы используем `2500` в качестве порта прослушивания для TProxy. При желании используйте другой порт.

Добавьте следующие строки в конфигурацию клиента:

=== "Проксирование TCP и UDP"

    ```yaml
    tcpTProxy:
        listen: :2500 # (1)!

    udpTProxy:
        listen: :2500
    ```

    1. Если вам нужна поддержка IPv4 и IPv6, не добавляйте IP-адрес перед `:`.

=== "Только TCP"

    ```yaml
    tcpTProxy:
        listen: :2500 # (1)!
    ```

    1. Если вам нужна поддержка IPv4 и IPv6, не добавляйте IP-адрес перед `:`.

## Настройка правил маршрутизации

Этот шаг **обязателен**. Не пропускайте его, иначе TProxy не будет работать.

> Эти команды необходимо выполнять при каждой загрузке системы, если вы не сделаете их постоянными.

> В следующих примерах мы используем `0x1` как fwmark для правил маршрутизации TProxy и `100` как Table ID для таблицы маршрутизации TProxy. При желании используйте другие значения.

```bash
# IPv4
ip rule add fwmark 0x1 lookup 100
ip route add local default dev lo table 100

# IPv6
ip -6 rule add fwmark 0x1 lookup 100
ip -6 route add local default dev lo table 100
```

## Настройка iptables или nftables

> Эти команды необходимо выполнять при каждой загрузке системы, если вы не сделаете их постоянными.

=== "iptables (IPv4)"

    ```bash
    iptables -t mangle -N HYSTERIA

    # Пропустить трафик, уже обработанный TProxy (1)
    iptables -t mangle -A HYSTERIA -p tcp -m socket --transparent -j MARK --set-mark 0x1
    iptables -t mangle -A HYSTERIA -p udp -m socket --transparent -j MARK --set-mark 0x1
    iptables -t mangle -A HYSTERIA -m socket -j RETURN

    # Пропустить приватные и специальные IPv4-адреса (3)
    iptables -t mangle -A HYSTERIA -d 0.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA -d 10.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA -d 127.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA -d 169.254.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA -d 172.16.0.0/12 -j RETURN
    iptables -t mangle -A HYSTERIA -d 192.168.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA -d 224.0.0.0/4 -j RETURN
    iptables -t mangle -A HYSTERIA -d 240.0.0.0/4 -j RETURN

    # Перенаправить трафик на порт TProxy
    iptables -t mangle -A HYSTERIA -p tcp -j TPROXY --on-port 2500 --on-ip 127.0.0.1 --tproxy-mark 0x1
    iptables -t mangle -A HYSTERIA -p udp -j TPROXY --on-port 2500 --on-ip 127.0.0.1 --tproxy-mark 0x1 # (4)!

    # Активировать вышеуказанные правила
    iptables -t mangle -A PREROUTING -j HYSTERIA

    # === Проксирование локального трафика - Начало === (2)

    iptables -t mangle -N HYSTERIA_MARK

    # Сопоставление по пользователю для предотвращения петель
    iptables -t mangle -A HYSTERIA_MARK -m owner --uid-owner hysteria -j RETURN

    # Пропустить LAN и специальные IPv4-адреса
    iptables -t mangle -A HYSTERIA_MARK -d 0.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 10.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 127.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 169.254.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 172.16.0.0/12 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 192.168.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 224.0.0.0/4 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 240.0.0.0/4 -j RETURN

    # Пометить трафик для перенаправления в PREROUTING
    iptables -t mangle -A HYSTERIA_MARK -p tcp -j MARK --set-mark 0x1
    iptables -t mangle -A HYSTERIA_MARK -p udp -j MARK --set-mark 0x1

    # Активировать вышеуказанные правила
    iptables -t mangle -A OUTPUT -j HYSTERIA_MARK

    # === Проксирование локального трафика - Конец ===
    ```

    1. Если интерфейс маршрута по умолчанию имеет публичный IPv4-адрес, назначенный провайдером, пропуск этих правил приведёт к некорректному проксированию локального трафика.

    2. Следующие правила — **дополнительные** правила для настройки проксирования локального трафика. Правила до этой строки обязательны, даже если вам нужно проксировать только локальный трафик. Если вам нужно проксировать только трафик внутри локальной сети, можно пропустить правила после этой строки.

    3. При проксировании локального трафика (включение правил OUTPUT chain) необходимы дополнительные правила, если вам нужен доступ к этому маршрутизатору по публичному IPv4-адресу, назначенному провайдером.

    4. Если вам не нужно проксировать UDP-трафик, можно удалить все правила, содержащие `-p udp`.

=== "iptables (IPv6)"

    ```bash
    ip6tables -t mangle -N HYSTERIA

    # Пропустить трафик, уже обработанный TProxy (1)
    ip6tables -t mangle -A HYSTERIA -p tcp -m socket --transparent -j MARK --set-mark 0x1
    ip6tables -t mangle -A HYSTERIA -p udp -m socket --transparent -j MARK --set-mark 0x1
    ip6tables -t mangle -A HYSTERIA -m socket -j RETURN

    # Проксировать только публичные IPv6-адреса (3)
    ip6tables -t mangle -A HYSTERIA ! -d 2000::/3 -j RETURN

    # Перенаправить трафик на порт TProxy
    ip6tables -t mangle -A HYSTERIA -p tcp -j TPROXY --on-port 2500 --on-ip ::1 --tproxy-mark 0x1
    ip6tables -t mangle -A HYSTERIA -p udp -j TPROXY --on-port 2500 --on-ip ::1 --tproxy-mark 0x1 # (4)!

    # Активировать вышеуказанные правила
    ip6tables -t mangle -A PREROUTING -j HYSTERIA

    # === Проксирование локального трафика - Начало === (2)

    ip6tables -t mangle -N HYSTERIA_MARK

    # Сопоставление по пользователю для предотвращения петель
    ip6tables -t mangle -A HYSTERIA_MARK -m owner --uid-owner hysteria -j RETURN

    # Проксировать только публичные IPv6-адреса
    ip6tables -t mangle -A HYSTERIA_MARK ! -d 2000::/3 -j RETURN

    # Пометить трафик для перенаправления в PREROUTING
    ip6tables -t mangle -A HYSTERIA_MARK -p tcp -j MARK --set-mark 0x1
    ip6tables -t mangle -A HYSTERIA_MARK -p udp -j MARK --set-mark 0x1

    # Активировать вышеуказанные правила
    ip6tables -t mangle -A OUTPUT -j HYSTERIA_MARK

    # === Проксирование локального трафика - Конец ===
    ```

    1. Если интерфейс маршрута по умолчанию имеет публичный IPv6-адрес, назначенный провайдером, пропуск этих правил приведёт к некорректному проксированию локального трафика.

    2. Следующие правила — **дополнительные** правила для настройки проксирования локального трафика. Правила до этой строки обязательны, даже если вам нужно проксировать только локальный трафик. Если вам нужно проксировать только трафик внутри локальной сети, можно пропустить правила после этой строки.

    3. При проксировании локального трафика (включение правил OUTPUT chain) необходимы дополнительные правила, если вам нужен доступ к этому маршрутизатору по публичному IPv6-адресу, назначенному провайдером.

    4. Если вам не нужно проксировать UDP-трафик, можно удалить все правила, содержащие `-p udp`.

=== "nftables"

    ```nginx
    define TPROXY_MARK=0x1
    define HYSTERIA_USER=hysteria
    define HYSTERIA_TPROXY_PORT=2500

    # Протоколы для проксирования (4)
    define TPROXY_L4PROTO={ tcp, udp }

    # Адреса для обхода (3)
    define BYPASS_IPV4={
        0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16,
        172.16.0.0/12, 192.168.0.0/16, 224.0.0.0/3
    }
    define BYPASS_IPV6={ ::/128 }

    table inet hysteria_tproxy {
      chain prerouting {
        type filter hook prerouting priority mangle; policy accept;

        # Обход трафика, уже обработанного TProxy (1)
        meta l4proto $TPROXY_L4PROTO socket transparent 1 counter mark set $TPROXY_MARK
        socket transparent 0 socket wildcard 0 counter return

        # Обход приватных и специальных IP-адресов
        ip daddr $BYPASS_IPV4 counter return
        ip6 daddr $BYPASS_IPV6 counter return

        # Проксировать только публичные IPv6-адреса
        ip6 daddr != 2000::/3 counter return

        # Перенаправить трафик на порт TProxy
        meta l4proto $TPROXY_L4PROTO counter tproxy to :$HYSTERIA_TPROXY_PORT meta mark set $TPROXY_MARK accept
      }
    }

    # Проксирование локального трафика (2)
    table inet hysteria_tproxy_local {
      chain output {
        type route hook output priority mangle; policy accept;

        # Сопоставление по пользователю для предотвращения петель
        meta skuid $HYSTERIA_USER counter return

        # Обход приватных и специальных IP-адресов
        ip daddr $BYPASS_IPV4 counter return
        ip6 daddr $BYPASS_IPV6 counter return

        # Проксировать только публичные IPv6-адреса
        ip6 daddr != 2000::/3 counter return

        # Перенаправить трафик OUTPUT в PREROUTING
        meta l4proto $TPROXY_L4PROTO counter meta mark set $TPROXY_MARK
      }
    }
    ```

    1. Если интерфейс маршрута по умолчанию имеет публичный IP-адрес, пропуск этих правил приведёт к некорректному проксированию локального трафика.

    2. Следующая таблица — **дополнительная** таблица для проксирования локального трафика. Предыдущая таблица обязательна, даже если вам нужно проксировать только локальный трафик. Если вам нужно проксировать только трафик внутри сети (но не самого устройства), можно пропустить эту таблицу.

    3. При проксировании локального трафика (наличие правил OUTPUT chain), если вам нужен доступ к этому маршрутизатору по публичному IP-адресу, назначенному провайдером, добавьте IP-адрес в список обхода.

    4. Если вам не нужно проксировать UDP-трафик, измените строку ниже на `define TPROXY_L4PROTO=tcp`.

## Ссылки

- [Руководство XRay — Прозрачный прокси TProxy](https://xtls.github.io/document/level-2/tproxy_ipv4_and_ipv6.html)
- [Руководство XRay — Обход трафика XRay через gid с прозрачным прокси](https://xtls.github.io/document/level-2/iptables_gid.html)
- [Руководство V2Ray — Прозрачный прокси (TProxy)](https://guide.v2fly.org/app/tproxy.html)
