# Hysteria Realms

Hysteria Realms is a peer-to-peer mode that lets a Hysteria server run **without a public IP or port forwarding**. A small rendezvous service introduces the server and client to each other, and they then perform UDP hole punching to establish a direct QUIC connection. After the hole is open, the rendezvous is no longer involved — all traffic flows directly between client and server.

## When is this useful?

- Hosting from a **residential network** behind NAT.
- Hosting from a **coffee shop, hotel, or cellular hotspot** where you have no control over the router.
- Quick experiments where provisioning a VPS with an open port is overkill.
- Any environment behind **CGNAT** where you cannot get an inbound port at all.

You still need a working outbound UDP path to the rendezvous server and to your peer's network — which most NATs permit.

## How it works

1. The Hysteria **server** registers a *realm* (a name you choose) with a rendezvous service, advertising the UDP addresses it discovered via STUN.
2. The **client**, given the same realm address, asks the rendezvous to connect. The rendezvous returns the server's addresses to the client, and pushes the client's addresses to the server.
3. Both sides simultaneously send UDP packets at each other, punching holes through their NATs.
4. Once a hole is open, the regular Hysteria QUIC handshake proceeds over the direct connection.

The rendezvous only mediates introductions. **It does not relay any traffic.**

## Realm address

Both client and server identify a realm using a single URI:

```
realm://<token>@<rendezvous-host>[:port]/<realm-name>
```

- `realm://` — uses HTTPS to talk to the rendezvous (default port 443). **Recommended.**
- `realm+http://` — uses plain HTTP (default port 80). Development only.
- `<token>` — the rendezvous server's shared bearer token.
- `<realm-name>` — your chosen realm name. Server and client must use the same one.

Example: `realm://mytoken@rendezvous.example.com/my-server`

The URL also supports a couple of optional query parameters:

- `stun=<host:port>` — override the STUN servers. Repeat the parameter to provide multiple servers (e.g. `?stun=stun1.example.com:3478&stun=stun2.example.com:3478`). When set, this takes precedence over [`realm.stunServers`](Full-Server-Config.md#realm) in the YAML config.
- `lport=<1-65535>` — bind the local UDP socket to a specific source port. Useful for firewall pinholing or producing a more predictable NAT mapping. Defaults to ephemeral.

## Choosing a rendezvous server

You can use a **public** rendezvous or **self-host** one.

### Public rendezvous (`realm.hy2.io`)

The Hysteria project runs a public rendezvous at `realm.hy2.io` with the token `public`:

```
realm://public@realm.hy2.io/<your-realm-name>
```

> **No guarantees.** This is a free, best-effort service. It may go down, change limits, get blocked, or disappear without notice. Do not depend on it for anything important.

> **All realms are user-run.** The Hysteria project does not operate, endorse, or vet any proxy server registered on `realm.hy2.io`, and we never will. Anyone can register a realm with any name. Only connect to realms whose operator you trust — a stranger's realm could log your traffic, MITM your connection, or just be a honeypot. Treat any realm name you didn't set up yourself with the same skepticism as a random VPN provider.

Because the token is shared, **anyone who knows or guesses your realm name can probe your server's IP address.** They cannot use your proxy (Hysteria's own authentication still applies), but they will learn where you are. To make guessing impractical:

- Pick a **long, random realm name** — treat it like a secret. Something like `my-cabin-1f3a8c2e9b` is much harder to guess than `home`.
- Avoid names that identify you (your username, hostname, etc.).

If any of this matters to you, **self-host instead**.

#### Current limits

Realm names must be 6–64 characters, start with a letter or digit, and otherwise contain only letters, digits, `-`, or `_`. Each client IP can keep at most 2 active realms registered at a time. These limits may change without notice; if you need different ones, self-host.

### Self-hosting

The rendezvous server is open source and easy to run: <https://github.com/apernet/hysteria-realm-server>

A self-hosted instance with a strong, private token is the right choice for any production use:

- Only clients and servers that know the token can register or connect.
- You control uptime, limits, and logging.
- Memory footprint is small (a few KiB per realm).

