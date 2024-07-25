---
title: "Create images with the WebLogic Image Tool"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 6
---

WKTUI uses the WebLogic Image Tool (WIT) to build container images.  Each Oracle Fusion Middleware (FMW) Domain Target Location option has its own image requirements.

- Model-in-Image – MII has two approaches:
   - Single Image – This approach uses a single image with Java, FMW, WDT, and the WDT model files all built into a single image.  In WKTUI, we use the `Primary Image` tab to build such an image.
   - Dual Images – This approach puts Java and FMW into one image, which WKTUI calls the primary image, and WDT and the WDT model files into a separate image, known as the auxiliary image.  In this document, we refer to this as MII with Auxiliary Image.
- Domain-in-Image – DII uses a single image approach but uses WDT and the WDT model files to create the domain inside the image.
- Domain-on-PV – DoPV uses a single image with Java and FMW in it.  The domain is created on the persistent volume by external means.

Both MII with Auxiliary Image and Domain-on-PV have an image containing only software (Java and FMW) with no configuration.  This provides several important, operational advantages:

- Multiple domains can share the same software-only image since no domain-specific configuration is included.  Updating hundreds of domains that all share the same image is as simple as updating the WebLogic Kubernetes Operator Domain custom resource specification to change the image.  WKO will detect this change and perform a rolling update of the domain, starting with the Administration Server.
- The Oracle Container Registry (OCR) distributes prebuilt images that you can use directly, after you log in and accept the terms and conditions.  Oracle customers with an active support contract can access prebuilt images with the latest set of recommended patches.  See https://container-registry.oracle.com for more information about the prebuilt images and to accept the terms and conditions for the repositories of interest.

With DII and MII (without an auxiliary image), you would need to build new images for every domain to roll out a security fix across our entire set of domains.  For those with large numbers of domains, this becomes a heavy burden, leading to less secure environments.  To take advantage of these operational advantages, you will use MII with Auxiliary Image for the ToDo List domain.

Go to the `Image` page, shown in the following image.  

{{< img "Image Page" "images/image-page.png" >}}

You could build your own primary image by enabling `Create New Primary Image`, which is off by default.  To do this, you would need to download the Java 11 JDK and WebLogic Server 14.1.1 installers, fill out the form, and run `Create Primary Image`.  Then, you would need to create an image repository in an image registry somewhere and push the newly created image there.  When Oracle releases the next set of patches, you would have to do it again.

