+++
title = "Release Notes"
date = 2022-01-30T12:48:00-05:00
weight = 5
pre = "<b> </b>"
+++

### Changes in Release 1.1.0
This release contains the following changes and bug fixes.

#### Major New Features
- Updated macOS environment control to specify extra environment settings to pass down to Docker/Podman, kubectl, and Helm invocations.
- Bundling WebLogic Deploy Tooling 2.0.0. See [WDT release notes](https://github.com/oracle/weblogic-deploy-tooling/releases/tag/release-2.0.0) for details.
- New Validate Model action that leverages WDT 2.0 changes to validate the model files and reports any validation errors it finds.
- Updated Prepare Model action that leverages WDT 2.0 changes to improve model preparation for deploying with WebLogic Kubernetes Operator.
- Added support for splitting the FMW (WebLogic or FMW Infrastructure) and WDT model images (also known as auxiliary images).
  - New Create Auxiliary Image action to create an auxiliary image.
  - New Push Auxiliary Image action to push an auxiliary image to an image registry.
- New Update Operator action to apply changes such as a version upgrade to an existing WebLogic Kubernetes Operator installation.
- New Uninstall Operator action to uninstall the WebLogic Kubernetes Operator installation and optionally, its Kubernetes namespace.
- New Undeploy Domain action to undeploy an existing domain  and optionally, its Kubernetes namespace.
- New Uninstall Ingress Controller action to uninstall the ingress controller installation and optionally, its Kubernetes namespace.
- Updated Ingress Route editing to improve control for SSL and provide lists of available target services and target ports.

#### Other Changes
- Added the `Save As` menu item to allowing saving a project and any model files to a new name/location.
- Improved Internet connectivity check mechanism and added configurable timeout settings to address issues some users were
  having with the default OCI DNS settings causing extra long DNS name resolution times that were triggering the hard-coded timeout.
- Upgraded Electron to version 16.
- Upgraded the Model Code View page's embedded ACE editor to 1.4.13.
- Relocated the older, macOS-specific `Extra Path Directories` functionality from the Kubernetes Client Configuration page to the
  Project Settings page to better align with new macOS environment settings and the scope to which they apply.
- Replaced `Help` menu's `Visit Website` menu item with a `View Documentation` menu item that opens the WebLogic Kubernetes Toolkit UI
  documentation in the user's browser.
- Added a result dialog to display the Primary Image's custom base image's content found by the Inspect Image action.
- Added a warning message to the Discover Model action if the project has existing model files that will be overwritten by the action.
- Changed the Windows and Linux About dialog to not be modal.
- Added `Application Deployment Plan`, `Custom File`, and `Custom Directory` option types to the Archive editor's Add dialog.

#### Bug Fixes
- Resolved macOS-specific issue with `Quit WebLogic Kubernetes Toolkit UI` where it required invoking it multiple times
  to exit the application.
- Resolved macOS-specific issue where `Quit WebLogic Kubernetes Toolkit UI` was not working if the About dialog window
  was the last window open.
- Resolved application update dialog issue where the Release Notes link was not opening in the user's browser.
- Resolved all known issues with application update functionality on all platforms.
- Resolved Podman-related issues to pass key environment variables down to all `podman` executions.
- Resolved Podman-related issue with pushing to Docker Hub.
- Resolved issues with the Primary Image tab's Inspect Image button.
- Resolved issue with Prepare Model action's secret handling whereby domain secret values were being lost.
- Resolved an issue where double-clicking on an action button was causing multiple actions to run simultaneously.
- Worked around macOS-specific Electron issue that caused the model editor to not receive a blur event when using the
  application menus.

### Known Issues in Release 1.1.0

- When running the WKT UI application on Windows, the image builder tool (Docker or Podman) also must be directly 
  executable in Windows.  For example, there is currently no support for running the WKT UI application in Windows and
  running Podman under the Windows Subsystem for Linux (WSL2).  However, running Docker Desktop for Windows with a WSL2
  backend _is_ fully supported because the `docker` command is executable directly in Windows (without having to call
  WSL2). If you need to use Podman on Windows, then refer to the Podman blog entries at 
  https://podman.io/blogs/2021/09/06/podman-on-macs.html and https://podman.io/blogs/2020/09/02/running_windows_or_mac.html
  for more information about downloading, installing, and configuring the Windows Remote Client.

- On Linux, the application depends on libGL being installed.  libGL is not currently listed in the dependencies list
  for the `rpm` (or `deb`) installers.  Therefore, you will need to install libGL using your package manager.
  For example:
  ```
    sudo yum install libGL
  ```

- When trying to run the application on a Linux machine and display it on a Windows machine, do not use the Xming X
  server.  There appears to be a bug (presumably with their OpenGL support) that prevents applications using Electron
  13.x or later from working (for example, Microsoft VS Code doesn't work either).

- The application is limited to working with archive files whose size is less than 2 GB.
