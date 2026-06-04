---
title: "Release 2.0.3"
weight: 79
pre: "<b> </b>"
---

### Changes in Release 2.0.3
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
None

#### Other Changes
- #498 - Added `Forgot passphrase` option to open a project and clear out any encrypted credentials.

#### Bug Fixes
- #499, #500 - Fixed issue that, in certain situations, was causing the call to get the list of WKO versions to fail.

#### Known Issues
- When using an RPM or DEB installation, the Auto Update dialog appears but the `Update Now` and `Update On Exit` buttons
  do not work unless the user has handled the authentication problem. For example, starting the application using 
  `sudo wktui --no-sandbox` or using an authentication agent like `polkit` allows the updates to function properly.
