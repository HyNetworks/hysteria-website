# Mimic

[Mimic](https://github.com/hack3ric/mimic) is a third-party tool that disguises UDP packets as TCP. Hysteria has built-in integration with it, so you can enable it directly in your config without setting mimic up by hand.

To middleboxes on the path, a Hysteria connection then looks like TCP rather than UDP - which may be preferable, or even necessary for Hysteria to work at all in some restrictive networks.

Note that this does not mean Hysteria actually speaks TCP. It still uses QUIC over UDP, only wrapped so that it appears to be TCP on the wire. **This is a form of obfuscation, not a protocol change.**

## How it works

Mimic attaches eBPF programs to a network interface and rewrites packets as they leave and enter the machine: outgoing UDP packets get a fake TCP header, incoming ones have it stripped. The rewriting happens below the socket, so Hysteria still sends and receives normal QUIC.

Because both directions have to agree on the disguise, **mimic must be enabled on the server and the client.**

## Prerequisites

Mimic is **Linux only** and is not bundled with Hysteria. On both machines you need:

- The `mimic` program available in `PATH` (or configured explicitly, see below).
- Its kernel module loaded (`modprobe mimic`).
- **root privileges** for Hysteria itself, since attaching eBPF programs requires them.

See mimic's own [Getting Started](https://github.com/hack3ric/mimic/blob/master/docs/getting-started.md) guide for installation, and [mimic(1)](https://github.com/hack3ric/mimic/blob/master/docs/mimic.1.md) for its full command-line reference.

You do **not** need to set up mimic's systemd service or write an interface config file. Hysteria starts and manages mimic automatically.

## Configuration

The same `mimic` block works in both server and client configs.

Minimal example:

```yaml
mimic:
  enabled: true
```

**In most cases `enabled: true` on both sides is all you need.**

Full example:

```yaml
mimic:
  enabled: true # (1)!
  interface: eth0 # (2)!
  xdpMode: skb # (3)!
  path: /usr/bin/mimic # (4)!
  extraArgs: [] # (5)!
```

1. Whether to enable mimic. **Must match on both ends.**
2. The interface to attach to. Optional; by default Hysteria picks the one that carries traffic to the peer.
3. Force the XDP attach mode, either `native` or `skb`. Optional; leave it unset unless mimic fails to attach, which happens with some drivers that misbehave in native mode.
4. Path to the mimic executable. Optional; looked up in `PATH` by default.
5. Extra arguments passed to mimic verbatim, for tuning that has no Hysteria equivalent (padding, handshake and keepalive parameters). Optional.

## Important behaviors

- **A mimic-enabled server is unreachable without mimic.** Clients that do not use it get no response at all, which looks like a network problem rather than a configuration error. Enabling it is a breaking change for existing clients - plan the switch on both ends together.

- **It cannot be combined with [port hopping](Port-Hopping.md).** Mimic matches traffic by a single address and port, while port hopping moves the port across a range. Hysteria rejects such a config at startup.

- **One mimic instance serves the whole machine.** Because mimic attaches to an interface rather than a socket, several Hysteria processes reaching the same server share one instance. Hysteria reuses a running one if its filters already cover the address, and refuses to start if they do not, rather than sending packets it is not rewriting.
