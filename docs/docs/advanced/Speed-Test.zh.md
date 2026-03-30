# 速度测试

Hysteria（自 2.3.0 版本起）内置了一个速度测试工具，允许客户端与服务器进行下载和上传测速，前提是 [服务器在其配置中启用了速度测试支持](Full-Server-Config.md#_9)。

=== "默认配置 (config.yaml)"

    ```bash
    ./hysteria-linux-amd64-avx speedtest
    ```

=== "自定义文件名"

    ```bash
    ./hysteria-linux-amd64-avx speedtest -c whatever.yaml
    ```

> **注意：** 测速工具像正常代理模式一样，依然会遵守你在配置文件中的带宽设置。如果使用了 Brutal 拥塞控制，它不会为你探测带宽。

默认使用**基于时间的模式**，分别测试下载和上传各 10 秒。也可以通过指定 `--data-size` 切换到**基于大小的模式**，传输固定字节数。

```
Usage:
  hysteria speedtest [flags]

Flags:
      --data-size uint32    数据大小（字节），设置后切换为基于大小的模式
      --duration duration   每个方向的测试时长（默认 10s）
  -h, --help                help for speedtest
      --skip-download       跳过下载测试
      --skip-upload         跳过上传测试
      --use-bytes           使用字节/秒而非比特/秒显示速度
```

示例：

```bash
# 默认：基于时间，每个方向 10 秒
./hysteria speedtest

# 基于时间，自定义时长
./hysteria speedtest --duration 30s

# 基于大小：每个方向传输 200 MB
./hysteria speedtest --data-size 209715200
```

速度测试连接由服务器内部处理，因此不受 ACL 和出站规则等的影响。但是速度测试产生的流量仍会计入该用户的流量统计中。
