---
title: "About the WKT UI Application"
weight: 1
pre: "<b> </b>"
---



### Contents

- [WKT Project File](#wkt-project-file)
- [Settings Outside the WKT Project File](#settings-outside-the-wkt-project-file)
    - [Environment Variables](#environment-variables)
    - [User Preferences](#user-preferences)
        - [Proxy Configuration](#proxy-configuration)
        - [GitHub API Credentials](#github-api-credentials)
        - [Appearance](#appearance)
        - [Linux Disable Hardware Acceleration](#linux-disable-hardware-acceleration)
        - [AppImage WKT Tools Configuration](#appimage-wkt-tools-configuration)
        - [Logging Configuration](#logging-configuration)
        - [Startup Internet Connectivity Test Configuration](#startup-internet-connectivity-test-configuration)
        - [WebLogic Kubernetes Toolkit UI Introduction Configuration](#weblogic-kubernetes-toolkit-ui-introduction-configuration)
    - [External Applications](#external-applications)
    - [Bundled WKT Applications](#bundled-wkt-applications)



Before giving you the whirlwind tour of the WKT UI application, it is important to know that the application is a native,
desktop application.  It uses native operating system features, such as:

- Native menus - Some of the application's functionality is available _only_ by using the menus.
- Registering file extensions - The application installer registers the `.wktproj` extension and associates itself
  with that extension.  For example, this lets you double-click on the file in the native file browser and
  have the application start and open the selected project.
- Recent files integration - As you work with `.wktproj` files, the application adds those files to the OS-maintained
  list of recently used files.  This causes these files to show up in OS-specific locations to provide shortcuts for
  opening the file with the application.  For example, on macOS, right-clicking on the application icon in the dock will
  display the recently used `.wktproj` files and selecting one will open an application window and load the contents
  of the `.wktproj` file.

### WKT Project File
What is a `.wktproj` file?  Simply put, it is the application's equivalent of an Integrated Development Environment
(IDE) project file.  It stores:

- Metadata about the UI project.
- Pointers to WDT model-related files used by the project.
- Form field data that you enter into the application.

There are two ways to create a new project:
- Explicitly - Use `File` > `New Project` and select the file location and name.
- Implicitly - Use the application to start working.  After you trigger an action that needs a project file, you are
  prompted to select the file location and name.

_Note that the file extension for project files must be `.wktproj`.  Otherwise, the application will not recognize the
file as a project and will not allow it to be opened as a project file._

The WKT UI application uses a one project per window paradigm and most everything you do in the window is
affected by the project data, either stored directly in the project file or in the WDT model-related files referenced
by the project.  However, there are a few exceptions that are covered in [Settings Outside the WKT Project File](#settings-outside-the-wkt-project-file).

### Settings Outside the WKT Project File

Multiple factors influence the behavior of the WKT UI application in a particular environment.  Other than the WKT Project file,
those include:

- [Environment Variables](#environment-variables) - The application uses the environment it inherits when it is started.
- [User Preferences](#user-preferences) - The application's user preferences file stores shared, user-level settings that
  transcend project boundaries.
- [External Applications](#external-applications) - The application or its components depend on an application being available and properly configured.
- [Bundled WKT Applications](#bundled-wkt-applications) - The application bundles its own copies of WebLogic Deploy Tooling and WebLogic Image Tool.

#### Environment Variables
Some of the application's behavior is influenced by environment variables it inherits when it is started.  Environment
variables affect the behavior of the WKT UI application when computing default values for application form fields.  Some
examples are:

- `PATH` - Used to locate executables like `docker`, `helm`, and `kubectl`.
- `JAVA_HOME` - Used as one way to find the directory where the Java Development Kit (JDK) is installed.
- `ORACLE_HOME` and `MW_HOME` - Used to find the Oracle Fusion Middleware installation directory.

{{% notice note %}}
On Windows and Linux platforms, this tends to be the user's environment that they have configured to be used when
they log in. On macOS, native applications do not inherit the user's login environment.  Instead, the application
inherits the environment configured by the `launchd` daemon process.  If you are running on macOS, then you should keep this in mind
when the application doesn't behave as you expect. For more information, see [Project Settings]({{% relref "/navigate/project-settings.md" %}}).
{{% /notice %}}

#### User Preferences

The `File` > `Preferences` menu lets you configure settings that affect the behavior of the WKT UI application for the user
across all instances of the application on the machine.  These user-visible settings include the following categories:

- [Proxy Configuration](#proxy-configuration)
- [GitHub API Credentials](#github-api-credentials)
- [Appearance](#appearance)
- [Linux Disable Hardware Acceleration](#linux-disable-hardware-acceleration)
- [AppImage WKT Tools Configuration](#appimage-wkt-tools-configuration)
- [Logging Configuration](#logging-configuration)
- [Startup Internet Connectivity Test Configuration](#startup-internet-connectivity-test-configuration)
- [WebLogic Kubernetes Toolkit UI Introduction Configuration](#weblogic-kubernetes-toolkit-ui-introduction-configuration)

Settings are also used to store internally used values that impact the appearance of the application.  For example, the
window size is stored so that the application will open the window with your last known window size.  The list of
such appearance-related settings will likely grow over time.

##### Proxy Configuration

If the WKT UI application is to be run from an environment where a proxy server is required to access the Internet, then you
must configure the proxy server settings to allow Internet access.  Currently, the UI depends on access to
`github.com` to access release information and download new releases of the WKT tools and the UI itself.  This connectivity
is used in various places to determine default values for input data (for example, the default image tag to use for installing the
WebLogic Kubernetes Operator) and providing updated features for the WKT tools bundled with the application, as
well as updating the WKT UI application itself when a new release becomes available.   

Depending on the project configuration,
the application may also require access to other sites, such as Docker Hub (or other container registries), Helm chart
download sites, and cloud-provider sites for authenticating to and accessing remote Kubernetes clusters.

To configure the proxy environment, use the `File` > `Preferences` menu to add or update the
following fields, as needed:

- `HTTPS Proxy URL` - The full URL to the proxy server (for example, http://my-proxy-server.mycompany.com:80).
- `Bypass Proxy Hosts` - A comma-separated list of DNS or IP patterns that should not go through the proxy.
  For example, a value of `.us.mycompany.com,.emea.mycompany.com,.apac.mycompany.com` will skip the proxy for any
  DNS name that ends in one of the three domain names.

##### GitHub API Credentials

GitHub rate limits anonymous API requests, which can negatively impact WKT UI functionality.  You can bypass the anonymous API rate limits by creating a personal access token on your GitHub account and then providing the token value in the `GitHub Token` field. WKT UI will
use this token for all API calls.  Note that this token does not require
any permissions on your own projects, it is simply attached to the API requests so that GitHub knows who is making them.

##### Appearance

The `Appearance Mode` settings allows the user to control the appearance of the application with regards to light or
dark mode.  The settings available are:

- `Use OS Mode` (default) - the application's appearance to use the operating system settings to determine the appearance.
- `Light Mode` - the application appearance is always in light mode, regardless of the operating system settings.
- `Dark Mode` - the application appearance is always in dark mode, regardless of the operating system settings.

##### Linux Disable Hardware Acceleration

This section is only visible when running WKT UI on Linux. The `Disable Hardware Acceleration` switch allows you to
tell Electron's embedded Chromium browser to disable hardware acceleration, in case hardware acceleration is causing
problems.

##### AppImage WKT Tools Configuration

This section is only visible when running the Linux AppImage executable.  Since WKT UI cannot update the executable,
the `WKT Tools External Staging Directory` allows you to specify a location where updated versions of the embedded WKT
tools should be stored. This directory must be writable by the user running WKT UI.

##### Logging Configuration

Using this section, you can configure the logging output level and control the log file directory.  The defaults are:

- `File Transport Log Level` - The logging level below which log messages will be discarded.  For example, `Debug` messages
  will be discarded if the level is set to `Info`.  The default value is `Info`.
- `Log File Directory` - The directory to which log files are written.  The default is the user's temporary directory, as
  defined by the operating system.

##### Startup Internet Connectivity Test Configuration

WKT UI depends on Internet access for its functionality and, as such, tests connectivity to `https://github.com` on
startup.  The `Request Timeout Seconds` default value of 5 seconds should generally be enough but you can increase or
decrease the value using this parameter.  Oracle recommends that you not decrease this value below 5 seconds, since that
may increase the number of false positive error screens that you see when starting the application and the Internet
connectivity test times out.

##### WebLogic Kubernetes Toolkit UI Introduction Configuration

This setting lets you turn on or off the in-application introductory information being displayed at startup.  `Show Introduction` is always
accessible from the `Help` menu.

#### External Applications

The WKT UI application depends on several external applications for its functionality.  As such, it is important to install and
configure these external applications properly on the local machine on which the application is running.

- `docker` (or `podman`) - Used to create new images and inspect the contents of
  custom base images.  The WebLogic Image Tool depends on `docker` (or `podman`) for this functionality.  `docker`
  (or `podman`) is also used to log in to and interact with image registries.
- `kubectl` - Used to get, create, and update configuration objects in your Kubernetes cluster.
  It is critical that the `kubectl` configuration file is properly set up to allow `kubectl` to authenticate to the cluster.
- `helm` - Used to install the WebLogic Kubernetes Operator and ingress controllers.
- `openssl` - Used to generate X.509 TLS certificates, should you ask the application to
  generate one for your ingress route(s), only if you ask the application to generate it for you.

#### Bundled WKT Applications

[WebLogic Deploy Tooling](https://oracle.github.io/weblogic-deploy-tooling/) (WDT) and [WebLogic Image Tool](https://oracle.github.io/weblogic-image-tool/) (WIT) are bundled with the WKT UI application.  These tools are:

- WDT - Used to support discovering a model from an existing domain, prepare the model for a
  particular Kubernetes target type, and is used by the WebLogic Image Tool when creating the domain inside the image.
- WIT - Used to create a new image for your WebLogic Server domain.  It is also used to inspect any
  custom base image that you might specify be used for creating the new image.

Use `Help` > `Check For WKT Tools Updates` periodically to make sure you are using the latest versions of these
bundled tools.
