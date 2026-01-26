---
title: "Prerequisites"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 1
---

To work through the Quick Start guide, you will need to install the following software:

- Docker (or Podman) – If running on Windows or macOS, try Rancher Desktop, Docker Desktop, or even Podman Desktop.
- `kubectl` – The Kubernetes client; the version should align with the Kubernetes cluster version.
- Oracle JDK 8, 11, 17, or 21 to align with the version of WebLogic Server you plan to use.
- WebLogic Server 14.1.1, 14.1.2, or 15.1.1
- Helm 3.9 or later
- Maven 3.6 or later – Only needed if rebuilding the sample application WAR file.

Note that while the sample application can run on WebLogic Server 12.2.1.4, you will need to change the 
`quickstart/app/src/main/webapp/WEB-INF/web.xml` deployment descriptor to point to the Java EE 7 Web Application 3.1
specification and rebuild the binary by running `mvn clean package` in the `quickstart/app` directory.
