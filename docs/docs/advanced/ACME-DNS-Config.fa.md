# پیکربندی ACME DNS

ACME DNS می‌تواند گواهی‌ها را از طریق API ارائه‌دهندهٔ سرویس DNS دریافت کند. این قابلیت به پورت‌های مشخصی وابسته نیست (پورت‌های ۸۰/۴۴۳ را اشغال نمی‌کند) و به دسترسی خارجی نیاز ندارد.

## پشتیبانی از ارائه‌دهندگان سرویس

در حال حاضر، پیکربندی ACME DNS تنها چند ارائه‌دهندهٔ DNS رایج را پشتیبانی می‌کند؛ نمونهٔ پیکربندی برای هر کدام در ادامه آمده است.

> توجه: در مستندات زیر فقط گزینه‌های پیکربندی برای هر ارائه‌دهندهٔ DNS فهرست شده است. با توجه به محدودیت منابع توسعه، مقدارهایی که باید در گزینه‌های پیکربندی قرار گیرد را باید خود کاربر بررسی کند؛ ما تنها پیکربندی Cloudflare را آزمایش کرده‌ایم.

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

## مدیریت چندین دامنه

در حال حاضر ACME DNS طوری پیکربندی شده که برای همهٔ دامنه‌های موجود در `domains` کار کند؛ یعنی **اگر از ACME DNS برای درخواست گواهی استفاده می‌کنید، مطمئن شوید همهٔ دامنه‌های موجود در `domains` از یک ارائه‌دهندهٔ سرویس نام دامنه استفاده می‌کنند.**

## ارائه‌دهندگان پشتیبانی‌نشده

اگر از ارائه‌دهندهٔ DNS استفاده می‌کنید که در حال حاضر پشتیبانی نمی‌شود، همچنان می‌توانید سرورهای DNS مدیریت دامنهٔ خود را به سمت یک ارائه‌دهندهٔ پشتیبانی‌شده—مثلاً Cloudflare—اشاره دهید؛ یعنی: **می‌توانید نام دامنه را از ارائه‌دهندهٔ A بخرید و از طریق ارائه‌دهندهٔ B مدیریت کنید و همچنان از قابلیت ACME DNS استفاده کنید.**
