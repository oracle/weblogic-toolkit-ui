---
title: "Install WKT UI"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 3
description: "Install the WKT UI application and check for updates."
---

To install the WebLogic Kubernetes Toolkit UI (WKT UI):

1. Download the latest WebLogic Kubernetes Toolkit UI (WKT UI) application installers from the 
   [GitHub Releases section](https://github.com/oracle/weblogic-toolkit-ui/releases) of this repository.
2. Run the appropriate installer for your operating system.

Each release has many assets, some of which are needed for the application’s auto-update functionality and are not
intended to be used for installing the application.  The following table lists the installer file names and their
purpose.

| Installer File Name                            | Purpose                                |
|------------------------------------------------|----------------------------------------|
| WebLogic-Kubernetes-Toolkit-UI-2.0.0-arm64.dmg | macOS Apple Silicon (M1+) installer.   |
| WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage  | Linux AppImage executable.             |
| WebLogic-Kubernetes-Toolkit-UI-2.0.0.dmg       | macOS Intel (x86-64) installer.        |
| WebLogic-Kubernetes-Toolkit-UI-Setup-2.0.0.exe | Windows installer.                     |
| wktui-2.0.0.x86_64.rpm                         | Linux RPM package installer.           |
| wktui_2.0.0_amd64.deb                          | Linux DEB package installer.           |

**NOTE**: The WKT UI application is built using the Electron framework and as such, we support only the platforms and
versions supported by [Electron](https://github.com/electron/electron?tab=readme-ov-file#platform-support).  For example,
because of the Electron requirement for Fedora 32 or newer, we support _only_ versions 8.0 and higher of Oracle Linux,
RedHat Linux, and CentOS Linux.

The Linux AppImage package is not an installer. It is a portable packaging of the application that can run directly
without installation on a compatible Linux machine.  For more information, see https://appimage.org/.

**NOTE**: On Linux, to get _all_ the dependencies and have them installed in the correct order, you need to use the
package manager to install the `rpm` or `deb` file. First, be sure to review the Linux prerequisites 
[here]({{% relref "/setup/prerequisites.md" %}}).

- For RPM-based systems, use either `yum` or `dnf`; for example:
    ```
    sudo dnf update -y
    sudo dnf localinstall -y ./wktui-2.0.0.x86_64.rpm
    ```

- For Debian-based systems, use:
    ```
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y ./wktui_2.0.0_amd64.deb
    ```

If the installation is on a server machine, you should `logout` from the current terminal session and use X11 forwarding
mechanism or any remote desktop application to the remote terminal for launching the WKT UI application.

Alternatively, you can download the `AppImage` file, copy it to your local file system, then either:
- Open a terminal, navigate to the directory where the file exists, and make it executable; for example:

    `chmod u+x <AppImage Name>`

- Use your file manager, right click on the file, edit the properties, and change the permissions to  make it executable.

If you download and run the `AppImage` file, you get the added benefits of 1.) Not requiring an installation and 
2.) Being able to participate in the auto-update functionality, like macOS and Windows.  

As part of the WKT UI 2.0 release, Oracle tested the installers on different flavors and versions of Linux.  All tests
were conducted with clean OCI VMs configured to use X11 Forwarding.  The following sections discuss what had to be
installed for each installer type on the Linux flavors and versions to get WKT UI to work properly.  If you have a Linux
Desktop environment, the packages needed may vary slightly. 

There will likely be some errors related to OpenGL printed to the terminal window but the application will
start and function properly.  For example, when launching the WKT UI application, if you see this:

```
libGL error: No matching fbConfigs or visuals found
libGL error: failed to load driver: swrast
```

This is harmless and setting the environment variable should eliminate this error:

    `export LIBGL_ALWAYS_INDIRECT=1`

With WKT UI 2.0.0, the Electron version in use made a change to default their applications to run as a native Wayland
app.  If you have trouble running the application, using the flag `--ozone-platform=x11` allows you to tell Electron to
change back to using the previous default. See the 
[Electron Breaking Changes](https://www.electronjs.org/docs/latest/breaking-changes#removed-electron_ozone_platform_hint-environment-variable) 
documentation for more information.

The steps we followed (after setting up X11 Forwarding) for each Linux flavor and version tested were as follows.

#### RPM Installer on Oracle Linux 8 and Oracle Linux 9

```
sudo dnf update -y
sudo dnf localinstall -y ./wktui-2.0.0.x86_64.rpm
sudo dnf install -y alsa-lib mesa-dri-drivers
wktui
```

#### DEB Installer on Ubuntu 22.04

```
sudo apt update
sudo apt install -y libgbm1 libasound2
sudo apt install -y ./wktui_2.0.0_amd64.deb
sudo apt upgrade -y
sudo reboot
wktui 
```

#### DEB Installer on Ubuntu 24.04

```
sudo apt update
sudo apt install -y libgbm1 libasound2t64
sudo apt install -y ./wktui_2.0.0_amd64.deb
sudo apt upgrade -y
sudo reboot now
wktui 
```

#### AppImage on Oracle Linux 8 and Oracle Linux 9

```
sudo dnf update -y
sudo dnf install -y fuse-common fuse-libs ocifs atk at-spi2-atk gtk3 libXt mesa-libgbm alsa-lib mesa-dri-drivers
chmod +x .WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage
./WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage
```

#### AppImage on Ubuntu 22.04

```
sudo apt update
sudo apt install -y libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libgdk-pixbuf-2.0-0 libcairo2 libpango-1.0-0 \
 libpangocairo-1.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libnss3 libcups2 libdbus-1-3 \
 libx11-xcb1 libxcb1 libxext6 libxrender1 libxtst6 libasound2 libfuse2
sudo apt upgrade -y
sudo reboot now
chmod +x ./WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage
./WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage
```

#### AppImage on Ubuntu 24.04

```
sudo apt update
sudo apt install -y libatk1.0-0 libatk-bridge2.0-0 libgtk-3-0 libgdk-pixbuf-2.0-0 libcairo2 libpango-1.0-0 \
 libpangocairo-1.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libnss3 libcups2 libdbus-1-3 \
 libx11-xcb1 libxcb1 libxext6 libxrender1 libxtst6 libasound2t64 libfuse2t64
sudo apt upgrade -y
sudo reboot now
chmod +x ./WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage
./WebLogic-Kubernetes-Toolkit-UI-2.0.0.AppImage --no-sandbox
```

### Application Startup

Application startup detects Internet connectivity to GitHub. If it fails to connect, a `Network Configuration` dialog
appears in which you can set or modify your proxy settings, test your changes, and then restart the application.  

Launching the application displays a thorough "Introduction" to the WKT UI. Step through it or dismiss it; you can 
peruse it at any time using `Help > Show Introduction`.

### Version Updates

Upon application startup, if a more recent version exists, an Application Update dialog appears with these choices:

- `Install Now`
- `Install on Exit`
    - Downloads the application and installs it after you exit.
    - Not available on macOS.
- `Ignore Update`

At any time, you can check for application updates using `Help > Check for WKT UI Updates`.

For updates to in-application versions of WKT Tools (WebLogic Deploy Tooling and WebLogic Image Tool), select
`Help > Check for WKT Tool Updates`.