Fortunately, you can simply use the prebuilt images in OCR.  Log into [OCR](https://container-registry.oracle.com) and select the **Middleware** category.  For those without Oracle Support credentials, make sure that you have accepted the terms and conditions for the `weblogic` repository.  In the following image, note the green checkmark at the end of the `weblogic` repository row.  For those with Oracle Support credentials, it is highly recommended to use the `weblogic_cpu` repository at the bottom of the page instead.

{{< img "OCR" "images/ocr.png" >}}

For this exercise, you will create a new auxiliary image.  This is the default setting and the `Auxiliary Image` tab is active.  Select the `Auxiliary Image` tab, as shown in the following image.  

{{< img "Aux Image Tab" "images/aux-image-tab.png" >}}

The first thing you need to decide is what image registry to use for the auxiliary image.  For this exercise, you will use the Container Registry from the Oracle Cloud (OCIR) but feel free to substitute another image registry.  We will try to point out where your image registry selection impacts the rest of the example.  


After logging in to your Oracle Cloud account, select to the Container Registry option under the **Developer Services** category, as shown in the following image.  

{{< img "OCIR Location" "images/ocir-location.png" >}}

In the registry of your choosing, create a new private repository called `wktui-qs/todolist-aux`.  Note the URL needed to access the new repository.  For the OCIR repository, the URL is of the form `<region-abbreviation>.ocir.io/<tenancy-name>/wktui-qs/todolist-aux`, where region-abbreviation is something like `phx` (for the Phoenix region) and tenancy name is the name of the tenancy used to log in to `https://cloud.oracle.com`. For a listing of every available region, refer to this [table](https://docs.oracle.com/en-us/iaas/Content/Registry/Concepts/registryprerequisites.htm#Availab).

To access this OCIR repository from Docker and Kubernetes, you need to use an Auth Token associated with your account in place of your password.  To create an Auth Token, go to your User settings, select the Auth Tokens option under Resources, and click **Generate Token**, as shown in the following image.  Make sure to retain a copy of the generated token, because this is the _only_ opportunity you will have to see it in clear text!

{{< img "OCI Create Auth Token" "images/oci-create-auth-token.png" >}}

Now that your Image Registry is ready, you simply fill out the `Auxiliary Image` tab in WKTUI.  There are a couple of things to note before you fill out the form.

- Most image registries require authentication to push an image.  If you are using OCIR, the Auxiliary Image Registry Push Username and Auxiliary Image Registry Push Password must do the following:
   - Username: Must be of the form `<tenancy-name>/<username>`.
   - Password: Must be the value an Auth Token associated with the user’s account.
- By default, WIT (and therefore WKTUI) use BusyBox as the base image for an auxiliary image.  Because BusyBox typically comes from Docker Hub and Docker Hub has implemented anonymous pull request throttling, it is a good idea to enter a valid Docker Hub Username and Docker Hub Password to minimize the change of throttling-related errors while building the image.
- You can change the base image simply by enabling `Use Custom Base Image` and filling out the form.
- If your target platform is OpenShift, enable `Make Image Compatible with OpenShift` in the **Advanced** section of the page.

With these things in mind, fill out the form using the data in the following table.  If a field’s value is not provided, then leave it set to the default unless otherwise required for your environment.

| Field Name | Value |
| --- | --- |
| `Auxiliary Image Tag` |  `<image-repository-url>:1.0`; for example, `phx.ocir.io/mytenancy/wktui-qs/todolist-aux:1.0` |
| `Specify Auxiliary Image Push Credentials` |  `ON` |
| `Auxiliary Image Registry Push Username` |  `<tenancy>/<username>`; for example, `mytenancy/fred.jones@mycompany.com` |
| `Auxiliary Image Registry Push Password` | `<auth-token-value>`; for example, `z+M3C2UqRraHG73Z+.X8`  |
| `Use Custom Base Image` | `OFF` |
| `Docker Hub Username` |  Your Docker Hub account user name |
| `Docker Hub Password` | Your Docker Hub account password |
| `Download and Use Latest WebLogic Deploy Tooling Installer` | `ON` |
| `Make Image Compatible with Open Shift` | `OFF` (unless required for your environment)) |

After you complete the form, you are ready to create the auxiliary image.  Click **Create Auxiliary Image**  to have the application invoke WIT with the specified set of arguments to build the auxiliary image.  The application prompts you twice prior to running WIT’s `createAuxImage` command:

- You always should run **Prepare Model** prior to creating the auxiliary image.  Because you have already done that, select `No` to continue without running Prepare Model.  
- You need to choose the location to store the downloaded WDT installer.  Choose the location and Click **Select**.

The following image shows the application after successfully creating the auxiliary image.

{{< img "Create AUX Image" "images/create-aux-image.png" >}}

Now, you are ready to push the auxiliary image to the image registry.  If running on macOS, you need to make sure that your Docker (or Podman) executable directory (for example, `$HOME/.rd/bin`, if using Rancher Desktop) is added to the `Extra Path Directories` table on the `Project Settings` page.  Doing this allows Docker to find the executable it uses to interact with the macOS Keychain for storing credentials.

Click **Push Auxiliary Image**.  At this point, you are ready to shift your focus to the Kubernetes cluster.  Remember, any change to the model files requires creating a new auxiliary image, which may require rerunning **Prepare Model** if fields were added to the model’s YAML file.  We strongly recommend that you always increment the version number of the `Auxiliary Image Tag` field prior to creating and pushing a new image.  This will make it very clear which image is in use.
