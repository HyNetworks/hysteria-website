---
title: Changelog
hide:
  - navigation
---

## 2.5.0

- Added support for ACME DNS challenge, including several common providers such as Cloudflare, GoDaddy, and Name.com
- Added server-side protocol sniffing, supporting HTTP, TLS (HTTPS), and QUIC (HTTP/3)
- Fixed the issue with inaccurate unit conversion in the speed test command (1024 -> 1000)

## 2.4.5

- Fixed some logic issues in BBR, and added `HYSTERIA_BBR_DEBUG` environment variable for printing debug information
- Fixed compatibility issues of the HTTP proxy with certain programs
- Updated quic-go to v0.44.0

## 2.4.4

> This release contains important fixes and we strongly encourage everyone to upgrade.

- Fixed a memory leak in quic-go between 2.4.2 and 2.4.3
- Added a new GET `/online` endpoint to the traffic stats API for retrieving current online users and their connection counts
- The client now gracefully closes the QUIC connection when exiting

## 2.4.3

> This release contains important fixes and we strongly encourage everyone to upgrade.

- Fixed a bug introduced in the previous version that caused UDP forwarding to not work properly

## 2.4.2

- Small tweaks to Brutal congestion control to improve performance at high speeds
- When using a local certificate, the server now checks if the files can be accessed on startup. This ensures that access problems are detected immediately, rather than when accepting client connections.
- Updated quic-go to v0.43.0

## 2.4.1

- The client now supports listening to both HTTP and SOCKS5 on a single port by making their `listen` addresses the same
- The client has added a new `sockopts` section to `quic` which allows the user to specify the bind interface, fwmark and FD control socket path for outbound QUIC connections. This is a feature mainly for Android app development.

## 2.4.0

- Added TUN mode to client (supports Windows, Linux & macOS)
- ACL now supports matching port ranges (e.g. `reject(all, udp/40000-50000)`)
- Added a `listenHost` field to the server ACME config to allow specifying the listening address for receiving validation requests
- Updated quic-go to v0.42.0
- Lowered the log level for proxied connection errors from error to warning

## 2.3.0

- Added a built-in speed test subcommand for client & its server-side support
- Automatically try to re-download GeoIP/GeoSite DB files if they fail to load
- Better SOCKS5 outbound error messages
- Fixed a bug where the dual stack listen address was actually only listening for IPv6 on FreeBSD

## 2.2.4

> This release contains important fixes and we strongly encourage everyone to upgrade.

- **[Important]** Fixed a bug where a connection timeout would block other connections from being established
- Updated quic-go to v0.41.0

## 2.2.3

- Fixed a bug where using an IPv4/IPv6 specific listening address like `0.0.0.0:443` or `[::]:443` would still result in listening on both IPv4/IPv6
- Delay server address DNS resolution until connection attempt when lazy mode is enabled
- Local TLS certificates are now read every time a TLS handshake takes place, allowing users to update files without restarting the server

## 2.2.2

- Fixed a bug introduced in the previous version that broke the automatic reconnection of the client
- Added `suffix:` support to ACL for matching a domain and all its subdomains (e.g. `reject(suffix:baidu.com)`)

## 2.2.1

- Added GeoIP & GeoSite auto update (`geoUpdateInterval` field under ACL, default is 1 week)
- Client now shows handshake information after connecting to the server, currently includes UDP forwarding availability & tx rate
- Changed the basis for bandwidth conversion (Kbps/Mbps/Gbps/Tbps) from 1024 to 1000
- Added RISC-V (riscv64) support
- Updated quic-go to v0.40.0

## 2.2.0

- Added GeoSite support to ACL (both GeoIP and GeoSite now use the v2ray "dat" format database)
- Added support for non-English domains (IDN) to ACL (e.g. `v6_only(战狼*.中国)`)
- Added WebSocket support to masquerade proxy mode
- Added secret-based authentication to Traffic Stats API
- Fixed compatibility issues on certain Linux systems

## 2.1.1

> This release contains important fixes and we strongly encourage everyone to upgrade.

- Fixed a bug where a specially crafted UDP message packet could cause the server to crash
- Fixed compatibility issues on FreeBSD
- Windows users can now launch directly by double-clicking the exe file

## 2.1.0

- Fixed a memory leak in BBR
- Minor tweaks to Brutal congestion control
- Added string mode to masquerade
- Added HTTP/HTTPS proxy outbound

## 2.0.4

- Optimized and fixed some issues in Brutal CC
- Fixed problem where BBR could freeze the connection and cause CPU usage to spike under certain conditions
- Fixed two race condition issues
- Added `HYSTERIA_BRUTAL_DEBUG` environment variable. When enabled, it prints information like current RTT, packet loss, MTU, etc.

## 2.0.3

> This release contains important fixes and we strongly encourage everyone to upgrade.

- **[Important]** Fixed the problem where when using BBR (either the client doesn't set bandwidth or the server has `ignoreClientBandwidth` enabled), due to a bug in the BBR implementation, it could not accurately determine the bandwidth and send packets much faster than the limit.
- Fixed the problem where ZeroSSL couldn't acquire certificates due to missing EAB.

## 2.0.2

- Fixed connection issues on some devices due to lack of GSO support
- Added HTTP/HTTPS (TCP) masquerade servers
- Added Android builds

## 2.0.1

- Added TCP redirect mode
- Log HTTP requests handled by masquerade (debug level)
- Added environment variable `HYSTERIA_ACME_DIR` to control ACME data directory location

## 2.0.0

This is the first stable release of Hysteria 2. It's almost a complete rewrite of the original Hysteria, with a new protocol, new features, and various improvements.
