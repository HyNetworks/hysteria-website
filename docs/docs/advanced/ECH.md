# ECH

ECH (Encrypted Client Hello) encrypts the TLS ClientHello, including the SNI (Server Name Indication), so that only a decoy "public name" is visible to middleboxes.

Without ECH, the SNI travels in cleartext in every handshake, making it possible for middleboxes to inspect and block. With ECH, the real server name is inside an encrypted payload.

Note that ECH only protects the SNI in the QUIC/TLS handshake. If you already use [obfuscation](Full-Server-Config.md#obfuscation), the entire connection is already unrecognizable as QUIC, so ECH provides no additional benefit. ECH is most useful in "bare" mode, where the QUIC handshake is standard and the SNI is the main plaintext fingerprint.

## How it works

An ECH deployment has two artifacts, generated together as a key pair:

- A **private key** that stays on the server and is used to decrypt the real ClientHello.
- A **config list** (public) that clients use to encrypt their ClientHello. It also contains the **public name** - the decoy SNI that appears in cleartext.

When a client connects with ECH, it sends a ClientHello whose visible SNI is the public name (e.g. `decoy.example.com`), while the real SNI and the rest of the handshake are encrypted inside the ECH extension.

## Generating keys

Hysteria does not generate ECH keys itself. We recommend using [sing-box](https://github.com/SagerNet/sing-box) to create a key pair:

```bash
sing-box generate ech-keypair decoy.example.com
```

The argument is the public name. It does NOT have to be a domain you own, but for best camouflage it should be an innocuous name that plausibly serves normal traffic. The command prints two PEM blocks:

```
-----BEGIN ECH CONFIGS-----
...
-----END ECH CONFIGS-----
-----BEGIN ECH KEYS-----
...
-----END ECH KEYS-----
```

Save the entire output to a file (e.g. `ech.pem`). The server reads the `ECH KEYS` block from it; you do not need to split the blocks apart manually.

```bash
sing-box generate ech-keypair decoy.example.com > ech.pem
```

## Server setup

Add an `ech` block pointing to the key file.

```yaml
ech:
  keyPath: ech.pem
```

On startup, the server logs the config list that clients need:

```
INFO ECH enabled, set the following config list on clients (tls.ech) {"configList": "AEz+DQBIAAAg..."}
```

Copy that base64 string - it is what you give to clients. (It is the same value as the `ECH CONFIGS` block, just base64-encoded on a single line.)

## Client setup

Set `tls.ech` to the config list from the server log. The value can be the base64 string directly, or a path to a file containing it (either the raw base64 or the `ECH CONFIGS` PEM block):

```yaml
tls:
  sni: real.example.com # (1)!
  ech: AEz+DQBIAAAg... # (2)!
```

1. Your real server name, used for certificate verification.
2. The config list from the server log, or a path to a file containing it.

The config list can also be carried in a [sharing URI](../developers/URI-Scheme.md) via the `ech` query parameter.

## Important behaviors

- **Enabling ECH is backward-compatible.** A server with ECH enabled still accepts clients that do not use ECH; those clients simply send their SNI in cleartext as before. This means you can enable ECH on the server without breaking existing clients.

- **Fail-closed.** If a client is configured for ECH but the server rejects it (for example because the config list is stale after the keys were regenerated, or the server has no ECH configured at all), the connection **fails**.

- **`insecure` does not apply to ECH rejection.** When ECH is rejected, the TLS stack performs a mandatory certificate check against the public name and ignores `tls.insecure`. If you are testing with a self-signed certificate and the server is not actually accepting ECH, you will see a certificate verification error.
