---
title: "Project Settings"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 1
---

The first stop for every new project is `Project Settings`.  In this section, you make decisions and provide
input for the project on:

- [Credential Storage](#choosing-a-credential-storage-scheme)
- [Domain Location](#choosing-a-domain-location)
- [Kubernetes Environment Target Type](#choosing-a-kubernetes-environment-target-type)
- [JDK and WebLogic Server Installation Directories](#choosing-the-java-and-oracle-installation-directories)
- [Image Build Tool Type and Executable Location](#choosing-the-image-build-tool)

When running the WKT UI application on Windows or Linux, the application inherits its environment from the user. For example,
adding a directory to the PATH used by the application is just a matter of changing your
PATH environment variable and restarting the application. On macOS, things are a bit more complicated.

When running the application on macOS, the application inherits the environment of a daemon process called `launchd` instead
of your environment.  By default, the `launchd` environment contains only a few core directories on the `PATH`
(that is, `/usr/bin`, `/bin`, `/usr/sbin`, and `/sbin`).  This will, for example, cause `kubectl` invocations requiring
access to one of the cloud providers' command-line tooling to fail if the tool is not found in one of those locations.
While it is possible for an administrative user to change the environment that `launchd` uses to address this issue, the
WKT UI application provides the `Extra Path Directory` table to explicitly add the directory where the cloud providers'
command-line tooling is installed, to the `PATH` that the application uses to invoke `docker`, `podman`, `kubectl`, and
`helm`. Also, use the `Extra Environment Variable Name/Extra Environment Variable Value` table to define extra
environment variables as needed. Note that this extra environment configuration is used _only_ when invoking
Docker/Podman, kubectl, and Helm. This section is visible only when running the application on macOS.


#### Choosing a Credential Storage Scheme
The WKT UI application can securely store credentials for your project or not store them at all.  The three choices
are:

- Use the Native OS Credential Store
- Store Encrypted Credentials in the WKT Project File
- Not Store Credentials

If you choose `Store in Native OS Credential Store`, then you will be using the Windows Credential Manager, the macOS Keychain,
or the Linux `libsecret` library's credential store.  These credential stores offer a well-known, secure mechanism for
storing credentials that most users already understand.  The only downside to this scheme is that the credentials are
stored only on the local machine.  Anyone trying to share their project with others users will have to have the other users
re-enter the credentials so that they get saved to their local machine's credential store.

{{% notice note %}}
The WKT UI application can require storing a dozen or more credentials, depending on your WebLogic Server
domain configuration. Upon first access by the WKT UI to load credentials from the credential store, the OS will prompt
whether you want to allow the application access to each credential, prompting you once for each credential.  This
can get annoying, but on some platforms (for example, macOS), you have the option of telling the OS to always allow access to
the credential by the WKT UI application.
{{% /notice %}}

The other choice to store credentials, `Store Encrypted in Project File`, uses a passphrase-based encryption built into the application that allows
the credentials to be stored inline in the WKT Project file.  The algorithms and techniques used follow the current
industry standards and recommendations; however, because this project is open source, you can look at the details,
if you are interested.  The only downside to this approach is that, because the passphrase itself is
never stored, you must share the passphrase with any other users that should be able to use the WKT Project file.

A creative person might realize that they can use the passphrase-based encryption to move credentials normally stored
in the native OS credential store to another machine.  The steps to accomplish this would be:

1. Open the project using the native OS credential store on the machine where the credentials are stored.
2. Change the credential storage option to passphrase-based encryption and enter a passphrase.
3. Save the project file.
4. Open the project file on a different machine, supplying the passphrase entered in step 2.
5. Change the credential storage option to native OS credential store.
6. Save the project file.

The final choice, `Not Stored`, is to not store the credentials at all. While this is a viable option, it also means that whenever you
need to run any of the actions that require credentials, you will need to re-enter the value of every credential in the
project.

#### Choosing a Domain Location
When getting started with a new WKT Project, one of the first things to consider is where you want the domain to reside.
Domains can reside in a container, in an image, or in a persistent volume.  Your choice will expose and hide different
fields across most sections of the UI.  The following describe the implications of the three locations:

- `Created in the container from the model in the image`  - The newest and most popular location for a domain is in the container.  This is known as "Model in Image" but also
referred to as a "From Model" in the underlying WKT tooling.  In this case, the set of model-related files are added to
the image.  When the WebLogic Kubernetes Operator domain object is deployed, its inspector process runs and creates the
WebLogic Server domain inside a running container on-the-fly.  While this process adds a small amount of overhead at
startup, it also makes it easier to maintain the image.  For example, you can have a common WebLogic Server image that
is updated periodically to pick up the latest Patch Set Updates (PSUs).  Then, you use that image to add the
most recent version of the WebLogic Deploy Tooling and your domain model files as a layer on top.

- `Created as part of the image` - This selection stores the domain in the image.  This is known as "Domain in Image" but also is referred to as "Image"
in the WebLogic Kubernetes Operator configuration.  Using this option, the domain is created from the model by the
WebLogic Image Tool (using the WebLogic Deploy Tooling) and baked into the image.  While this saves a little overhead
at startup, it is more expensive to maintain due to the need to recreate the domain every time a new WebLogic
Server image is created.

- `Externally created in a Kubernetes persistent volume` - This selection stores the domain in a Kubernetes persistent volume; this is known as "Domain in PV".
This closely approximates the traditional way of maintaining a domain where the domain is created on disk and then
used and maintained for as long as necessary. Depending on which Fusion Middleware products you are using, this may be
your only supported choice for running the domain in Kubernetes.  The WKT UI application currently doesn't do anything to help
you create the persistent volume, the necessary persistent volume claim, or the domain.  After those things exist, the
application will allow you to use them to deploy new domains stored in a persistent volume.

##### Choosing a Kubernetes Environment Target Type
The target type tells the application what sort of Kubernetes environment that you plan to use.  Currently, `WebLogic
Kubernetes Operator` and `Verrazzano` are the only two choices.  The application uses the target type to:

- Tell WDT how to prepare the model for deployment.
- Determine what sections and their associated actions within the application, to display.

For example, the `Kubernetes` pages are relevant to the WebLogic Kubernetes Operator target type, so those pages
and their associated actions are hidden when the Verrazzano target type is selected; instead, the `Verrazzano`
pages are displayed.  

#### Choosing the Java and Oracle Installation Directories
The application uses these directories when invoking the WebLogic Deploy Tooling and WebLogic Image Tool; it does not
use them for any other purpose.  When selecting these directories, make sure to select the same directory you would use
to set the `JAVA_HOME` and `ORACLE_HOME` (or `MW_HOME`) environment variables.  These are generally the top-level
installation directories.

#### Choosing the Image Build Tool
To build new images, inspect images, and interact with image repositories, the WKT UI application uses an image build
tool, which defaults to `docker`.  The image build tool must be installed locally, as mentioned in the [Prerequisites]({{< relref "/setup/prerequisites.md" >}}).
While `docker` is currently the most popular tool, many vendors (for example, Oracle, IBM RedHat, Google) are moving to
use `podman` by default.
