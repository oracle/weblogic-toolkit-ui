---
title: "Set up the WKTUI application"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 7
---
To install the WKTUI application:

- Go to the GitHub project [Releases page](https://github.com/oracle/weblogic-toolkit-ui/releases) and download the latest release.
- Run the appropriate installer for your operating system.

Each release has many assets. For a detailed description of them, see [Install WKT UI]({{< relref "/setup/install.md" >}}).

### Application Startup

WKTUI requires Internet connectivity, not only for proper UI rendering, but also for REST APIs calls that it makes to GitHub for detecting and downloading updates when they are available and for determining the available versions of related software.  As such, WKTUI checks for Internet connectivity at application startup.  If WKTUI fails its Internet connectivity check, it will display the Network Connectivity dialog.  

{{< img "Network Configuration" "images/network-configuration.png" >}}

Enter, correct, or remove your proxy information, as appropriate to connect to the Internet and click **Try Connection**.  After the connection is successful, **Restart Application** will activate; clicking it will save your configuration and restart the application.

### Version Updates

WKTUI has a built-in, auto-update functionality.  Each time the application starts, it checks GitHub to determine if a newer version of the application is available.  When a newer version is available, a dialog box appears, like the following image, giving the options of installing the update now, installing the update upon exiting the application, and ignoring the update.    

{{< img "Auto Update" "images/auto-update.png" >}}

If the update is not installed, the application will prompt again the next time it starts. At any time, you can check for application updates by using Help > Check for WKT UI Updates menu item.  Note that this auto update functionality is not available when installing using the traditional Linux RPM or DEB installers.
