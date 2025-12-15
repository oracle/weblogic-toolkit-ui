+++
title = "Release 1.5.2"
date = 2022-02-06T12:48:00-05:00
weight = 91
pre = "<b> </b>"
+++

### Changes in Release 1.5.2
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
None

#### Other Changes
None

#### Bug Fixes
- #232 - Fixed an issue in the Verrazzano Application page where the component's Ingress Trait Rule destination names 
  were not properly converted to legal Kubernetes names so that they would match the generated service names when the
  domain, cluster, or server names combinations had more than one disallowed characters in them.

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
- Verrazzano installation does not support a multicluster installation.
