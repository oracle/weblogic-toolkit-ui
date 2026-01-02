---
title: "Project Settings"
draft: false
weight: 1
---

The first stop for every new project is `Project Settings`.  In this section, you make decisions and provide
input for the project on:

- [macOS Path and Environment Variables](#macos-path-and-environment-variables)
- [Credential Storage](#choosing-a-credential-storage-scheme)
- [Domain Location](#choosing-a-domain-location)
- [Model Archive Zip File Handling](#choosing-the-model-archive-plug-in-for-zip-file-handling)
- [JDK and WebLogic Server Installation Directories](#choosing-the-java-and-oracle-installation-directories)
- [Image Build Tool Type and Executable Location](#choosing-the-image-build-tool)
- [Target Kubernetes Cluster Architecture](#choosing-the-target-kubernetes-cluster-architecture)
- [Container Image Registry Credentials](#container-image-registry-credentials)

When running the WKT UI application on Windows or Linux, the application inherits its environment from the user. For
example, adding a directory to the PATH used by the application is just a matter of changing your
PATH environment variable and restarting the application. On macOS, things are a bit more complicated.

#### macOS Path and Environment Variables

When running the application on macOS, the application inherits the environment of a daemon process called `launchd`
instead of your environment.  By default, the `launchd` environment contains only a few core directories on the `PATH`
(that is, `/usr/bin`, `/bin`, `/usr/sbin`, and `/sbin`).  This will, for example, cause `kubectl` invocations requiring
access to one of the cloud providers' command-line tooling to fail if the tool is not found in one of those locations.
While it is possible for an administrative user to change the environment that `launchd` uses to address this issue, the
WKT UI application provides the `Extra Path Directory` table to explicitly add the directory where the cloud providers'
command-line tooling is installed, to the `PATH` that the application uses to invoke `docker`, `podman`, `kubectl`, and
`helm`. Also, use the `Extra Environment Variable Name/Extra Environment Variable Value` table to define extra
environment variables as needed. Note that this extra environment configuration is used _only_ when invoking
Docker/Podman, kubectl, and Helm. This section is visible only when running the application on macOS.


#### Choosing a Credential Storage Scheme
The WKT UI application can securely store credentials for your project or not store them at all.  The two choices
are:

- Store Encrypted Credentials in the WKT Project File
- Not Store Credentials

The default choice to store credentials, `Store Encrypted in Project File`, uses a passphrase-based encryption built 
into the application that allows the credentials to be stored inline in the WKT Project file.  The algorithms and
techniques used follow the current industry standards and recommendations; however, because this project is open source,
you can look at the details, if you are interested.  The only downside to this approach is that, because the passphrase
itself is never stored, you must share the passphrase with any other users that should be able to use the WKT Project
file.

The other choice, `Not Stored`, is to not store the credentials at all. While this is a viable option, it also means
that whenever you need to run any of the actions that require credentials, you will need to re-enter the value of every
credential in the project.

#### Choosing a Domain Location
When getting started with a new WKT Project, one of the first things to consider is where you want the domain to reside.
Domains can reside in a container, in an image, or in a persistent volume.  Your choice will expose and hide different
fields across most sections of the UI.  The following describe the implications of the three locations:

- `Created in the container from the model in the image`  - The newest and most popular location for a domain is in the 
container.  This is known as "Model in Image" but also referred to as a "From Model" in the underlying WKT tooling.  
In this case, the set of model-related files are added to an image, known as the "Auxiliary Image."  When the WebLogic
Kubernetes Operator domain object is deployed, its inspector process runs and creates the WebLogic Server domain inside
the running container using the "Primary Image" on-the-fly.  While this process adds a small amount of overhead at
startup, it also makes it easier to maintain the images.  For example, you can have a common WebLogic Server image that
is updated periodically to pick up the latest Patch Set Updates (PSUs).  Then, you use that new primary image with the
existing (or new) auxiliary image to provide the WebLogic Deploy Tooling and your domain model files.  By separating
these images, it makes updating existing domains with new FMW software patches and updating domain model files
decoupled. 

- `Externally created in a Kubernetes persistent volume` - This selection stores the domain in a Kubernetes persistent
volume; this is known as "Domain in PV". This closely approximates the traditional way of maintaining a domain where the
domain is created on disk and then used and maintained for as long as necessary. Depending on which Fusion Middleware
products you are using, this may be your only supported choice for running the domain in Kubernetes.  The WKT UI 
application currently doesn't do anything to help you create the persistent volume, the necessary persistent volume
claim, or the domain.  After those things exist, the application will allow you to use them to deploy new domains stored
in a persistent volume.

#### Choosing the Model Archive Plug-in for Zip File Handling
When working with a WebLogic Deploy Tooling model archive file, you have the following options from which to choose:

- `JavaScript JSZip Library` - Prior to the 2.0.0 release, this was the only option, and is still the default selection.
While it still works well and supports in-place modification of the zip file, it cannot handle zip files of 2 GB or larger.

- `JavaScript zip.js Library` - Introduced in release 2.0.0, zip.js is able to work with zip files larger than 2 GB.
However, it does not support in-place modification of the zip file so it requires extra storage in the temporary
directory to create the updated zip file prior to overwriting the old one.[^1]

- `WebLogic Deploy Tooling Archive Helper Tool` - Introduced in release 2.0.0, the WDT Archive Helper Tool is able to
both work with zip files larger than 2 GB and perform in-place editing of the zip file.  Since this tool is part of
WDT, it requires supplying a valid `Java Home` to support its operation.

<!--
The section below is a footnote that appears at the bottom of the page.
-->
[^1]: By default, the temporary directory is created under the operating system's temporary directory. For Windows and
    Linux, you can change the location of the operating system's temporary directory being used by setting the `TMPDIR`
    environment variable prior to starting the application. <br/>
    <br/>
    Since macOS applications do not inherit the user's environment, you have the option of setting the 
    `TMPDIR for zip.js Library` field to control where the application creates these temporary updated zip files. Note
    that the option to specify the `TMPDIR for zip.js Library` field will only be visible when running the application
    on macOS and selecting the `JavaScript zip.js Library` option.

#### Choosing the Java and Oracle Installation Directories
The application uses these directories when invoking the WebLogic Deploy Tooling and WebLogic Image Tool; it does not
use them for any other purpose.  When selecting these directories, make sure to select the same directory you would use
to set the `JAVA_HOME` and `ORACLE_HOME` (or `MW_HOME`) environment variables.  These are generally the top-level
installation directories.

#### Choosing the Image Build Tool
To build new images, inspect images, and interact with image repositories, the WKT UI application uses an image build
tool, which defaults to `docker`.  The image build tool must be installed locally, as mentioned in the
[Prerequisites]({{% relref "/setup/prerequisites.md" %}}). While `docker` is currently the most popular tool, many
vendors (for example, Oracle, IBM RedHat, Google) are moving to use `podman` by default.

#### Choosing the Target Kubernetes Cluster Architecture
Prior to WKT UI 2.0, WKT UI assumed that the architecture for the Kubernetes cluster to which you want to deploy matched
the architecture where the WKT UI application was running.  This created a problem for Mac users running WKT UI on
machines with Apple Silicon but Kubernetes clusters running Linux on Intel/AMD nodes.  This section allows you to
explicitly specify the target Kubernetes architecture so that WKT UI can ensure that the images created match the target
architecture of the Kubernetes cluster.

#### Container Image Registry Credentials
Prior to WKT UI 2.0, WKT UI required you to enter credentials needed to pull or push an image on a case-by-case basis.
This could result in entering the same credentials multiple times.  Starting in WKT UI 2.0, this section allows you to
enter a named credentials for a container image registry once and select it in the locations where you need to use it.
To simply the navigation between pages, each location that needs a credential also provides an 
`Add Image Registry Credential` button to allow you to add or edit credentials in a dialog box without having to
navigate back to this section.
