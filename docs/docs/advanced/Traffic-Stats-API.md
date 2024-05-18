# Traffic Stats API

### GET `/traffic`

This endpoint returns a JSON map of client IDs to their traffic statistics.

Response:

```json
{
  "wang": {
    "tx": 514,
    "rx": 4017
  },
  "joe": {
    "tx": 7790,
    "rx": 446623
  }
}
```

You can also use the query parameter `clear` to zero out the statistics after they are returned:

```
/traffic?clear=1
```

### POST `/kick`

This endpoint allows you to kick a list of clients by their IDs.

Request:

```json
["wang", "joe"]
```

> **NOTE:** Due to the reconnect logic built into the client, it will attempt to reconnect after being kicked. To avoid having to repeatedly kick the same client, you should also block the user in your authentication backend.

### GET `/online`

This endpoint returns a JSON map of online clients to the number of connections they have. The connection count here refers to the number of Hysteria client instances ("devices"), NOT the number of active proxy connections.

Response:

```json
{
  "wang": 2,
  "joe": 1
}
```
