---
title: "Install WKT UI"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Install the WKT UI application and check for updates."
---

1. Download the latest WebLogic Kubernetes Toolkit UI (WKT UI) application installers from the [Github Releases section](https://github.com/oracle/weblogic-toolkit-ui/releases) of this repository.
1. Simply run the appropriate installer for your operating system.

Application startup detects Internet connectivity to GitHub. If it fails to connect, a `Network Configuration` dialog appears in which you can set or modify your proxy settings, test your changes, and then restart the application.  

Launching the application displays a thorough "Introduction" to the WKT UI. Step through it or dismiss it; you can peruse it at any time using `Help > Show Introduction`.

### Version Updates

Upon application startup, if a more recent version exists, an Application Update dialog appears with these choices:

- `Install Now`
- `Install on Exit`
    - Not available on MacOS.
    - Downloads the application and installs it after you exit.
- `Ignore Update`

At any time, you can check for application updates using `Help > Check for WKT UI Updates`.

For updates to in-application versions of WKT Tools (WebLogic Deploy Tooling and WebLogic Image Tool), select `Help > Check for WKT Tool Updates`.
