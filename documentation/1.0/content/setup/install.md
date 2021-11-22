---
title: "Install WKT UI"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Install the WKT UI application and check for updates."
---

1. Download the latest WebLogic Kubernetes Toolkit UI (WKT UI) application installers from the [GitHub Releases section](https://github.com/oracle/weblogic-toolkit-ui/releases) of this repository.
2. Simply run the appropriate installer for your operating system.

{{% notice note %}}
On Linux, to get _all_ the dependencies and have them installed in the correct order, you need to use the package manager to install the `rpm` or `deb` file.
{{% /notice %}}

### Prerequisites

For RPM-based systems, such as Oracle, RedHat, CentOS, and some others:

For storing credentials in the OS native credentials store, you must have a desktop environment. If your system does not have a graphical desktop environment,
you can install one; for example, installing GNOME Desktop on Oracle Linux:

https://support.oracle.com/knowledge/Oracle%20Linux%20and%20Virtualization/2717454_1.html

For storing credentials as an encrypted project file, and for a minimum GUI requirement, make sure the following packages are installed in your system:
```
sudo dnf update
sudo dnf install libxshmfence libdrm.x86_64 libgbm alsa-lib xauth atk-devel.x86_64 java-atk-wrapper.x86_64
sudo reboot
```
For Debian-based systems, such as Ubuntu and Debian:

For storing credentials in the OS native credentials store, you must have a desktop environment. If your system does not have a graphical desktop environment,
you can install one; for example, installing GNOME on Ubuntu 20x:
```
sudo apt install gnome-session gdm3
sudo reboot
```

### Installation
For RPM-based systems, download the latest `wktui` `rpm` package from https://github.com/oracle/weblogic-toolkit-ui/releases, then use either `yum` or `dnf`; for example:
```
sudo yum -y localinstall wktui_1.0.0_amd64.rpm
```

For Debian-based systems, download the latest `wktui` `deb` package from https://github.com/oracle/weblogic-toolkit-ui/releases, then run:
```
sudo apt install ./wktui_1.0.0_amd64.deb
```

#### Helpful Hints

- When launching `wktui`, if you see this:
    ```
    libGL error: No matching fbConfigs or visuals found
    libGL error: failed to load driver: swrast
    ```
    This is harmless and can be removed by setting the environment variable:

    `export LIBGL_ALWAYS_INDIRECT=1`


- If you are storing credentials in the OS native store, and you see this failure message:
    ```
    Error occurred in handler for 'save-project': Error: Failed to save credential for image.
    imageRegistryPushUser: Error: No such interface "org.freedesktop.Secret.Collection" on object at path /
    org/freedesktop/secrets/collection/login
        at /tmp/.mount_WebLogpIPFto/resources/app.asar/app/js/credentialManager.js:92:32
    ```
    You can solve it by running this command (only once) before launching `wktui`:

    `dbus-update-activation-environment --systemd DBUS_SESSION_BUS_ADDRESS DISPLAY XAUTHORITY`



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
