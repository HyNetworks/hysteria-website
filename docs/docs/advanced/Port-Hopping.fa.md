# پرش پورت

کاربران در چین گاهی گزارش می‌دهند که ISPهایشان اتصال‌های UDP پایدار را مسدود یا محدود می‌کنند؛ اما این محدودیت‌ها اغلب فقط به همان پورتی که استفاده می‌شود اعمال می‌شود. «پرش پورت» می‌تواند برای چنین وضعیتی راه‌حل موقتی باشد.

## کلاینت

کلاینت Hysteria از قالب ویژهٔ آدرس چندپورته پشتیبانی می‌کند:

```python
example.com:1234,5678,9012 # (1)!
example.com:20000-50000 # (2)!
example.com:1234,5000-6000,7044,8000-9000 # (3)!
```

1. چند پورت جدا.
2. یک بازهٔ پورت.
3. ترکیب هر دو.

محدودیتی برای تعداد پورت‌هایی که مشخص می‌کنید وجود ندارد.

کلاینت برای اتصال اولیه یکی از پورت‌های مشخص‌شده را به‌صورت تصادفی انتخاب می‌کند و به‌طور دوره‌ای به پورت دیگری جابه‌جا می‌شود. گزینهٔ کنترل فاصلهٔ زمانی، `hopInterval` در بخش `transport` است:

```yaml
transport:
  udp:
    hopInterval: 30s # (1)!
```

1. مقدار پیش‌فرض `30s` است. حداقل باید `5s` باشد.

با فرض اینکه سرور روی همهٔ پورت‌هایی که گفتید در دسترس باشد، فرایند پرش برای لایه‌های بالاتر شفاف است و نباید باعث از دست رفتن داده یا قطع اتصال شود.

## سرور

سرور Hysteria پشتیبانی داخلی برای گوش دادن روی چند پورت ندارد، بنابراین نمی‌توانید همان قالب را به‌عنوان آدرس گوش‌دادن در سمت سرور استفاده کنید. **توصیه می‌کنیم با DNAT در iptables یا nftables پورت‌ها را به پورت گوش‌دادن سرور هدایت کنید.**

=== "iptables"

    ```bash
    # IPv4
    iptables -t nat -A PREROUTING -i eth0 -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
    # IPv6
    ip6tables -t nat -A PREROUTING -i eth0 -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
    ```

=== "nftables"

    ```nginx
    define INGRESS_INTERFACE="eth0"
    define PORT_RANGE=20000-50000
    define HYSTERIA_SERVER_PORT=443

    table inet hysteria_porthopping {
      chain prerouting {
        type nat hook prerouting priority dstnat; policy accept;
        iifname $INGRESS_INTERFACE udp dport $PORT_RANGE counter redirect to :$HYSTERIA_SERVER_PORT
      }
    }
    ```

در این مثال سرور روی پورت 443 گوش می‌دهد، اما کلاینت می‌تواند به هر پورتی در بازهٔ 20000–50000 وصل شود.
