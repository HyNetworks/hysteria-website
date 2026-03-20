# تست سرعت

Hysteria (از نسخهٔ ۲.۳.۰) ابزار داخلی تست سرعت دارد که به کلاینت اجازه می‌دهد سرعت دانلود و آپلود را نسبت به سرور بسنجد، به‌شرطی که [در پیکربندی سرور پشتیبانی تست سرعت فعال باشد](Full-Server-Config.md#speed-test).

=== "پیکربندی پیش‌فرض (config.yaml)"

    ```bash
    ./hysteria-linux-amd64-avx speedtest
    ```

=== "نام فایل دلخواه"

    ```bash
    ./hysteria-linux-amd64-avx speedtest -c whatever.yaml
    ```

> **توجه:** تست سرعت مثل حالت پروکسی عادی به تنظیمات پهنای باند در پیکربندی شما پایبند است. اگر از کنترل ازدحام Brutal استفاده می‌کنید، حداکثر پهنای باند را برای شما کاوش نمی‌کند.

به‌طور پیش‌فرض از **حالت زمانی** استفاده می‌شود: دانلود و آپلود هر کدام ۱۰ ثانیه. با مشخص کردن `--data-size` می‌توانید به **حالت حجمی** بروید که به‌جای آن، تعداد ثابتی بایت منتقل می‌شود.

```
Usage:
  hysteria speedtest [flags]

Flags:
      --data-size uint32    Data size in bytes (switches to size-based mode when set)
      --duration duration   Duration for each direction in time-based mode (default 10s)
  -h, --help                help for speedtest
      --skip-download       Skip download test
      --skip-upload         Skip upload test
      --use-bytes           Use bytes per second instead of bits per second
```

مثال‌ها:

```bash
# Default: time-based, 10s each direction
./hysteria speedtest

# Time-based with custom duration
./hysteria speedtest --duration 30s

# Size-based: transfer 200 MB each direction
./hysteria speedtest --data-size 209715200
```

اتصال‌های تست سرعت درون سرور پردازش می‌شوند و بنابراین تحت تأثیر چیزهایی مثل ACL و outbounds قرار نمی‌گیرند؛ با این حال ترافیک تولیدشدهٔ تست سرعت همچنان در آمار ترافیک همان کاربر حساب می‌شود.
