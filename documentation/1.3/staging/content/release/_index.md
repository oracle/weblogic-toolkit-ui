+++
title = "Release Notes"
date = 2022-01-30T12:48:00-05:00
weight = 7
pre = "<b> </b>"
+++

### Changes in Release 1.2.0
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)


#### Major New Features
- Model Design View added via integration with the [WebLogic Remote Console 2.3.0](https://github.com/oracle/weblogic-remote-console).
  Users must download and install the WebLogic Remote Console version 2.3.x.

#### Other Changes
- Added a new installer for macOS ARM.
- #141: Added support for WDT online remote discovery.

#### Bug Fixes
- #107: Resolved an issue where the `Save As` functionality was not handling the archive file properly if there were no
  pending updates to the archive file (Jira WKTUI-322).
- Added missing service account argument for WebLogic Kubernetes Operator installation shell scripts (Jira WKTUI-337).
- #123: Changed Domain status message when domain status is available (Jira WKTUI-345).
- #127: Corrected an issue that was causing unsaved changes with no project to be lost when opening a new or existing project.
- #129: Fixed an issue where the wrong window was getting its title changed when opening a new project.
- #130: Fixed an issue where the window title was set incorrectly for a new or existing project.
- #131: Tightened up the logic for saving a project to get predictable results when encountering write permission errors.
- Fixed busy dialog messages used during WebLogic Kubernetes Operator installation and update.
- #136: Corrected `app.addRecentDocument()` handling so that the file always exists on disk prior to the call being made.
- #147: Corrected an issue with the PATH environment variable that was causing WebLogic Image Tool-related issues on Linux with Podman.
