+++
title = "Release Notes"
date = 2022-11-03T12:48:00-05:00
weight = 92
pre = "<b> </b>"
+++

### Changes in Release 1.5.1
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
None

#### Other Changes
None

#### Bug Fixes
- #229 - Fixed issue in Domain resource generation on Windows inserting a path with Windows separators

#### Known Issues
- In the Model Design View, changing the `Source Path` and `Plan Path` fields for existing App Deployments and Shared Libraries
  is broken in this release.  To work around it, either remove and recreate the deployment or use the Model Code View's
  Model Editor and Archive Editor to make the appropriate changes.
- In Model Design View, the `Plan`/`Plan Path` fields for App Deployments mistakenly allow you to select a directory.  This is
  not valid and will result in an error.  Please make sure to select a file for any deployment plan.  
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Verrazzano installation does not support a multi-cluster installation.