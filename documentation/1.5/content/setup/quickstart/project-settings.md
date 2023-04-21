---
title: "Select the Project Settings"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
---
1. Start WKTUI.  

   WKTUI uses the concept of a project that is like a project in an Integrated Development Environment (IDE).  You will create a new project.  

2. Using the `File` menu, select `New Project`, choose a directory, and enter the file name `todo-list.wktproj`.  

    At this point, you will be on the `Project Settings` page that will look something like the one shown in the following image.  

    **Note**: If you are _not_  running on macOS, you will not see this top-most panel: For macOS, do you need to add directories to the PATH or define other environment variables for Docker/Podman or Kubernetes?

    {{< img "Project Settings" "images/project-settings.png" >}}

#### Extra Environment Settings (macOS only)

Unlike Windows or Linux, applications on macOS that are started from the Finder, Dock, or Launchpad, do not inherit the user’s environment. To see the environment that WKTUI inherits from the operating system, select `Show System Path` and `Show System Environment`.  For now, you will not add any extra environment settings. Instead, you will return to add these if you encounter an error that requires them.

### Storing the Project Credentials

WKTUI realizes that different organizations and different projects have different security standards for storing credentials.  As such, you have three options in WKTUI for how to store a project’s credentials:

- `Store in the Native OS Credential Store` – This option lets you store each credential field in a separate field in the operating system’s credential store (for example, Windows Credential Manager, macOS Keychain).  When using this option, the project file stores only an indicator for each field stored in the credential store.  When the project is opened, WKTUI tries to load each credential from the credential store into memory.  When the project is saved, WKTUI writes each credential field with a value to the credential store and updates the markers in the project file.  With this option, you have a secure means of storing your credentials on the local machine.  If you try to open the project on a new machine, the credentials will not be found so you will need to re-enter them.

   **NOTE**: When opening a project in a new version of WKTUI, the operating system will likely prompt you for your login password to allow the application to access the credential in the credential store.  The tedious part is that the prompt is per credential, so if you have 15 credential fields, you will be prompted by the operating system to enter your password 15 times.

- `Store Encrypted in Project File` – This option lets you store the credentials directly in the project file.  WKTUI encrypts each credential field using a passphrase that you provide and modern AES 256 bit encryption algorithms and techniques.  On opening the project, WKTUI will prompt you for the encryption passphrase to use to decrypt the credential fields loaded into memory.  If you remember the encryption passphrase, you can easily move the project files from machine to machine without losing the project credentials.

- `None` – This option is the most secure in that the credentials are never stored.   Of course, this means that you must re-enter the credentials every time you open the project.

For this project, you will choose the `Store Encrypted in Project File` option to make it easier on readers running on Linux.

### Oracle Fusion Middleware Domain Target Location

WebLogic Kubernetes Operator (WKO) has three mechanisms for storing the WebLogic domain directory for use in Kubernetes:

- `Created in the container from the model in the image` – With this option, you provide a WebLogic Deploy Tooling (WDT) model of the domain and a WDT installer in an image, and the WebLogic Kubernetes Operator will create and update the domain for you.  This option is also called Model-in-Image (MII) and WKO calls it FromModel.

- `Created as part of the image` – With this option, you provide a WebLogic Deploy Tooling (WDT) model of the domain and a WDT installer to the WebLogic Image Tool (WIT) while creating the image, and WIT creates the domain inside the image.  This option is also called Domain-in-Image (DII) and WKO calls it Image.  **NOTE**: WKO has deprecated this option.

- `Externally created in a Kubernetes persistent volume` – With this option, you must create a Kubernetes persistent volume and create the domain on that persistent volume.  This option is also called Domain-on-PV (DoPV) and WKO calls it PersistentVolume.

The ToDo List application requires only WebLogic Server and fits well with the Model-in-Image mechanism, so select `Created in the container from the model in the image`.

### Kubernetes Cluster Target Type

This is where you must choose whether to deploy directly using a Kubernetes cluster, where you install `WebLogic Kubernetes Operator` and an Ingress controller, or to deploy to `Verrazzano`.  Because the Quick Start guide covers both tracks, choose the option that matches the track you plan to follow.

### Java Installation

You need to tell WKTUI which Java installation to use when running actions that require the WebLogic Deploy Tooling or WebLogic Image Tool.  For this project, choose the Java Home directory for your Oracle JDK 11 directory.

### Oracle Fusion Middleware Installation

Running the WebLogic Deploy Tooling requires an Oracle Home directory.  As such, you must tell WKTUI which Oracle Home directory contains the Oracle Fusion Middleware software you plan to use.  Because this project uses WebLogic Server (WLS) 14.1.1, set this field to the directory containing your WLS 14.1.1 installation.

### Image Builder Tool

Because you will be building an image as part of this project, you need to tell WKTUI whether you will use Docker or Podman to build your image.  You also need to provide the path to the executable that matches your selection.  Because you are running Rancher Desktop on macOS, you will select Docker and supply the Docker executable (for example, `/Users/fred.jones/.rd/bin/docker`).  Provide the answers that best fit your environment.

Now that your project settings are mostly complete, use the `File` menu, `Save All` option to save the project before you move on to creating the model for your domain.  WKTUI will prompt you for the encryption passphrase you want to use with this project.  Choose whatever value you like; just try not to forget it!
