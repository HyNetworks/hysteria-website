# ACL

ACL, often used in combination with outbounds, is a very powerful feature of the Hysteria server that allows you to customize the way client's requests are handled. For example, you can use ACL to block certain addresses, use different outbounds for different websites, or route each user through a different outbound.

Starting with version 2.14.0, ACL rules are written as expressions that can look at the destination, the protocol, the client's address and the client's authentication ID. The [legacy syntax](#legacy-syntax) used by earlier versions is still supported.

## Rules

Rules go under `acl.rules` in the server config:

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

1. The name of the outbound to use when the rule matches. Either one of your [outbounds](Full-Server-Config.md#outbounds) or a [built-in outbound](#built-in-outbounds). Case-insensitive.
2. Optional. An [expression](#expressions) that decides whether the rule matches the request.
3. Optional. Redirect the connection to this address instead. Must be an IPv4/IPv6 address, not a domain name. The port is unchanged.
4. A rule without `match` matches everything. Usually placed at the end as the default rule for everything else.

Rules are checked from top to bottom, and the first rule that matches the request is used. If no rule matches, the default outbound (the first one in the outbounds list) is used.

You can also keep the rules in a separate file and point `acl.rulesFile` to it. The file contains the same list, without the `acl:` and `rules:` keys:

```yaml
- outbound: some_proxy
  match: auth.id == "alice"
- outbound: direct
```

## Expressions

`match` is written in the [expr language](https://expr-lang.org/docs/language-definition). The most useful parts of it are:

- Comparison: `==`, `!=`, `<`, `<=`, `>`, `>=`
- Logic: `&&` (or `and`), `||` (or `or`), `!` (or `not`), and parentheses for grouping
- Lists and ranges: `auth.id in ["alice", "bob"]`, `dst.port in 8000..8999`
- Strings: `startsWith`, `endsWith`, `contains`, and `matches` for regular expressions, e.g. `dst.host matches "^cdn[0-9]+"`

A rule's expression must evaluate to `true` or `false`. Time functions such as `now()` and `date()` are not available.

### Variables

| Variable | Description |
| --- | --- |
| `proto` | `"tcp"` or `"udp"` |
| `dst.host` | The requested host: a domain name (lower case, without a trailing dot) or an IP address, as sent by the client. If [protocol sniffing](Full-Server-Config.md#protocol-sniffing) is enabled, this is the sniffed domain when there is one. |
| `dst.port` | The requested port |
| `dst.ipv4`, `dst.ipv6` | The IPv4 and IPv6 addresses the host resolves to (see [Domain and IP matching](#domain-and-ip-matching)). An empty string if there is none. |
| `auth.id` | The client's authentication ID. With `userpass` authentication, this is the username. With `http` authentication, it's the `id` returned by your auth server, and with `command` authentication, the command's output. With `password` authentication, it's always `user`. |
| `client.ip`, `client.port` | The IP address and port the client connects from |

### Matcher functions

| Function | Matches |
| --- | --- |
| `domain("example.com")` | A domain name exactly (does not include subdomains). Supports `*` wildcards, e.g. `domain("*.example.com")` or `domain("*.google.*")`. |
| `suffix("example.com")` | A domain and all its subdomains: `example.com`, `www.example.com`, etc. |
| `cidr("10.0.0.0/8")` | An IPv4/IPv6 CIDR, or a single address, e.g. `cidr("1.1.1.1")` or `cidr("2001:db8::/32")` |
| `geoip("cn")` | A GeoIP country code |
| `geosite("netflix")` | A GeoSite category. Supports attributes, e.g. `geosite("google@cn")`. |
| `legacy("geoip:cn")` | Any address in the [legacy syntax](#address-types), e.g. `legacy("suffix:example.com")`. Used by [translated](#converting-legacy-rules) legacy rules. |

With one argument, a matcher function checks the destination of the request: its host name, or the IPv4 address it resolves to, or the IPv6 address it resolves to. `geoip("cn")` therefore also matches requests to domains that resolve to Chinese IP addresses.

With two arguments, the function checks the second argument instead. This is useful for matching the client's address, e.g. `geoip("cn", client.ip)` or `cidr("192.168.0.0/16", client.ip)`.

The first argument must be written directly in the rule as a string. Hysteria prepares every matcher when it starts, so `geoip(auth.id)` is not allowed.

> To see what's available as GeoSite categories, check here:
>
> - https://github.com/Loyalsoldier/v2ray-rules-dat
> - https://github.com/v2fly/domain-list-community/tree/master/data

## Matching behavior

### Domain and IP matching

When handling domain-based requests, Hysteria first resolves the domain and then attempts to match against both domain and IP rules. **This means that a rule based on an IP address will apply to all connections that ultimately lead to that IP, regardless of whether the client request used an IP address or a domain name.**

Only the first IPv4 and the first IPv6 address of a domain are used for matching.

### Errors

The rules are checked when the server starts. Mistakes such as an unknown variable, an expression that isn't `true` or `false`, an unknown outbound or an unknown GeoIP country code stop the server with an error that shows which rule is wrong:

```
invalid config: acl.rules: error at rules[0]: type acl.Auth has no field idd (1:6)
 | auth.idd == "alice"
 | .....^
```

If an expression fails while it's being evaluated, for example `int(auth.id) > 100` with a non-numeric ID, that rule is treated as not matching.

## Built-in outbounds

Unless explicitly overridden in the outbounds list, Hysteria comes with the following built-in outbounds:

- `direct` - direct outbound using default configuration (`auto`, no bind)
- `reject` - reject the connection
- `default` - use the first outbound in the outbounds list; if the list is empty, equivalent to `direct`

## Examples

Assume the following outbounds list:

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

> **NOTE:** ACL is fully usable without custom outbounds. The built-in outbounds are always available, even if you have an empty outbound list. In fact, one of the most common uses of ACL is just to block some addresses:

```yaml
acl:
  rules:
    - outbound: reject
      match: geoip("cn") || geosite("facebook")
    - outbound: reject
      match: cidr("10.0.0.0/8") || cidr("172.16.0.0/12") || cidr("192.168.0.0/16") || cidr("fc00::/7")
```

## Testing rules

`hysteria acl test` shows which rule and outbound the server would use for a request, without connecting anywhere. It reads the server config given with `-c`:

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

| Option | Default | Meaning |
| --- | --- | --- |
| `--proto` | `tcp` | `tcp` or `udp` |
| `--auth` | Empty | The client's authentication ID (`auth.id`) |
| `--client` | None | The client's address, `IP` or `IP:port` (`client.ip`, `client.port`) |
| `--ipv4`, `--ipv6` | Resolve | Use these addresses instead of resolving the host |
| `--no-resolve` | Off | Don't resolve the host, so it has no IP addresses |

By default, the host is resolved with the [resolver](Full-Server-Config.md#resolver) from the server config, like the server does. Protocol sniffing is not simulated: the host is used as given.

## Legacy syntax

Before version 2.14.0, ACL rules used a different syntax, set with `acl.file` or `acl.inline`. This syntax is still supported: Hysteria translates these rules into expressions when it starts, and they behave the same as before, with one exception noted [below](#protoport).

```yaml
acl:
  inline:
    - reject(geoip:cn)
    - reject(all, udp/443)
    - direct(all)
```

A valid legacy rule must be in one of the following formats:

- `outbound(address)`
- `outbound(address, proto/port)`
- `outbound(address, proto/port, hijack_address)`
- `# This is a comment`

### Address types

The `address` field can be one of the following:

- A single IPv4/IPv6 address, e.g. `1.1.1.1` or `2606:4700:4700::1111`
- An IPv4/IPv6 CIDR, e.g. `73.0.0.0/8` or `2001:db8::/32`
- A domain name, e.g. `example.com` (does not include subdomains)
- A domain name with wildcard, e.g. `*.example.com` or `*.google.*`
- A domain suffix, e.g. `suffix:example.com` (matches `example.com` and all its subdomains)
- GeoIP country code, e.g. `geoip:cn` or `geoip:us`
- GeoSite category, e.g. `geosite:netflix` or `geosite:google` (supports attributes, e.g. `geosite:google@cn`)
- `all` - match all addresses

### Proto/port

- `tcp` or `tcp/*` - match all TCP ports
- `udp` or `udp/*` - match all UDP ports
- `tcp/80` - match TCP port 80
- `udp/53` - match UDP port 53
- `udp/20000-30000` - match UDP ports 20000 to 30000
- `*/443` - match TCP and UDP port 443
- `*`, `*/*` or omitted - match both protocols and all ports

> **NOTE:** Before version 2.14.0, a port range starting at 0 (e.g. `udp/0-100`) or port `0` (e.g. `tcp/0`) matched every port. It now matches only the given ports.

### Hijack address

When specified, the connection matching this rule will be hijacked to the specified address. The hijack address must be an IPv4/IPv6 address, not a domain name.

### Mixing legacy rules into `rules`

A `rules` list can also contain legacy rules, so you can add new rules (such as per-user ones) to an existing list without converting it. A `legacy` entry holds one or more legacy lines, and a `legacyFile` entry includes a legacy rules file. Their rules are checked at that position in the list:

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

Errors in legacy entries name both the entry and the line, e.g. `error at rules[3] (/etc/hysteria/acl.txt) line 2: outbound v6_only not found`.

### Converting legacy rules

`hysteria acl translate` prints legacy rules as an equivalent `rules` list, which is also what Hysteria runs internally:

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

It reads from standard input if no file is given. Only the syntax is checked: outbound names and GeoIP/GeoSite names are checked when the server loads the rules.
