---
title: "Release 2.0.2"
weight: 80
pre: "<b> </b>"
---

### Changes in Release 2.0.2
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
None

#### Other Changes
None

#### Bug Fixes
- #494 - Fixed issue causing the Discover Domain to fail.
- #495 - Fixed issue with the WKO Cluster domain spec name that was allowing capital letters in the Kubernetes name.
- #496 - Fixed excessive navigation bar scrolling in the Model Design View when editing fields.

#### Known Issues
- When using an RPM or DEB installation, the Auto Update dialog appears but the `Update Now` and `Update On Exit` buttons
  do not work unless the user has handled the authentication problem. For example, starting the application using 
  `sudo wktui --no-sandbox` or using an authentication agent like `polkit` allows the updates to function properly.
