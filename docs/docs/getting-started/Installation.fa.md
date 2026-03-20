# نصب

مانند هر نرم‌افزار پروکسی، Hysteria شامل سرور و کلاینت است. فایل‌های اجرایی از پیش کامپایل‌شده ما شامل هر دو حالت در تمام پلتفرم‌ها هستند. **شما می‌توانید آخرین نسخه‌ها را با یکی از روش‌های زیر دانلود کنید:**

- [فایل‌های اجرایی](#فایلهای-اجرایی)
- [GitHub Releases](https://github.com/apernet/hysteria/releases)
- [اسکریپت نصب برای سرورهای لینوکس](#اسکریپت-نصب-برای-سرورهای-لینوکس)
- [Arch Linux AUR](https://aur.archlinux.org/packages/hysteria)
- [ایمیج‌های Docker](#ایمیجهای-docker)
- استفاده از [برنامه‌های شخص ثالث](3rd-party-apps.md)
- [ساخت از سورس](../developers/Build.md)

## فایل‌های اجرایی

> برای دانلود روی نام فایل کلیک کنید. همه فایل‌ها آخرین نسخه هستند.

=== ":fontawesome-brands-windows: Windows"

    | فایل                                                                                                          | معماری  | توضیحات      |
    | ------------------------------------------------------------------------------------------------------------- | ------- | ------------ |
    | [hysteria-windows-amd64.exe](https://download.hysteria.network/app/latest/hysteria-windows-amd64.exe)         | x86-64  |              |
    | [hysteria-windows-amd64-avx.exe](https://download.hysteria.network/app/latest/hysteria-windows-amd64-avx.exe) | x86-64  | نیاز به AVX  |
    | [hysteria-windows-386.exe](https://download.hysteria.network/app/latest/hysteria-windows-386.exe)             | x86     |              |
    | [hysteria-windows-arm64.exe](https://download.hysteria.network/app/latest/hysteria-windows-arm64.exe)         | ARM64   |              |

=== ":fontawesome-brands-apple: macOS"

    | فایل                                                                                                  | معماری  | توضیحات      |
    | ----------------------------------------------------------------------------------------------------- | ------- | ------------ |
    | [hysteria-darwin-amd64](https://download.hysteria.network/app/latest/hysteria-darwin-amd64)           | x86-64  |              |
    | [hysteria-darwin-amd64-avx](https://download.hysteria.network/app/latest/hysteria-darwin-amd64-avx)   | x86-64  | نیاز به AVX  |
    | [hysteria-darwin-arm64](https://download.hysteria.network/app/latest/hysteria-darwin-arm64)           | ARM64   | M1 یا جدیدتر |

=== ":fontawesome-brands-linux: Linux"

    | فایل                                                                                              | معماری  | توضیحات      |
    | ------------------------------------------------------------------------------------------------- | ------- | ------------ |
    | [hysteria-linux-amd64](https://download.hysteria.network/app/latest/hysteria-linux-amd64)         | x86-64  |              |
    | [hysteria-linux-amd64-avx](https://download.hysteria.network/app/latest/hysteria-linux-amd64-avx) | x86-64  | نیاز به AVX  |
    | [hysteria-linux-386](https://download.hysteria.network/app/latest/hysteria-linux-386)             | x86     |              |
    | [hysteria-linux-arm](https://download.hysteria.network/app/latest/hysteria-linux-arm)             | ARMv7   |              |
    | [hysteria-linux-armv5](https://download.hysteria.network/app/latest/hysteria-linux-armv5)         | ARMv5   |              |
    | [hysteria-linux-arm64](https://download.hysteria.network/app/latest/hysteria-linux-arm64)         | ARM64   |              |
    | [hysteria-linux-s390x](https://download.hysteria.network/app/latest/hysteria-linux-s390x)         | s390x   |              |
    | [hysteria-linux-mipsle](https://download.hysteria.network/app/latest/hysteria-linux-mipsle)       | MIPS    | Little Endian |
    | [hysteria-linux-mipsle-sf](https://download.hysteria.network/app/latest/hysteria-linux-mipsle-sf) | MIPS    | Little Endian, Soft Float |
    | [hysteria-linux-riscv64](https://download.hysteria.network/app/latest/hysteria-linux-riscv64)     | RISC-V 64 |            |

=== ":fontawesome-brands-android: Android"

    > **توجه:** این فایل‌ها برنامه اندروید (APK) نیستند بلکه فایل‌های اجرایی Linux ELF هستند که با NDK ساخته شده‌اند. اگر نمی‌دانید چطور از آن‌ها استفاده کنید، لطفاً از [برنامه‌های شخص ثالث](3rd-party-apps.md) استفاده کنید.

    | فایل                                                                                                    | معماری  | توضیحات      |
    | ------------------------------------------------------------------------------------------------------- | ------- | ------------ |
    | [hysteria-android-amd64](https://download.hysteria.network/app/latest/hysteria-android-amd64)           | x86-64  |              |
    | [hysteria-android-386](https://download.hysteria.network/app/latest/hysteria-android-386)               | x86     |              |
    | [hysteria-android-armv7](https://download.hysteria.network/app/latest/hysteria-android-armv7)           | ARMv7   |              |
    | [hysteria-android-arm64](https://download.hysteria.network/app/latest/hysteria-android-arm64)           | ARM64   |              |

=== ":fontawesome-brands-freebsd: FreeBSD"

    | فایل                                                                                                    | معماری  | توضیحات      |
    | ------------------------------------------------------------------------------------------------------- | ------- | ------------ |
    | [hysteria-freebsd-amd64](https://download.hysteria.network/app/latest/hysteria-freebsd-amd64)           | x86-64  |              |
    | [hysteria-freebsd-amd64-avx](https://download.hysteria.network/app/latest/hysteria-freebsd-amd64-avx)   | x86-64  | نیاز به AVX  |
    | [hysteria-freebsd-386](https://download.hysteria.network/app/latest/hysteria-freebsd-386)               | x86     |              |
    | [hysteria-freebsd-arm](https://download.hysteria.network/app/latest/hysteria-freebsd-arm)               | ARMv7   |              |
    | [hysteria-freebsd-arm64](https://download.hysteria.network/app/latest/hysteria-freebsd-arm64)           | ARM64   |              |

## اسکریپت نصب برای سرورهای لینوکس

ما یک اسکریپت bash ارائه می‌دهیم که به‌طور خودکار آخرین نسخه Hysteria را دانلود کرده و سرویس systemd را در توزیع‌های رایج لینوکس پیکربندی می‌کند.

```bash
bash <(curl -fsSL https://get.hy2.sh/)
```

برای اطلاعات بیشتر درباره این اسکریپت، به [اسکریپت نصب سرور](./Server-Installation-Script.md) مراجعه کنید.

## ایمیج‌های Docker

Docker Hub: <https://hub.docker.com/r/tobyxdd/hysteria>

### نمونه Compose

```yaml
version: "3.9"
services:
  hysteria:
    image: tobyxdd/hysteria
    container_name: hysteria
    restart: always
    network_mode: "host"
    volumes:
      - acme:/acme
      - ./hysteria.yaml:/etc/hysteria.yaml
    command: ["server", "-c", "/etc/hysteria.yaml"]
volumes:
  acme:
```
