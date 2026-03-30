# اسکریپت نصب سرور

ما یک اسکریپت bash ارائه می‌دهیم که می‌تواند Hysteria و سرویس systemd آن را در توزیع‌های رایج لینوکس مدیریت کند (نصب، به‌روزرسانی، حذف).

> **توجه:** این اسکریپت رسمی هدفش دستیابی به اثری مشابه مدیر بسته‌هاست و فقط فایل‌های پیکربندی نمونه تولید می‌کند.
> [پیکربندی دستی سرور](./Server.md) همچنان برای شروع صحیح سرویس لازم است.
>
> اگر به اسکریپتی نیاز دارید که بدون دردسر Hysteria را نصب، پیکربندی و راه‌اندازی کند، لطفاً «اسکریپت‌های Hysteria 2» شخص ثالث را در موتورهای جستجو پیدا کنید.

## پیش‌نیازهای محیط

خود Hysteria نیاز خاصی به توزیع لینوکس ندارد،
اما اسکریپت برای سیستم‌هایی طراحی شده که شرایط زیر را داشته باشند:

- مدیریت سرویس‌ها بر اساس systemd (از طریق دستور `systemctl`)
- برنامه‌های زیر نصب شده باشند و توسط busybox ارائه نشده باشند:
  - [ابزارهای GNU Coreutils](https://en.wikipedia.org/wiki/GNU_Core_Utilities)
  - `bash`
  - `grep`
  - `curl`

برای کاربران جدید VPS، لطفاً از نسخه‌های پایدار توزیع‌های اصلی منتشرشده در ۲ سال اخیر استفاده کنید. **از استفاده CentOS 7 خودداری کنید**.

اگر با توزیع‌های لینوکس آشنا نیستید، گزینه‌های زیر را پیشنهاد می‌کنیم:

- Debian 11 یا بالاتر
- Ubuntu 22.04 LTS یا نسخه‌های LTS جدیدتر
- Rocky Linux 8 یا بالاتر
- CentOS Stream 8 یا بالاتر
- Fedora 37 یا بالاتر

توزیع‌های **پشتیبانی‌نشده**:

- OpenWrt
- Alpine Linux
- NixOS

## عملیات رایج

### نصب یا به‌روزرسانی

نصب یا به‌روزرسانی به آخرین نسخه.

```sh
bash <(curl -fsSL https://get.hy2.sh/)
```

نصب یا به‌روزرسانی به نسخه مشخص.

```sh
bash <(curl -fsSL https://get.hy2.sh/) --version v2.8.0
```

### حذف

حذف Hysteria و سرویس آن.

```sh
bash <(curl -fsSL https://get.hy2.sh/) --remove
```

## پیشرفته

### نصب از فایل محلی

اگر VPS شما نمی‌تواند به GitHub Release متصل شود، می‌توانید فایل اجرایی Hysteria را به‌صورت دستی به VPS منتقل کنید.

```sh
bash <(curl -fsSL https://get.hy2.sh/) --local /path/to/hysteria-linux-amd64
```

### تعیین معماری

عمدتاً برای نصب نسخه AVX.

```sh
ARCHITECTURE=amd64-avx bash <(curl -fsSL https://get.hy2.sh/)
```

### تعیین کاربر

اگر می‌خواهید از مشکلات مجوز دسترسی اجتناب کنید (معمولاً به دلیل استفاده از برنامه‌های دیگر برای تولید و مدیریت گواهی‌نامه‌ها)، می‌توانید سرویس systemd Hysteria را برای اجرا با root پیکربندی کنید.

```sh
HYSTERIA_USER=root bash <(curl -fsSL https://get.hy2.sh/)
```

برای بازنشانی این تنظیم، می‌توانید Hysteria را حذف و دوباره نصب کنید، یا دستور زیر را اجرا کنید.

```sh
HYSTERIA_USER=hysteria bash <(curl -fsSL https://get.hy2.sh/)
```

## متفرقه

### ویرایش فایل پیکربندی

```sh
nano /etc/hysteria/config.yaml
```

### مدیریت سرویس

فعال‌سازی سرویس در هنگام بوت و شروع فوری آن.

```sh
systemctl enable --now hysteria-server.service
```

ری‌استارت سرویس، معمولاً پس از تغییر فایل پیکربندی.

```sh
systemctl restart hysteria-server.service
```

بررسی وضعیت سرویس.

```sh
systemctl status hysteria-server.service
```

### لاگ‌ها

مشاهده لاگ‌های سرور.

```sh
journalctl --no-pager -e -u hysteria-server.service
```
