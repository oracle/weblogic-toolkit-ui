---
title: "Set up the WKTUI application"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 3
---
To install the WKTUI application:

- Go to the GitHub project [Releases page](https://github.com/oracle/weblogic-toolkit-ui/releases) and download the latest release.
- Run the appropriate installer for your operating system.

Each release has many assets. For a detailed description of them, see [Install WKT UI]({{< relref "/setup/install.md" >}}).

### WKTUI Startup

WKTUI requires Internet connectivity, not only for proper UI rendering, but also for REST APIs calls that it makes to GitHub for detecting and downloading updates, when they are available, and for determining the available versions of related software.  As such, WKTUI checks for Internet connectivity at application startup.  If WKTUI fails its Internet connectivity check, it will display the Network Configuration dialog.  

{{< img "Network Configuration" "images/network-configuration.png" >}}

Enter, correct, or remove your proxy information, as appropriate to connect to the Internet and then click **Try Connection**.  After the connection is successful, **Restart Application** will activate; clicking it will save your configuration and restart the application.

### Updates

WKTUI has a built-in, auto-update functionality.  Each time the application starts, it checks GitHub to determine if a newer version of the application is available.  When a newer version is available, this dialog box appears giving the options of installing the update now, installing the update upon exiting the application, and ignoring the update.    

{{< img "Auto Update" "images/auto-update.png" >}}

If the update is not installed, the application will prompt you again the next time it starts. At any time, you can check for application updates by using the `Help` > `Check for WKT UI Updates` menu item.  Note that this auto-update functionality is not available when installing using the traditional Linux RPM or DEB installers.

### WKT Tools

WKTUI bundles two other open source tools that are part of the WebLogic Kubernetes Toolkit (WKT):

- [WebLogic Deploy Tooling](https://github.com/oracle/weblogic-deploy-tooling) (WDT)
- [WebLogic Image Tool](https://github.com/oracle/weblogic-image-tool) (WIT)

Each release of the WKTUI application bundles the latest releases of these tools, however, you can check for updated versions between WKTUI releases by using the `Help` > `Check for WKT Tools Updates` menu item.  If an update for one or both tools is available, a dialog box, like the following one, will be displayed. Click **Update Tool(s)**  to update the bundled tools.

{{< img "Tools Update" "images/wkt-tools-update.png" >}}

WKTUI integrates with the WebLogic Remote Console to provide visual editing of the WDT model of the WebLogic Server domain.

- To install the WebLogic Remote Console, go to the [GitHub project page](https://github.com/oracle/weblogic-remote-console) and download the latest release.  
- After it's installed, you'll need to configure WKTUI to locate the WebLogic Remote Console installation.  

Start the WKTUI application and go to the `Model` page, shown in the following image.

{{< img "WRC Integration" "images/wrc-integration.png" >}}

As you can see, the path to the `WebLogic Remote Console Install Location` is already populated. Depending on your platform, this may or may not be the case.  Make sure that the location is correct and then click **Start WebLogic Remote Console**.  If the versions of the applications are not compatible, WKTUI will display a dialog box with the compatible version requirements.  Otherwise, the page will be refreshed with a screen that provides visual editing of the WDT model, as shown in the following image.

{{< img "Model Design View" "images/model-design-view.png" >}}

### User Preferences

WKTUI supports user preferences; that is, preferences that are specific to a user on a particular machine.  To open the User Preferences dialog on Windows or Linux, use the `File` > `Preferences` menu item.  On macOS, use the `WebLogic Kubernetes Toolkit UI` > `Settings` menu item.  

{{< img "User Preferences" "images/user-preferences.png" >}}

Using this dialog, you have access to view and edit settings in the following areas:

- `Proxy Configuration` – Change the proxy and no proxy settings for the network.
- `WebLogic Remote Console Configuration` – Change the WebLogic Remote Console installation directory.
- `Logging Configuration` – Change the logging level and log directory location.
- `Startup Internet Connectivity Test Configuration` – Change the timeout on the Internet connection check.  This is the same as the Request Timeout Seconds field.
- `WebLogic Kubernetes Toolkit UI Introduction Configuration` – Change whether the introduction shows at application startup or not.

### Explore WKTUI

Now that the WKTUI application is installed and configured, it is time to explore the functionality of the WKTUI application.  To make this adventure more hands-on, you will lift and shift a ToDo List application running in an on-premises environment and move it to Kubernetes.  The initial quick start documents cover both tracks, then the flow splits into the following two tracks:

- WebLogic Kubernetes Operator
- Verrazzano

At the end of either track, the ToDo List application will be running in a Kubernetes environment.