Refer to the [project README](https://github.com/apernet/hysteria-realm-server) for setup and deployment options.

## Server configuration

To run a Hysteria server in realm mode, set `listen` to a realm URI. The server dials the rendezvous over outbound TCP, registers the realm, and waits for connections — no inbound port needed.

```yaml
listen: realm://public@realm.hy2.io/your-realm-name
```

All other server fields (auth, tls, obfs, bandwidth, etc.) stay the same. STUN, punch, and heartbeat tuning options are documented under [Full Server Config](Full-Server-Config.md#realm).

> **If DPI-based censorship is a concern, enable [`obfs`](Full-Server-Config.md#obfuscation).** In realm mode the server listens on a random UDP port rather than 443, and HTTP/3 traffic on a non-standard port can itself be a detection signal.

## Client configuration

Set `server` to the same realm URI the server registered with:

```yaml
server: realm://public@realm.hy2.io/your-realm-name
auth: your-hysteria-password
```

All other client fields work as usual. STUN and punch tuning options are documented under [Full Client Config](Full-Client-Config.md#realm).

The client performs STUN discovery, asks the rendezvous to introduce it to the server, punches through, and then proceeds with the regular Hysteria QUIC handshake — including TLS verification and password authentication. **The realm token is not a substitute for your Hysteria server password.**

## TLS

In realm mode the client has no DNS name to validate the server's certificate against — it connects to whatever IP the rendezvous returns. Without configuration, the client falls back to using the rendezvous hostname as SNI, which won't match a normal cert. You have three options:

**1. Self-signed cert with `pinSHA256`.** Run `hysteria cert` on the server — it generates a key + certificate and prints ready-to-paste `tls` blocks for both `server.yaml` (cert/key) and `client.yaml` (`insecure: true` + `pinSHA256`). The pin guarantees the client only accepts that exact certificate, so SNI and CA validation don't matter.

> **NOTE:** On v2.9.0, certificates produced by `hysteria cert` cause clients to hit `tls: internal error`. This will be fixed in the next release. Until then, add `sniGuard: disable` under your existing `tls` section on the **server** (keep your existing `cert`, `key`, and other fields):
>
> ```yaml
> tls:
>   cert: server.crt
>   key: server.key
>   sniGuard: disable
> ```

**2. Real CA cert + `tls.sni` override.** Get a cert via [DNS-01 ACME](ACME-DNS-Config.md) for a domain you control (HTTP-01 / TLS-ALPN-01 can't work without a public IP), use it on the server, and set [`tls.sni`](Full-Client-Config.md#tls) on the client to that domain.

**3. Cert for the rendezvous hostname.** Only practical when self-hosting both — issue the Hysteria server's cert for the same hostname as the rendezvous. The default client SNI then matches without any override.

## NAT compatibility

UDP hole punching works on most home and mobile networks, but not all of them.

| NAT type on either side | Works? |
| --- | --- |
| Public IP, no NAT | **Yes** |
| Full cone / endpoint-independent ("open") | **Yes** |
| Restricted cone, port-restricted cone ("moderate") | **Yes** |
| Symmetric ("strict") | **Sometimes** |

For symmetric NATs we apply a few heuristics that get connections through in many real-world cases, but there is **no guarantee**. If both sides are behind symmetric NATs the success rate drops further.

Some carrier-grade NAT (CGNAT) deployments behave like symmetric NATs and will be unreliable. If you find Realms doesn't work on your network, the most likely cause is a symmetric NAT on at least one side — fall back to a server with a public IP.

## STUN servers

Both server and client need STUN to discover their public UDP addresses before the rendezvous can introduce them. If you don't configure anything, Hysteria uses a small built-in list of public STUN servers:

- `stun.nextcloud.com:3478`
- `stun.sip.us:3478`
- `global.stun.twilio.com:3478`

These are run by third parties and offered as a courtesy. They may go down, be rate-limited, or get blocked in your network. For anything more than casual use, point Hysteria at your own (or trusted) STUN servers via [`realm.stunServers`](Full-Server-Config.md#realm) on the server and [`realm.stunServers`](Full-Client-Config.md#realm) on the client.

## Reporting connectivity issues

Realms involves several moving parts (STUN, the rendezvous, NAT punching, TLS, the QUIC handshake), so a "doesn't connect" report is hard to act on without the trace. If you're filing an issue, run **both client and server** with `HYSTERIA_LOG_LEVEL=debug` and attach the full output from both sides:

```bash
HYSTERIA_LOG_LEVEL=debug ./hysteria server -c server.yaml
HYSTERIA_LOG_LEVEL=debug ./hysteria client -c client.yaml
```

## For other protocols

Realms is, at its core, a generic UDP hole-punching framework — the rendezvous protocol, STUN discovery, and punch logic do not depend on Hysteria in any way. Hysteria just happens to be its first user.

Both the [rendezvous server](https://github.com/apernet/hysteria-realm-server) and the [client/server-side punch library](https://github.com/apernet/hysteria/tree/master/extras/realm) are open source under permissive licenses. Authors of other UDP-based tools and protocols are welcome to integrate the same protocol so any compatible client can reach any compatible server through any compatible rendezvous — we'd love to see this become a small de facto standard. PRs, issues, and integration questions are welcome on GitHub.
