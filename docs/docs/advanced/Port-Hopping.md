# Port Hopping

Users in China sometimes report that their ISPs block or throttle persistent UDP connections. However, these restrictions often only apply to the specific port being used. Port hopping can be used as a workaround for this situation.

## Client

The Hysteria client supports a special multi-port address format:

```python
example.com:1234,5678,9012 # (1)!
example.com:20000-50000 # (2)!
example.com:1234,5000-6000,7044,8000-9000 # (3)!
```

1. Multiple individual ports.
2. A range of ports.
3. A combination of both.

There is no limit to the number of ports you can specify.

The client will randomly select one of the specified ports for the initial connection and will periodically switch to a different port. The option for controlling the interval is `hopInterval` in the `transport` section:

=== "Fixed interval"

    ```yaml
    transport:
      udp:
        hopInterval: 30s # (1)!
    ```

    1. 30s is the default. It must be at least 5s.

=== "Random interval"

    ```yaml
    transport:
      udp:
        minHopInterval: 15s # (1)!
        maxHopInterval: 45s # (2)!
    ```

    1. The minimum port hopping interval. Must be at least 5s.
    2. The maximum port hopping interval.

    Each hop will use a random interval between `minHopInterval` and `maxHopInterval`. This makes the hopping pattern less predictable and harder to detect.

> **NOTE:** You can either use `hopInterval` for a fixed interval, or `minHopInterval`/`maxHopInterval` for a random interval. You cannot use both.

Assuming the server is reachable on all the ports you specified, the hopping process is transparent to the upper layers and should not cause any data loss/disconnection.

## Server

### Built-in port range (Linux)

On Linux, the Hysteria server has built-in support for listening on a port range. Simply specify a port range in the `listen` field:

```yaml
listen: :20000-50000
```

The server will listen on the first port in the range and automatically set up firewall rules (using nftables or iptables) to redirect traffic from all other ports to the first port. The rules are automatically cleaned up when the server shuts down.

> **NOTE:** This requires either `nft` (nftables) or `iptables`/`ip6tables` to be available on the system. The server may need to be run with appropriate privileges (e.g. root or `CAP_NET_ADMIN`) to modify firewall rules.

### Manual setup

Usually not needed, but you can use iptables or nftables DNAT to forward the ports manually:

=== "iptables"

    ```bash
    # IPv4
    iptables -t nat -A PREROUTING -i eth0 -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
    # IPv6
    ip6tables -t nat -A PREROUTING -i eth0 -p udp --dport 20000:50000 -j REDIRECT --to-ports 443
    ```

=== "nftables"

    ```nginx
    define INGRESS_INTERFACE="eth0"
    define PORT_RANGE=20000-50000
    define HYSTERIA_SERVER_PORT=443

    table inet hysteria_porthopping {
      chain prerouting {
        type nat hook prerouting priority dstnat; policy accept;
        iifname $INGRESS_INTERFACE udp dport $PORT_RANGE counter redirect to :$HYSTERIA_SERVER_PORT
      }
    }
    ```

In this example, the server listens on port 443, but the client can connect to any port in the range 20000-50000.
