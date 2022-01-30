+++
title = "Release Notes"
date = 2022-01-13T15:27:38-05:00
weight = 5
pre = "<b> </b>"
+++

### Recent Changes

- For "Model in Image" domains, added the ability to configure, push, and use an auxiliary image.
- Added these actions:
   - Validate WDT model files
   - Create and push an auxiliary image
   - Update and uninstall the WebLogic Kubernetes Operator
   - Undeploy the WebLogic domain
   - Uninstall the ingress controller

### Known Issues

- When running the WKT UI application on Windows, the image builder tool (Docker or Podman) also must be directly executable in Windows.  For example, there is currently no support for running the WKT UI application in Windows and running Podman under the Windows Subsystem for Linux (WSL2).  However, running Docker Desktop for Windows with a WSL2 backend _is_ fully supported because the `docker` command is executable directly in Windows (without having to call WSL2). If you need to use Podman on Windows, then refer to the Podman blog entries at https://podman.io/blogs/2021/09/06/podman-on-macs.html and https://podman.io/blogs/2020/09/02/running_windows_or_mac.html for more information about downloading, installing, and configuring the Windows Remote Client.

- On Linux, the application depends on libGL being installed.  libGL is not currently listed in the dependencies list for the `rpm` (or `deb`) installers.  Therefore, you will need to install libGL using your package manager.  For example:
  ```
    sudo yum install libGL
  ```

- When trying to run the application on a Linux machine and display it on a Windows machine, do not use the Xming X server.  There appears to be a bug (presumably with their OpenGL support) that prevents applications using Electron 13.x or later from working (for example, Microsoft VS Code doesn't work either).

- The application is limited to working with archive files whose size is less than 2 GB.
