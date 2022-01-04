+++
title = "Release Notes"
date = 2019-02-22T15:27:38-05:00
weight = 5
pre = "<b> </b>"
+++

### Recent Changes

- For "Model in Image" domains, added the ability to configure and push an auxiliary image.
- Added these capabilities:
   - Update and uninstall the WebLogic Kubernetes Operator
   - Uninstall the ingress controller
   - Undeploy the WebLogic domain

### Known Issues

- When running the WKT UI application on Windows, the image builder tool (docker or podman) also must be directly executable in Windows.  For example, there is currently no support for running the WKT UI application in Windows and running podman under the Windows Subsystem for Linux (WSL2).  However, running Docker Desktop for Windows with a WSL2 backend _is_ fully supported because the `docker` command is executable directly in Windows (without having to call WSL2). If you need to use podman on Windows, then refer to the podman blog entries at https://podman.io/blogs/2021/09/06/podman-on-macs.html and https://podman.io/blogs/2020/09/02/running_windows_or_mac.html for more information about downloading, installing, and configuring the Windows Remote Client.

- On Linux, the application depends on libGL being installed.  libGL is not currently listed in the dependencies list for the `rpm` (or `deb`) installers.  Therefore, you will need to install libGL using your package manager.  For example:
  ```
	sudo yum install libGL
  ```

- When trying to run the application on a Linux machine and display it on a Windows machine, do not use the Xming X server.  There appears to be a bug (presumably with their OpenGL support) that prevents applications using Electron 13.x or later from working (for example, Microsoft VS Code doesn't work either).

- On Linux, when running the application that was installed using the `rpm` or `deb` installers, the following error messages will appear in the log.  These are expected and can safely be ignored.  The errors are due to the fact that the electron-updater package being used to perform application updates supports only upgrading Linux applications when run using an `AppImage` binary.
  ```
    info: Checking for update
    error: Error: Error: ENOENT: no such file or directory, open '/opt/WebLogic Kubernetes Toolkit UI/resources/app-update.yml'
    error: Application auto-updater failed: ENOENT: no such file or directory, open '/opt/WebLogic Kubernetes Toolkit UI/resources/app-update.yml'
    error: Error: ENOENT: no such file or directory, open '/opt/WebLogic Kubernetes Toolkit UI/resources/app-update.yml'
  ```

- The application is limited to working with archive files whose size is less than 2 GB.
