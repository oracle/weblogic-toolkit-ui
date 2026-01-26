---
title: "Release 1.6.0"
date: 2023-07-25T18:38:00-05:00
weight: 89
pre: "<b> </b>"
---

### Changes in Release 1.6.0
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

This release has major usability changes to clearly delineate the following use cases:
- A project that contains a WDT model
- A project that does not have a model but uses an "external image" that contains a model
- A project with no model

When actions are not relevant to the use case, action buttons and `Go` menu items are hidden.  When the project does
not contain a model, the Model page is disabled.  When the project is using an external image that contains a model,
the user is allowed to specify the clusters, variable overrides, and secrets from this external model.

#### Major New Features
None

#### Other Changes
- #250 - Changed domain spec default auxiliary image locations to align with those on the image page.  This allows
         the user to switch back-and-forth between creating and using an auxiliary image without modifying location
         field values.
- #251 - Added `Inspect Image` button to allow users to locate the WDT Model and Install Home locations in an external image.
- #253 - Added support for SAML2 Data Initialization files to the Model Archive Editor.
- #254, #255, #256, #258, #260, #265, #267 - Added support for WebLogic Kubernetes Operator 4.1.0 domain creation images.
- #257 - Changed the action buttons and `Go` menu items to dynamically show/hide themselves based on the use case selected.
- #259 - Added the ability to set domain-wide environment variables in the WebLogic Kubernetes Operator domain spec.
- #268 - Reorganized the Secrets table to better support any extra secrets required by the model. 
- #270 - Added a warning for Verrazzano users using OKE Native Pod Networking.
- #280 - Enhanced the Verrazzano Application page's Add Components dialog to allow multiple components to be selected at a time.

#### Bug Fixes
- #261 - Fixed a bug with the Model Archive Editor that was preventing adding name-segregated entries from working correctly.
- #262 - Fixed a bug related to getting the WebLogic Kubernetes Operator version when the logs were too large.
- #264 - Fixed a bug that caused the Verrazzano installation to use the wrong Verrazzano Platform Operator URL in some cases.
- #276 - Fixed a bug where the WebLogic Kubernetes Operator cluster resources were created after the domain resource, which
         resulted in a temporary error condition when the operator analyzed the domain.  This fix results in the Code View
         showing the cluster resources before the domain resource.
- #277 - Added a missing tooltip to the Verrazzano Application component's Ingress Trait Rules table Update URLs button
         to clarify that it should only be used after the application status is complete.
- #279 - Fixed a bug that was causing the title of the Update URLs error dialog box to display the i18n key instead of the text.

#### Known Issues
- On Linux, the open and save dialogs open behind the main application window.  This is due to
  [Electron bug 32857](https://github.com/electron/electron/issues/32857).
- When deploying a Verrazzano application, the `Get Application Status` button only checks the status of the project's
  Verrazzano component containing the WebLogic domain specification.
- Verrazzano installation does not support a multicluster installation.
- Verrazzano Application components Ingress Trait Rules table's URL column does not properly account for multicluster
  applications.  The Update URL button will only get information from the admin (i.e., `local`) cluster.
