---
title: "Known Issues"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 5
---



- On Windows, the Application Update dialog `Install on Exit` works _only_ if you installed the application for the current user only.  If the application was installed for all users, `Install on Exit` will cause the older version of the application to be uninstalled but the new version will not be installed.  This is due to issue https://github.com/electron-userland/electron-builder/issues/6329.
