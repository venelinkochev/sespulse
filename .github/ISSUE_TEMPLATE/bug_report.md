---
name: Bug report
about: Something is broken in SESPulse
title: ""
labels: bug
---

**What were you trying to do?**

<!-- e.g. "filter logs by domain", "see open rate in the overview" -->

**What actually happened?**

<!-- screenshots welcome, but redact any real recipient email addresses -->

**Logs**

<details>
<summary>worker logs</summary>

```
docker compose logs worker | tail -n 100
```

</details>

<details>
<summary>web logs</summary>

```
docker compose logs web | tail -n 100
```

</details>

**Environment**

- SESPulse version / commit:
- Deployment: docker compose / bare metal / other
- AWS region:
- SES event types enabled on the configuration set:
