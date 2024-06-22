# Performance

The following factors are common contributors to bottlenecks in your transfer speed:

- The quality of the connection between your device and the server
- The processing power of your CPU, NIC, etc.
- System buffer sizes
- Flow control receive window sizes
- Server high load

> It's worth noting that QUIC, being a much newer and more complex protocol running in userspace, will inherently require more processing power than the mature, highly optimized kernel-level implementation of TCP. If you want to achieve high transfer speeds, you should not host your server on low-power hardware such as a Raspberry Pi or an extremely low-cost, CPU-throttled VPS.

While the first two are beyond the scope of this documentation, the last two can be tuned to improve performance.

## System buffer sizes

### Linux

```bash
# Set both buffers to 16 MB
sysctl -w net.core.rmem_max=16777216
sysctl -w net.core.wmem_max=16777216
```

### BSD/macOS

```bash
sysctl -w kern.ipc.maxsockbuf=20971520
sysctl -w net.inet.udp.recvspace=16777216
# UDP send buffer doesn't exist on BSD, so there's no "sendspace" to set
```

## Flow control receive window sizes

Hysteria has the following QUIC flow control receive window parameters in both client and server configurations:

```yaml
quic:
  initStreamReceiveWindow: 26843545 # (1)!
  maxStreamReceiveWindow: 26843545 # (2)!
  initConnReceiveWindow: 67108864 # (3)!
  maxConnReceiveWindow: 67108864 # (4)!
```

1. The initial receive window size for each stream. This is the amount of data that can be received before the sender has to wait for the receiver to consume it first. The default is 8 MB.
2. There is an auto-tuning mechanism for the receive window size that will increase the window size as needed, but will not exceed this value. The default is 8 MB.
3. The initial receive window size for the connection. This is the total receive window size for all streams. The default is 20 MB.
4. There is an auto-tuning mechanism for the receive window size that will increase the window size as needed, but will not exceed this value. The default is 20 MB.

You can increase these values if they are too low for your use case, or decrease them if you need to save memory. **We strongly recommend that you maintain a stream-to-connection receive window ratio close to 2/5.** This prevents one or two blocked streams from hogging the entire connection.

## Server high load

Setting Hysteria to real-time highest priority can effectively reduce connection fluctuations under high server load.

Type `systemctl edit hysteria-server.service` in the server terminal and add the following code between the upper and lower comments below:

```service
### Anything between here and the comment below will become the new contents of the file
[Service]
ExecStartPost=/usr/bin/chrt -r -p 99 $MAINPID
CapabilityBoundingSet= CAP_SYS_NICE
AmbientCapabilities= CAP_SYS_NICE
### Lines below this comment will be discarded
```

> Note: This operation is currently experimental. If it performs well, it may become the default configuration of Hysteria and be removed from the documentation in the future.
