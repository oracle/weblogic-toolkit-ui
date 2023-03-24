+++
title = "Release 1.4.0"
date = 2022-01-30T12:48:00-05:00
weight = 95
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
- #188: Added file download functionality to all Code View pages

#### Bug Fixes
- #171: Improved workaround for the issue limiting the ability to select text from the Code View scripts (WKTUI-375).
- #172: Resolved issue when using Domain-in-Image that was causing the domain to not be created.
- #174: Resolved an issue where the `Install Ingress Controller` action was always passing the image pull secret--even when the user indicated not to use one. 
- #176: Resolved an issue where the `Update Ingress Routes` action was always passing the `SSL pass-through` argument--even when the user did not request it.
- #182: Resolved Verrazzano 1.4.0+ installation issue caused by a change in the published operator file name. 
- #186: Resolved Verrazzano-related issue where Ingress Trait rules were not including the hosts or destination-related fields.
- #187: Resolved an issue where the operator domain variable override config map was not being created properly.
- #187: Resolved an issue with the `apiVersion` of the Verrazzano component- and application-related being incorrect.
- #189: Resolved a rendering issue on the Ingress Controller Code View page when switching tabs.

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- WKTUI does not currently show the Verrazzano URL needed to access the application.  The URL will always be of
  the form `https://<gateway-hostname>/<app-path>`, where the `gateway-hostname` is the name created by Verrazzano
  in the `Gateway` object.  To get the name of the generated gateway object, run `kubectl get gateway -n <namespace> --template
  '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}'`.  Next, run `kubectl get gateway <gateway-name> -n <namespace> -o yaml`
  and review the `hosts` entry of the `.spec.servers` section to find the DNS name that corresponds to the
  `gateway-hostname` to use in the URL.
