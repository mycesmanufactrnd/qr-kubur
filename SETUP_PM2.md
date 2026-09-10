# PM2 Cluster Deployment

This document describes how to configure the backend to run with **5 PM2 clustered workers** inside Docker and limit the backend container to CPU cores **0–4**.

## 1. Install PM2

From the backend project directory, install PM2 as a production dependency:

```bash
npm install pm2 --save
```

---

## 2. Create the PM2 Ecosystem File

Create:

```text
backend/ecosystem.config.cjs
```

The file should contain:

```javascript
module.exports = {
  apps: [
    {
      name: "qubur-backend",
      script: "dist/server.js",
      exec_mode: "cluster",
      instances: 5,
    },
  ],
};
```

### Configuration

| Setting     | Value            | Description                                        |
| ----------- | ---------------- | -------------------------------------------------- |
| `name`      | `qubur-backend`  | PM2 application name                               |
| `script`    | `dist/server.js` | Compiled backend entry point                       |
| `exec_mode` | `cluster`        | Runs multiple workers sharing the same server port |
| `instances` | `5`              | Starts 5 backend worker processes                  |

All five workers can listen on the same application port because PM2 cluster mode coordinates the workers.

---

## 3. Update the Backend Dockerfile

Change the Dockerfile's startup command to use `pm2-runtime`:

```dockerfile
CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
```

### Why `pm2-runtime`?

`pm2-runtime` is designed for running PM2 inside containers.

It:

* Runs PM2 in the foreground
* Keeps Docker's process lifecycle working correctly
* Allows application logs to appear through Docker logs
* Avoids PM2 daemonization
* Handles container termination signals appropriately
* Works with Docker's `restart: unless-stopped` policy
* Allows the application to shut down gracefully

---

## 4. Limit the Backend Container to 5 CPU Cores

Update `docker-compose.yml`:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: ../dockerfiles/backend.prod.dockerfile
  container_name: backend
  restart: unless-stopped
  env_file: .env
  cpuset: "0-4"
  ports:
    - "8083:8083"
  volumes:
    - ./storage_data:/usr/src/app/storage_data
  depends_on:
    - db
```

### CPU Configuration

```yaml
cpuset: "0-4"
```

This restricts the backend container to CPU cores:

```text
0
1
2
3
4
```

This leaves the remaining CPU cores available for the database and other services running on the host.

> **Note:** `cpuset` restricts where the container's processes can execute. It does not mean that each PM2 worker gets exactly one CPU core.

---

## 5. Rebuild the Backend

After making the changes, rebuild the backend image:

```bash
docker compose build backend
```

Then redeploy the container:

```bash
docker compose up -d backend
```

---

## 6. Verify the Container

Check that the backend container is running:

```bash
docker ps
```

You should see the `backend` container running.

You can also check its logs:

```bash
docker logs backend
```

---

## 7. Verify PM2 Workers

Run:

```bash
docker exec -it backend npx pm2 list
```

The PM2 process list should show the `qubur-backend` application with **5 instances**.

A successful configuration should look approximately like:

```text
┌────┬─────────────────┬──────────┬──────┬────────┬─────────┐
│ id │ name            │ mode     │ ↺    │ status │ cpu     │
├────┼─────────────────┼──────────┼──────┼────────┼─────────┤
│ 0  │ qubur-backend   │ cluster  │ ...  │ online │ ...     │
│ 1  │ qubur-backend   │ cluster  │ ...  │ online │ ...     │
│ 2  │ qubur-backend   │ cluster  │ ...  │ online │ ...     │
│ 3  │ qubur-backend   │ cluster  │ ...  │ online │ ...     │
│ 4  │ qubur-backend   │ cluster  │ ...  │ online │ ...     │
└────┴─────────────────┴──────────┴──────┴────────┴─────────┘
```

The important values are:

```text
mode:   cluster
status: online
workers: 5
```

---

## 8. Verify the CPU Affinity

You can confirm the container is restricted to the expected CPUs with:

```bash
docker inspect backend --format '{{.HostConfig.CpusetCpus}}'
```

Expected output:

```text
0-4
```

---

## 9. Verify the Backend Endpoint

Once the workers are online, verify that the backend is responding through the configured port:

```bash
curl http://127.0.0.1:8083
```

If the backend does not expose a root endpoint, test an appropriate API endpoint instead.

When accessed through Nginx, requests should continue to be proxied to:

```text
127.0.0.1:8083
```

Nginx does not need to know that PM2 is running multiple workers behind that port.

---

## 10. Final Architecture

After deployment, the backend architecture is:

```text
                    ┌─────────────────────┐
                    │       Internet      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        Nginx        │
                    │       :443          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Docker: backend    │
                    │      :8083          │
                    │                     │
                    │   PM2 cluster       │
                    │                     │
                    │  Worker 0            │
                    │  Worker 1            │
                    │  Worker 2            │
                    │  Worker 3            │
                    │  Worker 4            │
                    │                     │
                    │    CPU 0–4          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        Database     │
                    └─────────────────────┘
```

## Deployment Checklist

Before considering the deployment complete:

* [ ] PM2 installed with `npm install pm2 --save`
* [ ] `backend/ecosystem.config.cjs` created
* [ ] PM2 configured for `cluster` mode
* [ ] PM2 configured for `5` instances
* [ ] Dockerfile uses `pm2-runtime`
* [ ] Backend container uses `cpuset: "0-4"`
* [ ] Backend image rebuilt
* [ ] Backend container restarted
* [ ] `docker ps` shows the container running
* [ ] `pm2 list` shows 5 online workers
* [ ] Backend endpoint responds correctly
* [ ] Docker logs are working correctly
* [ ] CPU affinity reports `0-4`
