# ACL

ACL که اغلب همراه با outbounds به کار می‌رود، یکی از قوی‌ترین امکانات سرور Hysteria است و به شما اجازه می‌دهد نحوهٔ رسیدگی به درخواست‌های کلاینت را سفارشی کنید. برای مثال می‌توانید با ACL بعضی آدرس‌ها را مسدود کنید، برای وب‌سایت‌های مختلف از outbounds متفاوت استفاده کنید، یا هر کاربر را از outbound جداگانه‌ای عبور دهید.

از نسخهٔ 2.14.0 به بعد، قوانین ACL به‌صورت عبارت (expression) نوشته می‌شوند و می‌توانند مقصد، پروتکل، آدرس کلاینت و شناسهٔ احراز هویت کلاینت را بررسی کنند. [نحو قدیمی](#legacy-syntax) نسخه‌های قبلی همچنان پشتیبانی می‌شود.

## قوانین { #rules }

قوانین در پیکربندی سرور زیر `acl.rules` قرار می‌گیرند:

```yaml
acl:
  rules:
    - outbound: some_proxy # (1)!
      match: auth.id == "alice" # (2)!
    - outbound: reject
      match: geoip("cn") || suffix("example.com")
    - outbound: default
      match: proto == "udp" && dst.port == 53 && cidr("8.8.8.8")
      hijack: 1.1.1.1 # (3)!
    - outbound: direct # (4)!
```

1. نام outbound که هنگام مطابقت قانون استفاده می‌شود. یکی از [outbounds](Full-Server-Config.md#_13) خودتان یا یکی از [outbounds داخلی](#built-in-outbounds). به بزرگی و کوچکی حروف حساس نیست.
2. اختیاری. یک [عبارت](#expressions) که تعیین می‌کند قانون با درخواست مطابقت دارد یا نه.
3. اختیاری. اتصال را به‌جای مقصد اصلی به این آدرس هدایت (hijack) می‌کند. باید یک آدرس IPv4/IPv6 باشد، نه نام دامنه. پورت تغییر نمی‌کند.
4. قانونی که `match` ندارد با همهٔ درخواست‌ها مطابقت دارد. معمولاً در انتها به‌عنوان قانون پیش‌فرض برای بقیه قرار می‌گیرد.

قوانین از بالا به پایین بررسی می‌شوند و اولین قانونی که با درخواست مطابقت دارد استفاده می‌شود. اگر هیچ قانونی مطابقت نداشته باشد، outbound پیش‌فرض (اولین مورد در فهرست outbounds) به کار می‌رود.

همچنین می‌توانید قوانین را در یک فایل جداگانه نگه دارید و `acl.rulesFile` را به آن اشاره دهید. این فایل همان فهرست را دارد، بدون کلیدهای `acl:` و `rules:`:

```yaml
- outbound: some_proxy
  match: auth.id == "alice"
- outbound: direct
```

## عبارت‌ها { #expressions }

`match` به [زبان expr](https://expr-lang.org/docs/language-definition) نوشته می‌شود. پرکاربردترین بخش‌های آن:

- مقایسه: `==`، `!=`، `<`، `<=`، `>`، `>=`
- منطق: `&&` (یا `and`)، `||` (یا `or`)، `!` (یا `not`) و پرانتز برای گروه‌بندی
- فهرست‌ها و بازه‌ها: `auth.id in ["alice", "bob"]`، `dst.port in 8000..8999`
- رشته‌ها: `startsWith`، `endsWith`، `contains` و `matches` برای عبارت‌های منظم، مثلاً `dst.host matches "^cdn[0-9]+"`

نتیجهٔ عبارت هر قانون باید `true` یا `false` باشد. توابع زمان مانند `now()` و `date()` در دسترس نیستند.

### متغیرها { #variables }

| متغیر | توضیح |
| --- | --- |
| `proto` | `"tcp"` یا `"udp"` |
| `dst.host` | میزبان درخواستی: نام دامنه (با حروف کوچک، بدون نقطهٔ پایانی) یا آدرس IP، همان‌طور که کلاینت فرستاده است. اگر [شناسایی پروتکل](Full-Server-Config.md#_12) فعال باشد و دامنه‌ای شناسایی شود، همان دامنه است. |
| `dst.port` | پورت درخواستی |
| `dst.ipv4`، `dst.ipv6` | آدرس‌های IPv4 و IPv6 که میزبان به آن‌ها resolve می‌شود ([تطبیق دامنه و IP](#domain-and-ip-matching) را ببینید). اگر آدرسی نباشد، رشتهٔ خالی است. |
| `auth.id` | شناسهٔ احراز هویت کلاینت. در احراز هویت `userpass` نام کاربری است. در احراز هویت `http` همان `id` است که سرور احراز هویت شما برمی‌گرداند، و در احراز هویت `command` خروجی دستور. در احراز هویت `password` همیشه `user` است. |
| `client.ip`، `client.port` | آدرس IP و پورتی که کلاینت از آن متصل می‌شود |

### توابع تطبیق { #matcher-functions }

| تابع | مطابقت با |
| --- | --- |
| `domain("example.com")` | دقیقاً یک نام دامنه (زیردامنه‌ها را شامل نمی‌شود). از کاراکتر جایگزین `*` پشتیبانی می‌کند، مثلاً `domain("*.example.com")` یا `domain("*.google.*")`. |
| `suffix("example.com")` | یک دامنه و همهٔ زیردامنه‌هایش: `example.com`، `www.example.com` و غیره |
| `cidr("10.0.0.0/8")` | یک بازهٔ CIDR برای IPv4/IPv6 یا یک آدرس تکی، مثلاً `cidr("1.1.1.1")` یا `cidr("2001:db8::/32")` |
| `geoip("cn")` | کد کشور GeoIP |
| `geosite("netflix")` | دستهٔ GeoSite. ویژگی‌ها را پشتیبانی می‌کند، مثلاً `geosite("google@cn")`. |
| `legacy("geoip:cn")` | هر آدرسی در [نحو قدیمی](#address-types)، مثلاً `legacy("suffix:example.com")`. در قوانین قدیمیِ [تبدیل‌شده](#converting-legacy-rules) استفاده می‌شود. |

با یک آرگومان، تابع تطبیق مقصد درخواست را بررسی می‌کند: نام میزبان آن، یا آدرس IPv4 که به آن resolve می‌شود، یا آدرس IPv6 که به آن resolve می‌شود. بنابراین `geoip("cn")` با درخواست‌هایی به دامنه‌هایی که به IPهای چین resolve می‌شوند هم مطابقت دارد.

با دو آرگومان، تابع به‌جای مقصد آرگومان دوم را بررسی می‌کند. این برای تطبیق آدرس کلاینت کاربرد دارد، مثلاً `geoip("cn", client.ip)` یا `cidr("192.168.0.0/16", client.ip)`.

آرگومان اول باید مستقیماً به‌صورت یک رشته در قانون نوشته شود. Hysteria همهٔ تطبیق‌دهنده‌ها را هنگام راه‌اندازی آماده می‌کند، بنابراین `geoip(auth.id)` مجاز نیست.

> برای دیدن دسته‌های موجود GeoSite، اینجا را ببینید:
>
> - https://github.com/Loyalsoldier/v2ray-rules-dat
> - https://github.com/v2fly/domain-list-community/tree/master/data

## رفتار تطبیق { #matching-behavior }

### تطبیق دامنه و IP { #domain-and-ip-matching }

هنگام پردازش درخواست‌های مبتنی بر دامنه، Hysteria ابتدا دامنه را resolve می‌کند و سپس سعی می‌کند هم با قوانین دامنه و هم با قوانین IP تطبیق دهد. **یعنی قانونی که بر اساس آدرس IP است، برای همهٔ اتصالاتی که در نهایت به همان IP می‌رسند اعمال می‌شود، چه کلاینت درخواست را با IP داده باشد چه با نام دامنه.**

برای تطبیق فقط اولین آدرس IPv4 و اولین آدرس IPv6 یک دامنه استفاده می‌شود.

### خطاها { #errors }

قوانین هنگام راه‌اندازی سرور بررسی می‌شوند. اشتباهاتی مانند متغیر ناشناخته، عبارتی که نتیجه‌اش `true` یا `false` نیست، outbound ناشناخته یا کد کشور GeoIP ناشناخته، سرور را با خطایی متوقف می‌کنند که نشان می‌دهد کدام قانون اشتباه است:

```
invalid config: acl.rules: error at rules[0]: type acl.Auth has no field idd (1:6)
 | auth.idd == "alice"
 | .....^
```

اگر یک عبارت هنگام ارزیابی با خطا مواجه شود، مثلاً `int(auth.id) > 100` با شناسه‌ای که عدد نیست، آن قانون نامطابق در نظر گرفته می‌شود.

## outbounds داخلی { #built-in-outbounds }

مگر اینکه در فهرست outbounds صریحاً بازنویسی شده باشند، Hysteria این outbounds داخلی را دارد:

- `direct` — outbound مستقیم با پیکربندی پیش‌فرض (`auto`، بدون bind)
- `reject` — رد کردن اتصال
- `default` — استفاده از اولین outbound در فهرست outbounds؛ اگر فهرست خالی باشد، معادل `direct` است

## مثال‌ها { #examples }

فرض کنید فهرست outbounds به این صورت است:

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

```yaml
acl:
  rules:
    # Send all traffic from user "alice" through some_proxy
    - outbound: some_proxy
      match: auth.id == "alice"

    # Users "bob" and "carol" can't use UDP
    - outbound: reject
      match: auth.id in ["bob", "carol"] && proto == "udp"

    # Use the v6_only outbound for Google
    - outbound: v6_only
      match: suffix("google.com")

    # Use the v4_only outbound for Twitter, except for user "dave"
    - outbound: v4_only
      match: suffix("twitter.com") && auth.id != "dave"

    # Non-English IDN domains are also supported
    - outbound: v6_only
      match: domain("战狼*.中国")

    # Block QUIC and SMTP
    - outbound: reject
      match: (proto == "udp" && dst.port == 443) || (proto == "tcp" && dst.port == 25)

    # Block China and North Korea
    - outbound: reject
      match: geoip("cn") || geoip("kp")

    # Block Facebook and Google Ads
    - outbound: reject
      match: geosite("facebook") || geosite("google@ads")

    # Only clients in the office network can reach 10.0.0.0/8
    - outbound: reject
      match: cidr("10.0.0.0/8") && !cidr("192.0.2.0/24", client.ip)

    # Hijack DNS queries to 8.8.8.8 to 1.1.1.1, using the default (first) outbound
    - outbound: default
      match: proto == "udp" && dst.port == 53 && cidr("8.8.8.8")
      hijack: 1.1.1.1

    # Direct all other connections
    - outbound: direct
```

> **توجه:** ACL بدون outbounds سفارشی هم به‌طور کامل قابل استفاده است. outbounds داخلی همیشه در دسترس‌اند، حتی اگر فهرست outbound خالی باشد. در واقع یکی از رایج‌ترین کاربردهای ACL فقط مسدود کردن بعضی آدرس‌هاست:

```yaml
acl:
  rules:
    - outbound: reject
      match: geoip("cn") || geosite("facebook")
    - outbound: reject
      match: cidr("10.0.0.0/8") || cidr("172.16.0.0/12") || cidr("192.168.0.0/16") || cidr("fc00::/7")
```

## آزمایش قوانین { #testing-rules }

`hysteria acl test` نشان می‌دهد سرور برای یک درخواست از کدام قانون و کدام outbound استفاده می‌کند، بدون اینکه به جایی وصل شود. این دستور پیکربندی سرور را که با `-c` داده شده می‌خواند:

```bash
hysteria acl test -c server.yaml --auth alice example.com:443
```

```
Request:   tcp example.com:443, auth.id "alice"
Resolved:  ipv4 172.66.147.243, ipv6 2606:4700:10::6814:179a
Rule:      rules[0]: some_proxy, match: auth.id == "alice"
Outbound:  some_proxy
```

```bash
hysteria acl test -c server.yaml --proto udp 8.8.8.8:53
```

```
Request:   udp 8.8.8.8:53
Resolved:  ipv4 8.8.8.8
Rule:      rules[9]: default, match: proto == "udp" && dst.port == 53 && cidr("8.8.8.8")
Outbound:  v4_only
Hijacked:  1.1.1.1:53
```

| گزینه | پیش‌فرض | معنی |
| --- | --- | --- |
| `--proto` | `tcp` | `tcp` یا `udp` |
| `--auth` | خالی | شناسهٔ احراز هویت کلاینت (`auth.id`) |
| `--client` | هیچ | آدرس کلاینت، `IP` یا `IP:port` (`client.ip`، `client.port`) |
| `--ipv4`، `--ipv6` | resolve | استفاده از این آدرس‌ها به‌جای resolve کردن میزبان |
| `--no-resolve` | خاموش | میزبان resolve نمی‌شود و آدرس IP ندارد |

به‌طور پیش‌فرض، میزبان با [حل‌کنندهٔ نام](Full-Server-Config.md#_11) تعریف‌شده در پیکربندی سرور resolve می‌شود، همان‌طور که سرور این کار را می‌کند. شناسایی پروتکل شبیه‌سازی نمی‌شود: میزبان همان‌طور که داده شده استفاده می‌شود.

## نحو قدیمی { #legacy-syntax }

پیش از نسخهٔ 2.14.0، قوانین ACL نحو دیگری داشتند و با `acl.file` یا `acl.inline` تنظیم می‌شدند. این نحو همچنان پشتیبانی می‌شود: Hysteria هنگام راه‌اندازی این قوانین را به عبارت تبدیل می‌کند و رفتار آن‌ها مانند قبل است، به‌جز یک استثنا که [پایین‌تر](#protoport) آمده است.

```yaml
acl:
  inline:
    - reject(geoip:cn)
    - reject(all, udp/443)
    - direct(all)
```

یک قانون قدیمی معتبر باید در یکی از قالب‌های زیر باشد:

- `outbound(address)`
- `outbound(address, proto/port)`
- `outbound(address, proto/port, hijack_address)`
- `# این یک توضیح است`

### انواع آدرس { #address-types }

فیلد `address` می‌تواند یکی از موارد زیر باشد:

- یک آدرس IPv4/IPv6 تکی، مثلاً `1.1.1.1` یا `2606:4700:4700::1111`
- یک بازهٔ CIDR برای IPv4/IPv6، مثلاً `73.0.0.0/8` یا `2001:db8::/32`
- یک نام دامنه، مثلاً `example.com` (زیردامنه‌ها را شامل نمی‌شود)
- نام دامنه با کاراکتر جایگزین، مثلاً `*.example.com` یا `*.google.*`
- پسوند دامنه، مثلاً `suffix:example.com` (با `example.com` و همهٔ زیردامنه‌هایش مطابقت دارد)
- کد کشور GeoIP، مثلاً `geoip:cn` یا `geoip:us`
- دستهٔ GeoSite، مثلاً `geosite:netflix` یا `geosite:google` (ویژگی‌ها را پشتیبانی می‌کند، مثلاً `geosite:google@cn`)
- `all` — با همهٔ آدرس‌ها مطابقت دارد

### پروتکل/پورت { #protoport }

- `tcp` یا `tcp/*` — همهٔ پورت‌های TCP
- `udp` یا `udp/*` — همهٔ پورت‌های UDP
- `tcp/80` — پورت TCP ۸۰
- `udp/53` — پورت UDP ۵۳
- `udp/20000-30000` — پورت‌های UDP از ۲۰۰۰۰ تا ۳۰۰۰۰
- `*/443` — پورت ۴۴۳ برای TCP و UDP
- `*`، `*/*` یا حذف‌شده — هر دو پروتکل و همهٔ پورت‌ها

> **توجه:** پیش از نسخهٔ 2.14.0، بازهٔ پورتی که از ۰ شروع می‌شد (مثلاً `udp/0-100`) یا پورت `0` (مثلاً `tcp/0`) با همهٔ پورت‌ها مطابقت داشت. اکنون فقط با پورت‌های تعیین‌شده مطابقت دارد.

### آدرس hijack { #hijack-address }

در صورت تعیین، اتصالی که با این قانون مطابقت دارد به آدرس مشخص‌شده هدایت (hijack) می‌شود. آدرس hijack باید یک آدرس IPv4/IPv6 باشد، نه نام دامنه.

### ترکیب قوانین قدیمی در `rules` { #mixing-legacy-rules-into-rules }

فهرست `rules` می‌تواند قوانین قدیمی را هم در خود داشته باشد، تا بتوانید بدون تبدیل یک فهرست موجود، قوانین جدید (مثلاً قوانین مخصوص هر کاربر) به آن اضافه کنید. یک مورد `legacy` یک یا چند خط قانون قدیمی را در بر می‌گیرد و یک مورد `legacyFile` یک فایل قوانین قدیمی را وارد می‌کند. قوانین آن‌ها در همان جایگاه فهرست بررسی می‌شوند:

```yaml
acl:
  rules:
    - outbound: some_proxy
      match: auth.id == "alice"
    - legacy: reject(geoip:cn)
    - legacy: |
        reject(geosite:facebook)
        reject(all, tcp/25)
    - legacyFile: /etc/hysteria/acl.txt
    - outbound: direct
```

خطاهای موارد قدیمی هم مورد و هم خط را مشخص می‌کنند، مثلاً `error at rules[3] (/etc/hysteria/acl.txt) line 2: outbound v6_only not found`.

### تبدیل قوانین قدیمی { #converting-legacy-rules }

`hysteria acl translate` قوانین قدیمی را به‌صورت یک فهرست `rules` معادل چاپ می‌کند، که همان چیزی است که Hysteria در داخل اجرا می‌کند:

```bash
hysteria acl translate acl.txt
```

```
acl:
  rules:
    - outbound: v6_only
      match: legacy("suffix:google.com")
    - outbound: reject
      match: proto == "udp" && dst.port == 443
    - outbound: reject
      match: legacy("geoip:cn")
    - outbound: default
      match: legacy("8.8.4.4") && proto == "udp" && dst.port == 53
      hijack: 1.1.1.1
    - outbound: direct
```

اگر فایلی داده نشود، از ورودی استاندارد می‌خواند. فقط نحو بررسی می‌شود: نام outbounds و نام‌های GeoIP/GeoSite هنگام بارگذاری قوانین توسط سرور بررسی می‌شوند.
