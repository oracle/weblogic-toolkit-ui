+++
title = "Release Notes"
date = 2022-01-30T12:48:00-05:00
weight = 5
pre = "<b> </b>"
+++

### Changes in Release 1.1.1
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
No new features.

#### Other Changes
- Revamped the Ingress Route editing mechanism:
  - Added busy dialog while fetching existing service data from the domain's Kubernetes namespace prior to opening the route edit dialog.
  - Added placeholders to the `Target Service` and `Target Port` fields to clarify the current state of these fields when no value is selected.
  - Added logic to reset the `Target Port` field selection when the `Target Service` field changes and the selected port is not valid for the new service selected.
- Reworked the Image page and related fields on the Domain page to improve usability.  With these changes, a user not needing to create new images can bypass the Image page completely.
  - Converted `Use Auxiliary Image` and `Create New Auxiliary Image` switches to radio buttons to make the three options more clear.
  - Moved the `Image Tag` and `Image Registry Address` fields from the Image page tabs to the Domain page when not creating a new image.
  - Replicated the `Create New Primary Image` and `Auxiliary Image Configuration` controls from the Image page to the Domain page.
  - Added navigation buttons on the Domain page to direct the user to go back to the Image page when creating a new image.
- Bundled WebLogic Deploy Tooling 2.1.0. See [WDT release notes](https://github.com/oracle/weblogic-deploy-tooling/releases/tag/release-2.1.0) for details.
- Reworked Model actions to work better for `Domain in Image` and `Domain in PV` use cases.
  - Enhanced Prepare Model action to use the new target types added in WebLogic Deploy Tooling 2.1.0 so that Prepare Model works properly for `Model in Image`, `Domain in Image`, and `Domain in PV` use cases.
  - Removed `Domain in PV` check that was previously preventing both `Validate Model` and `Prepare Model` actions from being used.
- Enhanced Domain page `Cluster` table to be editable when using `Domain in PV` to support use cases where the project has or doesn't have a model.
- Converted all `aria-label` fields to use the i18n resource bundle.
- Removed `webui` unit tests from the installers.

#### Bug Fixes
- Resolved issue with "Save As" when saving project file in a different directory.
- Resolved issue with "Save As" where the project was losing an entry for the archive file if no pending changes exist.
- Resolved issue where project file to window mapping was causing unnecessary reassigning of the credential manager.
- Added additional RPM installer dependencies to try to resolve installation issues when on a Linux VM not being used as a desktop machine.
- Added a native macOS ICNS icon to resolve mangled icon on macOS.
- Resolved issue with existing ingress route detection to eliminate overwrite warnings when route does not exist.

### Known Issues

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
