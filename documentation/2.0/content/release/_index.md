---
title: "Release Notes"
weight: 82
pre: "<b> </b>"
---

### Changes in Release 2.0.0
- [Major New Features](#major-new-features)
- [Other Changes](#other-changes)
- [Bugs Fixes](#bug-fixes)
- [Known Issues](#known-issues)

#### Major New Features
- Replaced the WebLogic Remote Console integration with a new, integrated WDT model editor.
- #308, #323 - Added support for cross-architecture container images.
- #326 - Centralized container image registry credentials to eliminate the need to re-enter the same credentials
  multiple times.

#### Other Changes
- Removed support for Verrazzano.
- Removed auto-update restrictions on Linux RPM and DEB installers, leveraging a beta feature in Electron Updater.
- #292 - Removed support for the deprecated keytar module that allowed storing credentials in the OS credential store.
- #307 - Removed support for Domain-in-Image and Model-in-Image without an Auxiliary Image.
- #323 - Added support for AppImage to store WDT and WIT tool updates in an external directory.
- #331 - Added user preferences option to disable Linux hardware acceleration in Chromium.
- #337 - Added support for overriding the default WKO Kubernetes CPU and memory requests and limits. 
- #339 - Added user preferences option to provide a GitHub API token to bypass anonymous GitHub API rate limits.
- #458 - Added project settings options for model archive zip file handling to allow using archive files larger than 2 GB.
- #480 - Adding an `OPatch Bug Number` field to support the WebLogic Image Tool's `--opatchBugNumber` argument when creating
  a primary image, if needed. The new, embedded WebLogic Image Tool 1.16.3 makes it unlikely the user will need to use it.
- #481 - Removing the default value for the `DOCKER_BUILDKIT` environment variable and allowing it to be passed from
  the user's environment, if needed.

#### Bug Fixes
- #334 - Updated Ingress route support to work with current versions of the supported ingress controllers.
- #429 - Added support for ServerTemplate-defined keystores to the Archive Editor. 
- #442 - Removed RPM installer dependency on `java-atk-wrapper` to support Oracle Linux 9.0+.

#### Known Issues
None
