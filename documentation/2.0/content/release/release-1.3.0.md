+++
title = "Release 1.3.0"
date = 2022-02-01T12:48:00-05:00
weight = 96
pre = "<b> </b>"
+++

### Changes in Release 1.3.0
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
- Support for creating and deploying the Verrazzano component for the WebLogic domain, and an application that references it.  

#### Other Changes
- Updated the [WebLogic Remote Console](https://github.com/oracle/weblogic-remote-console) integration to support version 2.4.0.
- Added support for specifying node selectors when installing the WebLogic Kubernetes Operator and deploying the WebLogic
  domain, either directly or as a Verrazzano component.
- Added support for the user specifying the Helm timeout value when helm is used (i.e., Installing/updating WebLogic
  Kubernetes Operator and installing the Ingress Controller).
- Added tooltips across all icon buttons to describe what they do.
- Added an anti-affinity specification to the generated WebLogic domain resource, as recommended by the WebLogic Kubernetes Operator docs.

#### Bug Fixes
- Fixed an issue introduced by newer WDT versions that was forcing the domain cluster size to only allow replicas to be set to 0 (WKTUI-365).
- #164: Fixed the link in the Introduction dialog to open in the user's browser instead of inside the app.
- #167: Improved the validation logic and error messages around having an empty model.
- #170: Worked around an issue that was limiting the ability to select text from the Code View scripts (WKTUI-375).

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Due to the workaround for WKTUI-375, users are not able to tab to the script area of the Code View pages.
