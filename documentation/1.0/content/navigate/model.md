---
title: "Model"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
---


### Contents
- [Model](#model)
- [Design View](#design-view)
- [Code View](#code-view)
    - [Model Editor](#model-editor)
    - [Variables Editor](#variables-editor)
    - [Archive Editor](#archive-editor)
- [Prepare Model](#prepare-model)


### Model
The `Model` section helps you work with WebLogic Deploy Tooling models for a WebLogic domain.  A WebLogic
Deploy Tooling model for a domain can include the following file types:

- Model file - A declarative definition of the domain configuration.
- Variable file - A property file that maps names to values.  These names can be referenced from the model file to
   allow a model to be used across environments by applying the variable file for a particular environment to the model.
- Archive file - A ZIP file containing application binaries and other files and directories needed to run the domain.

For more information about WebLogic Deploy Tooling models, see [Metadata Model](https://oracle.github.io/weblogic-deploy-tooling/concepts/model/)
and [Archive File](https://oracle.github.io/weblogic-deploy-tooling/concepts/archive/) in the WebLogic Deploy
Tooling documentation.

### Design View
In the current release, the `Design View` is empty.  Our intention is to eventually provide a WebLogic
console-like set of pages that will make it easier to create or edit a model using an interface more familiar to
WebLogic administrators and developers.

### Code View
Using an IDE-like layout, the `Code View` provides editor panes for editing the model, variables, and archive files,
each of which support creating and editing the domain's WDT files. When working with an editor, there are several things
to keep in mind:

- When working with a WKT Project that has no associated WDT file for storing the data, entering data into an editor
  will cause a new WDT file with the editor's current content to be created and associated with the project.
- Changes made in the editor are buffered in memory until the WKT Project is saved.
- Adding, deleting, or modifying data in the variable or archive editors will _not_ change the model references.  You
  will need to make sure that the model references are accurate and up to date.

While it is possible to use the WKT UI application to create the files from scratch, the `File > Add Model`
menu supports adding existing files or using the WebLogic Deploy Tooling's
[Discover Domain Tool](https://oracle.github.io/weblogic-deploy-tooling/userguide/tools/discover/)
to create a model of an existing domain.

{{% notice note %}}
While WebLogic Deploy Tooling supports using multiple model, variables, or archive files to describe a single
domain, the current release of WKT supports _only_ one WDT model file, one WDT variables file, and one WDT archive file for
describing the domain.
{{% /notice %}}

#### Model Editor
In `Code View`, the model editor is just to the right of the navigation pane.  This editor displays the current
model file associated with the WKT Project file.  Typing model content into the editor will
result in a new model file being added to the project the next time the project is saved.

The current release has the following limitations:

- Model files must be in YAML format.
- Model files must exist directly on the file system and not inside an archive, such as in a ZIP file; any model file inside an archive is ignored by the application.

#### Variables Editor
The WDT variables editor is in the upper right pane of the `Code View` page.  It supports editing any existing
name-value pairs, as well as adding or removing name-value pairs.

To reference a variable from the model, you must set the value of the desired model file to a variable reference.
For example, the model snippet shown here references a variable named `httpPort`.

```yaml
topology:
    Name: tododomain
    ProductionModeEnabled: true
    Cluster:
        mycluster:
            DynamicServers:
                ServerNamePrefix: Server_
                DynamicClusterSize: 10
                ServerTemplate: mysrvtemplate
    ServerTemplate:
        mysrvtemplate:
            ListenPort: '@@PROP:httpPort@@'
            Cluster: mycluster

```

When working with this model file, WebLogic Deploy Tooling expects the `httpPort` variable to be defined in the model's
variables file, as shown here:

```properties
httpPort = 7001
```

#### Archive Editor
The WDT archive editor is in the lower right pane of the `Code View` page.  It supports adding content to and
removing content from the archive file.  While updating content in the archive is not supported directly by the archive
editor, the archive editor safely supports multiple operations on the same entry.  As such, combining a
`remove` operation followed by the corresponding `add` operation will effectively replace an entry.

To add content to the archive file, use the plus (`+`) button in the archive editor
title bar and follow the prompts to choose the type of content to add and select the corresponding file or directory.
For example, to add a WAR file called `todo.war` to the archive, do the following:

1. On the archive editor title bar, click `+`.
2. In the resulting dialog, choose `Application File` from the list and click `OK`.
3. In the resulting file chooser dialog, select the `todo.war` file and click `Select`.

This will result in the file structure `wlsdeploy/applications/todo.war` being added to the archive editor pane.
At this point, the application has not created or modified the archive file; it is simply storing
the data it needs about the archive path to the added entry and the file path where the content is found.  Saving the
WKT Project will update the archive to reflect the buffered operations performed in the editor.  

{{% notice note %}}
Don't forget to add the application to the model and set its `SourcePath` attribute to the path in the archive where it can be found,
as shown in the following model file snippet.
{{% /notice %}}

```yaml
appDeployments:
    Application:
        todo:
            SourcePath: wlsdeploy/applications/todo.war
            ModuleType: war
            Target: mycluster
```

To remove content from the archive file, select the content to remove in the archive editor pane and click the minus (`-`)
button in the archive editor title bar.  _Don't forget to remove any reference to this content from the model file._

#### Prepare Model
`Prepare Model` invokes the WDT [Prepare Model Tool](https://oracle.github.io/weblogic-deploy-tooling/userguide/tools/prepare/)
to modify the model to work in a Kubernetes cluster with WebLogic Kubernetes Operator or Verrazzano installed.  This
action is available by using the `Prepare Model` button on the `Model` and `Kubernetes WebLogic Domain` pages and by selecting
`Go` > `Prepare Model for Kubernetes`.  It is also possible to run `Prepare Model` during the `Create
Image` action, though typically it is best to run `Prepare Model` explicitly, prior to moving to the `Image` section.


`Prepare Model` does the following:

1. Removes model sections and fields that are not compatible with the target environment.
2. Replaces endpoint values with model tokens that reference variables.
3. Replaces credential values with model tokens that reference either a field in a Kubernetes secret or a variable.
4. Provides default values for fields displayed in the application's variable, variable overrides, and secret editors.
5. Extracts topology information to the application that it uses to generate the resource file used to deploy the domain.

For more information, see the WDT [model tokens](https://oracle.github.io/weblogic-deploy-tooling/concepts/model/#model-tokens)
documentation.

In replacing credential values, `Prepare Model` must handle the replacement differently for the "Domain in Image" and
"Model in Image" [domain locations]({{< relref "/navigate/project-settings#choosing-a-domain-location" >}}).

With "Domain in Image", the WebLogic Image Tool creates the domain while creating the image.  As such, it has no
knowledge of Kubernetes so the token replacement uses variable tokens so that domain creation has access to the actual
credential values.  You must ensure that all variables have valid values prior to running `Create Image`.

For "Model in Image", the domain is created at runtime by the WebLogic Kubernetes Operator running in a Kubernetes
cluster.  As such, token replacement uses secret tokens for all credential fields.  You must to be sure to provide
values for all secret reference fields using the `WebLogic Domain` section's `Secrets` pane so that the required secrets
get populated correctly during domain deployment.  For more information, see [WebLogic Domain]({{< relref "/navigate/kubernetes/k8s-weblogic-domain.md" >}}).

{{% notice note %}}
The application tries to preserve any values from the model and variable files that `Prepare Model` replaces
with secret tokens.  The current release is limited by the behavior of the underlying WDT Prepare Model Tool in that
all passwords are not retained and must be re-entered in the appropriate location.
{{% /notice %}}
