+++
title = "Release Notes"
date = 2022-01-30T12:48:00-05:00
weight = 7
pre = "<b> </b>"
+++

### Changes in Release 1.4.0
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
- #173: Added support for WebLogic Kubernetes Operator 4.0.  While it is now the default, versions 3.3+ are still supported.  

#### Other Changes
- #175: Added Zoom In, Zoom Out, and Actual Size menu options to the Window menu.
- #178: Integrated the `Prepare Model` action with the changes in WebLogic Deploy Tooling 2.4.0.
- #179: Updated the [WebLogic Remote Console](https://github.com/oracle/weblogic-remote-console) integration to support version 2.4.1 (2.4.0 also supported).

#### Bug Fixes
- #171: Improved workaround for the issue limiting the ability to select text from the Code View scripts (WKTUI-375).
- #172: Resolved issue when using Domain-in-Image that was causing the domain to not be created.
- #174: Resolved an issue where the `Install Ingress Controller` action was always passing the image pull secret--even when the user indicated not to use one. 
- #176: Resolved an issue where the `Update Ingress Routes` action was always passing the `SSL pass-through` argument--even when the user did not request it.
- #182: Resolved Verrazzano 1.4.0+ installation issue caused by a change in the published operator file name. 

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Check Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.