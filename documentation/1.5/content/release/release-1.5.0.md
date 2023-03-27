+++
title = "Release 1.5.0"
date = 2022-11-03T12:48:00-05:00
weight = 93
pre = "<b> </b>"
+++

### Changes in Release 1.5.0
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
None

#### Other Changes
- #202 - Added support for Verrazzano 1.5.0+ (which uses WebLogic Kubernetes Operator 4.0.0+).
- #204 - Updated the Archive Editor to align with WebLogic Deploy Tooling 3.0.0+ changes to the archive format.
- #205 - Added support for installing the optional Verrazzano component Argo CD with Verrazzano 1.5.0+.
- #205 - Added support to configure Kubernetes connectivity data for Verrazzano managed clusters.
- #210 - Added support for Verrazzano `Get Application Status` action to check the status on the correct cluster using a
  multi-cluster application targeted to one or more managed clusters.
- #213 - Improved Verrazzano Ingress Trait rule editor to allow the user to choose the Destination Host by WebLogic cluster or non-clustered server name.
- #215 - Added a `Update URLs` button to the Verrazzano application's Ingress Trait that populates the Ingress Rules table
  with a URL once the application deployment is complete.
- #221 - Streamlined the WKO Ingress Routes table to conserve space.
- #223 - Added Proxy URL validation to the network connection and User Preferences dialogs to make sure the user enters
  a URL and not just a host:port combination.

#### Bug Fixes
- #201 - Fixed a bug where the project file was not being cleaned up properly when a cluster was removed and `Prepare Model` was run again.
- #205 - Fixed a bug that caused the Verrazzano `Get Application Status` call to fail.
- #211 - Fixed a bug with sorting the Ingress Rule's Route Annotations table's columns.
- #214 - Fixed a bug where the Verrazzano `Check Verrazzano Install Status` action was reporting installation is still in progress after a successful upgrade.
- #216 - Improved the behavior of the Model Code View sliders when the window is resized.
- #217 - Fixed a bug where the kubectl version output was reporting an incorrect server version number with newer versions of Kubernetes.
- #219 - Fixed a bug with Verrazzano 1.4.0+ installation where the wrong Verrazzano Platform Operator file name was being used.
- #220 - Cleaned up the table formatting/behavior across the application.
- #222 - Fixed a bug with container image tag validation that was causing regular expression catastrophic backtracking, leading to slow validation responses.

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
