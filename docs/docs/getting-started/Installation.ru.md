# Установка

Как и любое прокси-программное обеспечение, Hysteria состоит из сервера и клиента. Наши предварительно скомпилированные исполняемые файлы включают оба режима для всех платформ. **Вы можете скачать последние версии одним из следующих способов:**

- [Исполняемые файлы](#_2)
- [GitHub Releases](https://github.com/apernet/hysteria/releases)
- [Скрипт установки для Linux-серверов](#скрипт-установки-для-linux-серверов)
- [Arch Linux AUR](https://aur.archlinux.org/packages/hysteria)
- [Docker-образы](#docker-образы)
- Используйте [сторонние приложения](3rd-party-apps.md)
- [Сборка из исходного кода](../developers/Build.md)

## Исполняемые файлы

> Нажмите на имя файла для скачивания. Все файлы — последней версии.

=== ":fontawesome-brands-windows: Windows"

    | Файл                                                                                                          | Архитектура | Примечание   |
    | ------------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
    | [hysteria-windows-amd64.exe](https://download.hysteria.network/app/latest/hysteria-windows-amd64.exe)         | x86-64      |              |
    | [hysteria-windows-amd64-avx.exe](https://download.hysteria.network/app/latest/hysteria-windows-amd64-avx.exe) | x86-64      | Требуется AVX |
    | [hysteria-windows-386.exe](https://download.hysteria.network/app/latest/hysteria-windows-386.exe)             | x86         |              |
    | [hysteria-windows-arm64.exe](https://download.hysteria.network/app/latest/hysteria-windows-arm64.exe)         | ARM64       |              |

=== ":fontawesome-brands-apple: macOS"

    | Файл                                                                                                  | Архитектура | Примечание   |
    | ----------------------------------------------------------------------------------------------------- | ----------- | ------------ |
    | [hysteria-darwin-amd64](https://download.hysteria.network/app/latest/hysteria-darwin-amd64)           | x86-64      |              |
    | [hysteria-darwin-amd64-avx](https://download.hysteria.network/app/latest/hysteria-darwin-amd64-avx)   | x86-64      | Требуется AVX |
    | [hysteria-darwin-arm64](https://download.hysteria.network/app/latest/hysteria-darwin-arm64)           | ARM64       | M1 или новее |

=== ":fontawesome-brands-linux: Linux"

    | Файл                                                                                              | Архитектура | Примечание   |
    | ------------------------------------------------------------------------------------------------- | ----------- | ------------ |
    | [hysteria-linux-amd64](https://download.hysteria.network/app/latest/hysteria-linux-amd64)         | x86-64      |              |
    | [hysteria-linux-amd64-avx](https://download.hysteria.network/app/latest/hysteria-linux-amd64-avx) | x86-64      | Требуется AVX |
    | [hysteria-linux-386](https://download.hysteria.network/app/latest/hysteria-linux-386)             | x86         |              |
    | [hysteria-linux-arm](https://download.hysteria.network/app/latest/hysteria-linux-arm)             | ARMv7       |              |
    | [hysteria-linux-armv5](https://download.hysteria.network/app/latest/hysteria-linux-armv5)         | ARMv5       |              |
    | [hysteria-linux-arm64](https://download.hysteria.network/app/latest/hysteria-linux-arm64)         | ARM64       |              |
    | [hysteria-linux-s390x](https://download.hysteria.network/app/latest/hysteria-linux-s390x)         | s390x       |              |
    | [hysteria-linux-mipsle](https://download.hysteria.network/app/latest/hysteria-linux-mipsle)       | MIPS        | Little Endian |
    | [hysteria-linux-mipsle-sf](https://download.hysteria.network/app/latest/hysteria-linux-mipsle-sf) | MIPS        | Little Endian, Soft Float |
    | [hysteria-linux-riscv64](https://download.hysteria.network/app/latest/hysteria-linux-riscv64)     | RISC-V 64   |              |

=== ":fontawesome-brands-android: Android"

    > **Примечание:** Эти файлы — не Android-приложения (APK), а исполняемые файлы Linux ELF, скомпилированные с NDK. Если вы не знаете, как их использовать, воспользуйтесь [сторонними приложениями](3rd-party-apps.md).

    | Файл                                                                                                    | Архитектура | Примечание   |
    | ------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
    | [hysteria-android-amd64](https://download.hysteria.network/app/latest/hysteria-android-amd64)           | x86-64      |              |
    | [hysteria-android-386](https://download.hysteria.network/app/latest/hysteria-android-386)               | x86         |              |
    | [hysteria-android-armv7](https://download.hysteria.network/app/latest/hysteria-android-armv7)           | ARMv7       |              |
    | [hysteria-android-arm64](https://download.hysteria.network/app/latest/hysteria-android-arm64)           | ARM64       |              |

=== ":fontawesome-brands-freebsd: FreeBSD"

    | Файл                                                                                                    | Архитектура | Примечание   |
    | ------------------------------------------------------------------------------------------------------- | ----------- | ------------ |
    | [hysteria-freebsd-amd64](https://download.hysteria.network/app/latest/hysteria-freebsd-amd64)           | x86-64      |              |
    | [hysteria-freebsd-amd64-avx](https://download.hysteria.network/app/latest/hysteria-freebsd-amd64-avx)   | x86-64      | Требуется AVX |
    | [hysteria-freebsd-386](https://download.hysteria.network/app/latest/hysteria-freebsd-386)               | x86         |              |
    | [hysteria-freebsd-arm](https://download.hysteria.network/app/latest/hysteria-freebsd-arm)               | ARMv7       |              |
    | [hysteria-freebsd-arm64](https://download.hysteria.network/app/latest/hysteria-freebsd-arm64)           | ARM64       |              |

## Скрипт установки для Linux-серверов

Мы предоставляем bash-скрипт, который автоматически скачивает последнюю версию Hysteria и настраивает systemd-сервис на распространённых дистрибутивах Linux.

```bash
bash <(curl -fsSL https://get.hy2.sh/)
```

Подробнее об этом скрипте см. [Скрипт установки сервера](./Server-Installation-Script.md).

## Docker-образы

Docker Hub: <https://hub.docker.com/r/tobyxdd/hysteria>

### Пример Compose

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
