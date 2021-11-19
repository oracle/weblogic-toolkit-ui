---
title: "Install WKT UI"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Install the WKT UI application and check for updates."
---

1. Download the latest WebLogic Kubernetes Toolkit UI (WKT UI) application installers from the [GitHub Releases section](https://github.com/oracle/weblogic-toolkit-ui/releases) of this repository.
2. Simply run the appropriate installer for your operating system.

**NOTE**: When installing on Linux, to get _all_ the dependencies and installed in the correct order, use a command similar to the following:
```
sudo yum localinstall wktui-1.0.0.x86_64.rpm
```

- On Oracle/RedHat/CentOS (and some others), use either `yum` or `dnf`
- On Ubuntu, run:
```
sudo dpkg -i wktui_1.0.0_amd64.deb
```
You may see output like the following:
```
Selecting previously unselected package wktui.
(Reading database ... 70158 files and directories currently installed.)
Preparing to unpack wktui_1.0.0_amd64.deb ...
Unpacking wktui (1.0.0-784) ...
dpkg: dependency problems prevent configuration of wktui:
 wktui depends on gconf2; however:
  Package gconf2 is not installed.
 wktui depends on gconf-service; however:
  Package gconf-service is not installed.
 wktui depends on libnotify4; however:
  Package libnotify4 is not installed.
 wktui depends on libappindicator1; however:
  Package libappindicator1 is not installed.
 wktui depends on libxtst6; however:
  Package libxtst6 is not installed.
 wktui depends on libsecret-1-dev; however:
  Package libsecret-1-dev is not installed.

dpkg: error processing package wktui (--install):
 dependency problems - leaving unconfigured
Processing triggers for shared-mime-info (1.15-1) ...
Processing triggers for mime-support (3.64ubuntu1) ...
Errors were encountered while processing:
 wktui
```
If so, then run:
```
sudo apt-get install -f
```
If you run `wktui` from an OS terminal shell. You may see this:
```
wktui
libGL error: No matching fbConfigs or visuals found
libGL error: failed to load driver: swrast```
```
This is harmless and can be removed by setting this environment variable before launching `wktui`:

`export LIBGL_ALWAYS_INDIRECT=1`


### Application Startup

Application startup detects Internet connectivity to GitHub. If it fails to connect, a `Network Configuration` dialog appears in which you can set or modify your proxy settings, test your changes, and then restart the application.  

Launching the application displays a thorough "Introduction" to the WKT UI. Step through it or dismiss it; you can peruse it at any time using `Help > Show Introduction`.

### Version Updates

Upon application startup, if a more recent version exists, an Application Update dialog appears with these choices:

- `Install Now`
- `Install on Exit`
    - Downloads the application and installs it after you exit.
    - Not available on MacOS.
- `Ignore Update`

At any time, you can check for application updates using `Help > Check for WKT UI Updates`.

For updates to in-application versions of WKT Tools (WebLogic Deploy Tooling and WebLogic Image Tool), select `Help > Check for WKT Tool Updates`.
