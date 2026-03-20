# تنظیم TPROXY

TPROXY چارچوبی برای پروکسی شفاف است که فقط روی لینوکس در دسترس است و هم TCP و هم UDP را پشتیبانی می‌کند.

## جلوگیری از حلقه‌های ترافیک

> اگر نیازی ندارید ترافیک خودِ دستگاهی که کلاینت Hysteria روی آن اجرا می‌شود را پروکسی کنید، این بخش را رد کنید.

در سناریوهایی که باید ترافیک خودِ دستگاه پروکسی شود، برای جلوگیری از حلقهٔ ترافیک با Hysteria باید ترافیک خودِ کلاینت Hysteria را از ترافیکی که پروکسی می‌شود جدا کنید. بهترین روش این است که کلاینت Hysteria را با یک کاربر اختصاصی اجرا کنید و سپس در iptables یا nftables تطبیق بر اساس کاربر انجام دهید.

> هنگام استفاده از اسکریپت‌های نصب یک‌کلیکی و بسته‌های توزیع‌های لینوکسی هم توصیه می‌کنیم Hysteria را با کاربر اختصاصی اجرا کنید و طبق این بخش پیکربندی کنید.

1.  یک کاربر اختصاصی فقط برای اجرای کلاینت Hysteria بسازید.

    ```bash
    useradd --system hysteria
    ```

