# URI Scheme

The Hysteria 2 URI scheme is designed to provide a compact representation of the necessary information for connecting to a Hysteria 2 server. It captures various parameters such as server address, authentication details, obfuscation type and parameters, TLS settings.

## Structure

```
hysteria2://[auth@]hostname[:port]/?[key=value]&[key=value]...
```

## Components

### Scheme

`hysteria2` or `hy2`

### Auth

Authentication credentials should be specified in the `auth` component of the URI. This is essentially the username part of the standard URI format, and therefore needs to be [percent-encoded](https://datatracker.ietf.org/doc/html/rfc3986#section-2.1) if it contains special characters.

A special case is when the server uses the `userpass` authentication, in which case the `auth` component should be formatted as `username:password`.

### Hostname

The hostname and optional port of the server. If the port is omitted, it defaults to 443.

The port part supports the "multi-port" format mentioned in [Port Hopping](../advanced/Port-Hopping.md).

### Query parameters

- `obfs`: The type of obfuscation to be used. Currently `salamander` and `gecko` are supported.

- `obfs-password`: The password required for the specified obfuscation type, if applicable.

- `sni`: Server Name Indication to be used for TLS connections.

- `insecure`: Determines if insecure TLS connections are allowed. Accepts boolean values "1" for true and "0" for false.

- `pinSHA256`: The pinned SHA-256 fingerprint of the server's certificate.

- `ech`: The [ECH](../advanced/ECH.md) config list (base64). Must match the server's ECH configuration.

## Example

```
hysteria2://letmein@example.com:123,5000-6000/?insecure=1&obfs=salamander&obfs-password=gawrgura&pinSHA256=deadbeef&sni=real.example.com
```

## Realm mode

[Hysteria Realms](../advanced/Realms.md) normally uses its own `realm://` URI, with the Hysteria password supplied separately in the config file. The `hysteria2+realm://` scheme bundles a realm address together with Hysteria connection parameters, so a realm-mode server can be shared as a single URI.

### Structure

```
hysteria2+realm://<token>@<rendezvous-host>[:port]/<realm-name>?[key=value]&[key=value]...
```

The address components mirror the `realm://` URI, not `hysteria2://`:

- **Scheme:** `hysteria2+realm` uses HTTPS. `hysteria2+realm+http` uses plain HTTP.
- **Token:** the userinfo component is the rendezvous server's token, **NOT** the Hysteria password (see the `auth` parameter below).
- **Hostname:** the address of the rendezvous server, **NOT** the Hysteria server. The port hopping format is not supported for now.
- **Realm name:** the path component. The server and client must use the same one.

### Parameters

All `hysteria2://` query parameters apply (`obfs`, `obfs-password`, `sni`, `insecure`, `pinSHA256`, `ech`), **plus**:

- `auth`: Hysteria authentication credentials. (In the `hysteria2://` scheme this lives in the userinfo component, but here the userinfo is taken by the realm token.)

- `stun`: Override the STUN servers. Repeat the parameter to provide multiple servers.

- `lport`: Bind the local UDP socket to a specific source port (1-65535). Defaults to ephemeral.

### Example

```
hysteria2+realm://mytoken@rendezvous.example.com/my-cabin-1f3a8c2e9b?auth=your_password&insecure=1&pinSHA256=deadbeef
```

## Implementation notes

The URI is intentionally designed to contain only the essential information needed to connect to a Hysteria 2 server. While third-party implementations are free to add additional parameters if necessary, they must not assume that other implementations will understand them.

Furthermore, the parameters should never include client modes (HTTP, SOCKS5, etc.) or bandwidth values. Users should be aware that these things are not meant to be shared and used blindly by others, as they are specific to each user and should be configured accordingly.
