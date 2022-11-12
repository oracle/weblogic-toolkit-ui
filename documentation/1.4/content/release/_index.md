+++
title = "Release Notes"
date = 2022-11-03T12:48:00-05:00
weight = 7
pre = "<b> </b>"
+++

### Changes in Release 1.4.1
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)


#### Major New Features
None

#### Other Changes
- #192: Add the ability to install and work with older versions of operator using the latest published Helm chart.

#### Bug Fixes
- Resolved issue Discover Model issue introduced in 1.4.0 by picking up the fix in WebLogic Deploy Tooling 2.4.1.
- Resolved issue with Deploy Domain failing due to a WebLogic Kubernetes Operator error from the new conversion/validating
  webhook (fix in a new published version of the WebLogic Kubernetes Operator 4.0.0 Helm chart).
- #190: Resolved a macOS-specific issue in check to see if the WebLogic Kubernetes Operator is already installed.
- #191: Resolved WebLogic Kubernetes Operator 4.0 issues with the Domain Resource spec generation.
- #191: Resolved an issue with WebLogic Kubernetes Operator 3.x where the `wdtInstallHome` was named incorrectly under one condition.
- #191: Resolved a gap in the functionality for WDT and Model locations in the Domain Resource spec when using images
  instead of creating them.  

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Check Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- WKTUI does not currently show the Verrazzano URL needed to access the application.  The URL will always be of
  the form `https://<gateway-hostname>/<app-path>`, where the `gateway-hostname` is the name created by Verrazzano
  in the `Gateway` object.  To get the name of the generated gateway object, run `kubectl get gateway -n <namespace> --template
  '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}'`.  Next, run `kubectl get gateway <gateway-name> -n <namespace> -o yaml`
  and review the `hosts` entry of the `.spec.servers` section to find the DNS name that corresponds to the
  `gateway-hostname` to use in the URL.
