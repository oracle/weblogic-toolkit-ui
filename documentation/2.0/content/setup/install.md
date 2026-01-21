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
| WebLogic-Kubernetes-Toolkit-UI-1.4.1-arm64.dmg | macOS Apple Silicon (M1+) installer.   |
| WebLogic-Kubernetes-Toolkit-UI-1.4.1.AppImage  | Linux AppImage executable.             |
| WebLogic-Kubernetes-Toolkit-UI-1.4.1.dmg       | macOS Intel (x86-64) installer.        |
| WebLogic-Kubernetes-Toolkit-UI-Setup-1.4.1.exe | Windows installer.                     |
| wktui-1.4.1.x86_64.rpm                         | Linux RPM package installer.           |
| wktui_1.4.1_amd64.deb                          | Linux DEB package installer.           |

The Linux AppImage package is not an installer. It is a portable packaging of the application that can run directly
without installation on a compatible Linux machine.  For more information, see https://appimage.org/.

**NOTE**: On Linux, to get _all_ the dependencies and have them installed in the correct order, you need to use the
package manager to install the `rpm` or `deb` file. First, be sure to review the Linux prerequisites 
[here]({{% relref "/setup/prerequisites.md" %}}).

- For RPM-based systems, use either `yum` or `dnf`; for example:
    ```
    sudo dnf update
    sudo dnf -y install ./wktui_1.0.0_amd64.rpm
    ```

- For Debian-based systems, use:
    ```
    sudo apt update
    sudo apt upgrade
    sudo apt install ./wktui_1.0.0_amd64.deb
    ```

If the installation is on a server machine, you should `logout` from the current terminal session and use X11 forwarding
mechanism or any remote desktop application to the remote terminal for launching the WKT UI application.

Alternatively, you can download the `AppImage` file, copy it to your local file system, then either:
- Open a terminal, navigate to the directory where the file exists, and make it executable; for example:

    `chmod u+x <AppImage Name>`

- Use your file manager, right click on the file, edit the properties, and change the permissions to  make it executable.

If you download and run the `AppImage` file, you get the added benefits of 1.) Not requiring an installation or root 
access and 2.) Being able to participate in the auto-update functionality, like macOS and Windows.

#### AppImage on Oracle Linux 8

A base Oracle Linux 8 may need additional packages installed to get the AppImage executable to run successfully.  Given
that your machine may have various packages installed, it is impossible to give the minimal list needed.  However, Oracle
has tested with the AppImage and was able to get it working on Oracle Linux 8 by doing the following steps. Note that
these tests were conducted using SSH tunneling of X11, which requires some extra configuration not covered in this section.

1. Install the Oracle EPEL Release Package

`sudo dnf install -y oracle-epel-release-el8.x86_64`

2. Install the `yum-utils` package, if not already installed

`sudo dnf install -y yum-utils`

3. Enable the EPEL repository.

`sudo dnf config-manager --set-enabled ol8_developer_EPEL`

4. Install core X11 packages.

`sudo dnf install xorg-x11-server-Xorg libX11 libXrender libXtst xauth`

5. Install packages for FUSE support

`sudo dnf install fuse-common fuse-libs ocifs`

6. Install ATK support libraries

`sudo dnf install atk java-atk-wrapper at-spi2-atk gtk3 libXt`

7. Install Mesa-related libraries

`sudo dnf install mesa-libgbm alsa-lib mesa-dri-drivers`

#### Helpful Hints

- When launching the WKT UI application, if you see this:
    ```
    libGL error: No matching fbConfigs or visuals found
    libGL error: failed to load driver: swrast
    ```
    This is harmless and can be removed by setting the environment variable:

    `export LIBGL_ALWAYS_INDIRECT=1`


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
