+++
title = "Release Notes"
date = 2019-02-22T15:27:38-05:00
weight = 5
pre = "<b> </b>"
+++

### Known Issues

- On Windows, the Application Update dialog `Install on Exit` works _only_ if you installed the application for the current user only.  If the application was installed for all users, `Install on Exit` will cause the older version of the application to be uninstalled but the new version will not be installed.  This is due to issue https://github.com/electron-userland/electron-builder/issues/6329.

- When running the WKT UI application on Windows, the image builder tool (docker or podman) also must be directly executable in Windows.  For example, there is currently no support for running the WKT UI application in Windows and running podman under the Windows Subsystem for Linux (WSL2).  However, running Docker Desktop for Windows with a WSL2 backend _is_ fully supported because the `docker` command is executable directly in Windows (without having to call WSL2). If you need to use podman on Windows, then refer to the podman blog entries at https://podman.io/blogs/2021/09/06/podman-on-macs.html and https://podman.io/blogs/2020/09/02/running_windows_or_mac.html for more information about downloading, installing, and configuring the Windows Remote Client.
