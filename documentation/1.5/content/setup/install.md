---
title: "Install WKT UI"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 3
description: "Install the WKT UI application and check for updates."
---

1. Download the latest WebLogic Kubernetes Toolkit UI (WKT UI) application installers from the [GitHub Releases section](https://github.com/oracle/weblogic-toolkit-ui/releases) of this repository.
2. Simply run the appropriate installer for your operating system.


**NOTE**: On Linux, to get _all_ the dependencies and have them installed in the correct order, you need to use the package manager to install the `rpm` or `deb` file. First, be sure to review the Linux prerequisites [here]({{< relref "/setup/prerequisites.md" >}}).

- For RPM-based systems, use either `yum` or `dnf`; for example:
    ```
    yum update
    sudo yum -y localinstall wktui_1.0.0_amd64.rpm
    ```

- For Debian-based systems, use:
    ```
    sudo apt update
    sudo apt upgrade
    sudo apt install ./wktui_1.0.0_amd64.deb
    ```

If the installation is on a server machine, you should `logout` from the current terminal session and use X11 forwarding mechanism or any remote desktop application to the remote terminal for launching the WKT UI application.

Alternatively, you can download the `AppImage` file, copy it to your local file system, then either:
- Open a terminal, navigate to the directory where the file exists, and make it executable; for example:

    `chmod u+x <AppImage Name>`

- Use your file manager, right click on the file, edit the properties, and change the permissions to  make it executable.

If you download and run the `AppImage` file, you get the added benefits of 1.) Not requiring an installation or root access and 2.) Being able to participate in the auto-update functionality, like macOS and Windows.

#### Helpful Hints

- When launching the WKT UI application, if you see this:
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
    You can solve it by running this command (only once) before launching the WKT UI application:

    `dbus-update-activation-environment --systemd DBUS_SESSION_BUS_ADDRESS DISPLAY XAUTHORITY`

### Application Startup

Application startup detects Internet connectivity to GitHub. If it fails to connect, a `Network Configuration` dialog appears in which you can set or modify your proxy settings, test your changes, and then restart the application.  

Launching the application displays a thorough "Introduction" to the WKT UI. Step through it or dismiss it; you can peruse it at any time using `Help > Show Introduction`.

### Version Updates

Upon application startup, if a more recent version exists, an Application Update dialog appears with these choices:

- `Install Now`
- `Install on Exit`
    - Downloads the application and installs it after you exit.
    - Not available on macOS.
- `Ignore Update`

At any time, you can check for application updates using `Help > Check for WKT UI Updates`.

For updates to in-application versions of WKT Tools (WebLogic Deploy Tooling and WebLogic Image Tool), select `Help > Check for WKT Tool Updates`.