2.  [`capabilities(7)`](https://man7.org/linux/man-pages/man7/capabilities.7.html) لازم را به کلاینت Hysteria بدهید تا عادی کار کند.

    ```bash
    setcap CAP_NET_ADMIN,CAP_NET_BIND_SERVICE+ep /path/to/hysteria # (1)!
    ```

    1. به‌جای آن مسیر واقعی نصب Hysteria را بگذارید.

    این مرحله را هر بار که کلاینت Hysteria را به‌صورت دستی به‌روزرسانی می‌کنید باید انجام دهید.

3.  کلاینت Hysteria را طوری پیکربندی کنید که با این کاربر اختصاصی اجرا شود.

    اگر کلاینت Hysteria را دستی اجرا می‌کنید:

    ```bash
    sudo -u hysteria /path/to/hysteria -c config.yaml
    ```

    یا اگر با systemd سرویس Hysteria را مدیریت می‌کنید، می‌توانید در پیکربندی systemd سرویس، زیر بخش `[Service]` مقدار `User=hysteria` را اضافه کنید.

## پیکربندی کلاینت

> در مثال‌های بعد از `2500` به‌عنوان پورت گوش‌دادن TProxy استفاده می‌کنیم. در صورت تمایل می‌توانید پورت دیگری بگذارید.

این خطوط را به پیکربندی کلاینت اضافه کنید:

=== "پروکسی هم‌زمان TCP و UDP"

    ```yaml
    tcpTProxy:
        listen: :2500 # (1)!

    udpTProxy:
        listen: :2500
    ```

    1. اگر به پشتیبانی هم‌زمان IPv4 و IPv6 نیاز دارید، قبل از `:` آدرس IP نگذارید.

=== "فقط پروکسی TCP"

    ```yaml
    tcpTProxy:
        listen: :2500 # (1)!
    ```

    1. اگر به پشتیبانی هم‌زمان IPv4 و IPv6 نیاز دارید، قبل از `:` آدرس IP نگذارید.

## پیکربندی قوانین مسیریابی

این مرحله **اختیاری نیست**. آن را رد نکنید؛ در غیر این صورت TProxy کار نمی‌کند.

> مگر اینکه این دستورات را پایدار کنید، باید هر بار که سیستم بالا می‌آید اجرا شوند.

> در مثال‌های زیر از `0x1` به‌عنوان fwmark برای قوانین مسیریابی سیاست TProxy و از `100` به‌عنوان شناسهٔ جدول (Table ID) جدول مسیریابی TProxy استفاده می‌کنیم. در صورت تمایل می‌توانید مقادیر دیگری انتخاب کنید.

```bash
# IPv4
ip rule add fwmark 0x1 lookup 100
ip route add local default dev lo table 100

# IPv6
ip -6 rule add fwmark 0x1 lookup 100
ip -6 route add local default dev lo table 100
```

## پیکربندی iptables یا nftables

> مگر اینکه این دستورات را پایدار کنید، باید هر بار که سیستم بالا می‌آید اجرا شوند.

=== "iptables (IPv4)"

    ```bash
    iptables -t mangle -N HYSTERIA

    # Skip traffic already handled by TProxy (1)
    iptables -t mangle -A HYSTERIA -p tcp -m socket --transparent -j MARK --set-mark 0x1
    iptables -t mangle -A HYSTERIA -p udp -m socket --transparent -j MARK --set-mark 0x1
    iptables -t mangle -A HYSTERIA -m socket -j RETURN

    # Skip private and special IPv4 addresses (3)
    iptables -t mangle -A HYSTERIA -d 0.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA -d 10.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA -d 127.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA -d 169.254.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA -d 172.16.0.0/12 -j RETURN
    iptables -t mangle -A HYSTERIA -d 192.168.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA -d 224.0.0.0/4 -j RETURN
    iptables -t mangle -A HYSTERIA -d 240.0.0.0/4 -j RETURN

    # Redirect traffic to the TProxy port
    iptables -t mangle -A HYSTERIA -p tcp -j TPROXY --on-port 2500 --on-ip 127.0.0.1 --tproxy-mark 0x1
    iptables -t mangle -A HYSTERIA -p udp -j TPROXY --on-port 2500 --on-ip 127.0.0.1 --tproxy-mark 0x1 # (4)!

    # Enable the above rules
    iptables -t mangle -A PREROUTING -j HYSTERIA

    # === Proxy Local Traffic - Start === (2)

    iptables -t mangle -N HYSTERIA_MARK

    # Match user to prevent loops
    iptables -t mangle -A HYSTERIA_MARK -m owner --uid-owner hysteria -j RETURN

    # Skip LAN and special IPv4 addresses
    iptables -t mangle -A HYSTERIA_MARK -d 0.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 10.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 127.0.0.0/8 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 169.254.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 172.16.0.0/12 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 192.168.0.0/16 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 224.0.0.0/4 -j RETURN
    iptables -t mangle -A HYSTERIA_MARK -d 240.0.0.0/4 -j RETURN

    # Mark traffic to re-route it to PREROUTING
    iptables -t mangle -A HYSTERIA_MARK -p tcp -j MARK --set-mark 0x1
    iptables -t mangle -A HYSTERIA_MARK -p udp -j MARK --set-mark 0x1

    # Enable the above rules
    iptables -t mangle -A OUTPUT -j HYSTERIA_MARK

    # === Proxy Local Traffic - End ===
    ```

    1. اگر رابط پیش‌فرض مسیریابی آدرس IPv4 عمومی از سمت ISP دارد، حذف این قوانین باعث رفتار غیرعادی پروکسی برای ترافیک محلی می‌شود.

    2. قوانین بعدی قوانین **اضافی** برای پروکسی کردن ترافیک محلی هستند. قوانین قبل از این خط حتی اگر فقط ترافیک محلی را پروکسی کنید هم اجباری‌اند. اگر فقط ترافیک داخل شبکهٔ محلی را می‌خواهید پروکسی کنید، می‌توانید قوانین بعد از این خط را رد کنید.

    3. هنگام پروکسی ترافیک محلی (فعال کردن قوانین زنجیرهٔ OUTPUT)، اگر باید از طریق آدرس IPv4 عمومی که ISP به این روتر داده به آن دسترسی داشته باشید، به قوانین اضافی نیاز است.

    4. اگر نیازی به پروکسی UDP ندارید، همهٔ قوانینی که `-p udp` دارند را حذف کنید.

=== "iptables (IPv6)"

    ```bash
    ip6tables -t mangle -N HYSTERIA

    # Skip traffic already handled by TProxy (1)
    ip6tables -t mangle -A HYSTERIA -p tcp -m socket --transparent -j MARK --set-mark 0x1
    ip6tables -t mangle -A HYSTERIA -p udp -m socket --transparent -j MARK --set-mark 0x1
    ip6tables -t mangle -A HYSTERIA -m socket -j RETURN

    # Only proxy public IPv6 addresses (3)
    ip6tables -t mangle -A HYSTERIA ! -d 2000::/3 -j RETURN

    # Redirect traffic to the TProxy port
    ip6tables -t mangle -A HYSTERIA -p tcp -j TPROXY --on-port 2500 --on-ip ::1 --tproxy-mark 0x1
    ip6tables -t mangle -A HYSTERIA -p udp -j TPROXY --on-port 2500 --on-ip ::1 --tproxy-mark 0x1 # (4)!

    # Enable the above rules
    ip6tables -t mangle -A PREROUTING -j HYSTERIA

    # === Proxy Local Traffic - Start === (2)

    ip6tables -t mangle -N HYSTERIA_MARK

    # Match user to prevent loops
    ip6tables -t mangle -A HYSTERIA_MARK -m owner --uid-owner hysteria -j RETURN

    # Only proxy public IPv6 addresses
    ip6tables -t mangle -A HYSTERIA_MARK ! -d 2000::/3 -j RETURN

    # Mark traffic to re-route it to PREROUTING
    ip6tables -t mangle -A HYSTERIA_MARK -p tcp -j MARK --set-mark 0x1
    ip6tables -t mangle -A HYSTERIA_MARK -p udp -j MARK --set-mark 0x1

    # Enable the above rules
    ip6tables -t mangle -A OUTPUT -j HYSTERIA_MARK

    # === Proxy Local Traffic - End ===
    ```

    1. اگر رابط پیش‌فرض مسیریابی آدرس IPv6 عمومی از سمت ISP دارد، حذف این قوانین باعث رفتار غیرعادی پروکسی برای ترافیک محلی می‌شود.

    2. قوانین بعدی قوانین **اضافی** برای پروکسی کردن ترافیک محلی هستند. قوانین قبل از این خط حتی اگر فقط ترافیک محلی را پروکسی کنید هم اجباری‌اند. اگر فقط ترافیک داخل شبکهٔ محلی را می‌خواهید پروکسی کنید، می‌توانید قوانین بعد از این خط را رد کنید.

    3. هنگام پروکسی ترافیک محلی (فعال کردن قوانین زنجیرهٔ OUTPUT)، اگر باید از طریق آدرس IPv6 عمومی که ISP به این روتر داده به آن دسترسی داشته باشید، به قوانین اضافی نیاز است.

    4. اگر نیازی به پروکسی UDP ندارید، همهٔ قوانینی که `-p udp` دارند را حذف کنید.

=== "nftables"

    ```nginx
    define TPROXY_MARK=0x1
    define HYSTERIA_USER=hysteria
    define HYSTERIA_TPROXY_PORT=2500

    # Protocols to proxy (4)
    define TPROXY_L4PROTO={ tcp, udp }

    # Bypass addresses (3)
    define BYPASS_IPV4={
        0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16,
        172.16.0.0/12, 192.168.0.0/16, 224.0.0.0/3
    }
    define BYPASS_IPV6={ ::/128 }

    table inet hysteria_tproxy {
      chain prerouting {
        type filter hook prerouting priority mangle; policy accept;

        # Bypass traffic already handled by TProxy (1)
        meta l4proto $TPROXY_L4PROTO socket transparent 1 counter mark set $TPROXY_MARK
        socket transparent 0 socket wildcard 0 counter return

        # Bypass private and special IP addresses
        ip daddr $BYPASS_IPV4 counter return
        ip6 daddr $BYPASS_IPV6 counter return

        # Only proxy public IPv6 addresses
        ip6 daddr != 2000::/3 counter return

        # Redirect traffic to the TProxy port
        meta l4proto $TPROXY_L4PROTO counter tproxy to :$HYSTERIA_TPROXY_PORT meta mark set $TPROXY_MARK accept
      }
    }

    # Proxy local traffic (2)
    table inet hysteria_tproxy_local {
      chain output {
        type route hook output priority mangle; policy accept;

        # Match user to prevent loops
        meta skuid $HYSTERIA_USER counter return

        # Bypass private and special IP addresses
        ip daddr $BYPASS_IPV4 counter return
        ip6 daddr $BYPASS_IPV6 counter return

        # Only proxy public IPv6 addresses
        ip6 daddr != 2000::/3 counter return

        # Redirect OUTPUT traffic to PREROUTING
        meta l4proto $TPROXY_L4PROTO counter meta mark set $TPROXY_MARK
      }
    }
    ```

    1. اگر رابط پیش‌فرض مسیریابی آدرس IP عمومی دارد، حذف این قوانین باعث رفتار نادرست پروکسی برای ترافیک محلی می‌شود.

    2. جدول بعدی جدول **اضافی** برای پروکسی ترافیک محلی است. جدول قبلی حتی اگر فقط ترافیک محلی را پروکسی کنید هم اجباری است. اگر فقط ترافیک داخل شبکه (نه خود دستگاه) را می‌خواهید پروکسی کنید، می‌توانید این جدول را رد کنید.

    3. هنگام پروکسی ترافیک محلی (داشتن قوانین زنجیرهٔ OUTPUT)، اگر هنوز باید از طریق آدرس IP عمومی که ISP داده به این روتر دسترسی داشته باشید، آن آدرس را به فهرست دور زدن اضافه کنید.

    4. اگر نمی‌خواهید ترافیک UDP پروکسی شود، خط زیر را به `define TPROXY_L4PROTO=tcp` تغییر دهید.

## منابع

- [راهنمای XRay — پروکسی شفاف TProxy](https://xtls.github.io/document/level-2/tproxy_ipv4_and_ipv6.html)
- [راهنمای XRay — دور زدن ترافیک XRay با gid در پروکسی شفاف](https://xtls.github.io/document/level-2/iptables_gid.html)
- [راهنمای سادهٔ V2Ray — پروکسی شفاف (TProxy)](https://guide.v2fly.org/app/tproxy.html)
