# ACL

ACL که اغلب همراه با outbounds به کار می‌رود، یکی از قوی‌ترین امکانات سرور Hysteria است و به شما اجازه می‌دهد نحوهٔ رسیدگی به درخواست‌های کلاینت را سفارشی کنید. برای مثال می‌توانید با ACL بعضی آدرس‌ها را مسدود کنید یا برای وب‌سایت‌های مختلف از outbounds متفاوت استفاده کنید.

## نحو

یک قانون ACL معتبر باید در یکی از قالب‌های زیر باشد:

- `outbound(address)`
- `outbound(address, proto/port)`
- `outbound(address, proto/port, hijack_address)`
- `# این یک توضیح است`

### انواع آدرس

فیلد `address` می‌تواند یکی از موارد زیر باشد:

- یک آدرس IPv4/IPv6 تکی، مثلاً `1.1.1.1` یا `2606:4700:4700::1111`
- یک بازهٔ CIDR برای IPv4/IPv6، مثلاً `73.0.0.0/8` یا `2001:db8::/32`
- یک نام دامنه، مثلاً `example.com` (زیردامنه‌ها را شامل نمی‌شود)
- نام دامنه با کاراکتر جایگزین، مثلاً `*.example.com` یا `*.google.*`
- پسوند دامنه، مثلاً `suffix:example.com` (با `example.com` و همهٔ زیردامنه‌هایش مطابقت دارد)
- کد کشور GeoIP، مثلاً `geoip:cn` یا `geoip:us`
- دستهٔ GeoSite، مثلاً `geosite:netflix` یا `geosite:google` (ویژگی‌ها را پشتیبانی می‌کند، مثلاً `geosite:google@cn`)
- `all` — با همهٔ آدرس‌ها مطابقت دارد. معمولاً در انتها به‌عنوان قانون پیش‌فرض برای بقیه قرار می‌گیرد.

> برای دیدن دسته‌های موجود GeoSite، اینجا را ببینید:
>
> - https://github.com/Loyalsoldier/v2ray-rules-dat
> - https://github.com/v2fly/domain-list-community/tree/master/data

### پروتکل/پورت

- `tcp` یا `tcp/*` — همهٔ پورت‌های TCP
- `udp` یا `udp/*` — همهٔ پورت‌های UDP
- `tcp/80` — پورت TCP ۸۰
- `udp/53` — پورت UDP ۵۳
- `udp/20000-30000` — پورت‌های UDP از ۲۰۰۰۰ تا ۳۰۰۰۰
- `*/443` — پورت ۴۴۳ برای TCP و UDP
- `*`، `*/*` یا حذف‌شده — هر دو پروتکل و همهٔ پورت‌ها

### آدرس hijack

در صورت تعیین، اتصالی که با این قانون مطابقت دارد به آدرس مشخص‌شده هدایت (hijack) می‌شود. آدرس hijack باید یک آدرس IPv4/IPv6 باشد، نه نام دامنه.

## رفتار تطبیق

### تطبیق دامنه و IP

هنگام پردازش درخواست‌های مبتنی بر دامنه، Hysteria ابتدا دامنه را resolve می‌کند و سپس سعی می‌کند هم با قوانین دامنه و هم با قوانین IP تطبیق دهد. **یعنی قانونی که بر اساس آدرس IP است، برای همهٔ اتصالاتی که در نهایت به همان IP می‌رسند اعمال می‌شود، چه کلاینت درخواست را با IP داده باشد چه با نام دامنه.**

### ترتیب قوانین

تطبیق قوانین به‌صورت تضمین‌شده از بالا به پایین انجام می‌شود. اولین قانونی که با درخواست مطابقت دارد استفاده می‌شود. اگر هیچ قانونی مطابقت نداشته باشد، outbound پیش‌فرض (اولین مورد در فهرست outbounds) به کار می‌رود.

## outbounds داخلی

مگر اینکه در فهرست outbounds صریحاً بازنویسی شده باشند، Hysteria این outbounds داخلی را دارد:

- `direct` — outbound مستقیم با پیکربندی پیش‌فرض (`auto`، بدون bind)
- `reject` — رد کردن اتصال
- `default` — استفاده از اولین outbound در فهرست outbounds؛ اگر فهرست خالی باشد، معادل `direct` است

## مثال‌ها

فرض کنید فهرست outbounds زیر را داریم:

```yaml
outbounds:
  - name: v4_only
    type: direct
    direct:
      mode: 4
  - name: v6_only
    type: direct
    direct:
      mode: 6
  - name: some_proxy
    type: socks5
    socks5:
      addr: ohno.moe:1080
```

```python
# Use the v6_only outbound for Google
v6_only(suffix:google.com)

# Use the v4_only outbound for Twitter
v4_only(suffix:twitter.com)

# Use the some_proxy outbound for ipinfo.io
some_proxy(ipinfo.io)

# Non-English IDN domains are also supported
v6_only(战狼*.中国)

# Block QUIC protocol
reject(all, udp/443)

# Block SMTP protocol
reject(all, tcp/25)

# Block China and North Korea
reject(geoip:cn)
reject(geoip:kp)

# Block Facebook and Google Ads
reject(geosite:facebook)
reject(geosite:google@ads)

# Block some random ranges
reject(73.0.0.0/8)
reject(2601::/20)

# Hijack 8.8.8.8 to 1.1.1.1 and use default (first) outbound
default(8.8.8.8, *, 1.1.1.1)

# Hijack 8.8.4.4 to 1.1.1.1 and use default (first) outbound, but UDP 53 only
default(8.8.4.4, udp/53, 1.1.1.1)

# Direct all other connections
direct(all)
```

> **توجه:** ACL بدون outbounds سفارشی هم به‌طور کامل قابل استفاده است. outbounds داخلی همیشه در دسترس‌اند، حتی اگر فهرست outbound خالی باشد. در واقع یکی از رایج‌ترین کاربردهای ACL فقط مسدود کردن بعضی آدرس‌هاست:

```python
reject(geoip:cn)
reject(geosite:facebook)
reject(10.0.0.0/8)
reject(172.16.0.0/12)
reject(192.168.0.0/16)
reject(fc00::/7)
```
