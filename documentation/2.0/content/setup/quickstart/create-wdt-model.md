---
title: "Create the WebLogic Deploy Tooling model"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 5
---

The WebLogic Deploy Tooling project provides a set of single-purpose tools for performing lifecycle operations of WebLogic
Server domains.  These tools work off a model of the domain.  The model contains three types of files:

- Model file – A YAML description of the domain that is aligned with WebLogic Scripting Tool (WLST) offline folders and attributes.
- Variables file – An optional Java properties file that contains key/value pairs where the key matches with a token placed in the model file.
- Archive file – An optional ZIP file that contains any file artifacts that need to exist in the domain, for example, a 
  WAR file that contains the binaries for a Web application.

For more detailed WDT information, see the WebLogic Deploy Tooling [documentation](https://oracle.github.io/weblogic-deploy-tooling/concepts/model/).

WKTUI provides tooling to make it easy for you to create and edit a WDT model.   This image shows the `Model` page, 
`Design View` tab that allows visual editing of a model.  

{{< img "Model Design View" "images/model-design-view.png" >}}

The following image shows the `Model` page, `Code View` tab that lets you directly edit each of the three different file
types that make up the model.  In the center of the screen, you'll find the YAML editor for the model file.  On the right,
you'll find the variables file editor and the archive file editor. At this point, all the sections are blank.

{{< img "Model Code View" "images/model-code-view.png" >}}

WKTUI also supports discovering an existing domain to extract the model for that domain.  It accomplishes this by using
the WDT [Discover Domain](https://oracle.github.io/weblogic-deploy-tooling/userguide/tools/discover/) tool.  To use this functionality, you use the `File` menu, `Add Model` submenu.  The two 
menu items are:

- `Discover Model (offline)` – With this option, WDT reads the domain directory from the local file system to extract 
  the model files.
- `Discover Model (online)` – With this option, WDT connects to the domain’s running Administration Server to extract
  the model files.  To collect all of the archive file contents automatically, the domain must be running on the local
  machine so that WDT has access to the domain’s file system.  

To collect the model from a domain running on another machine, you can use the Remote Discovery option.  With this option,
at the end of the Discover Domain (online) action, WDT will tell you which files you need to collect and add to the archive file.

Because the ToDo List application has minimal requirements from the domain, you will create the model by hand.  If you
would prefer to create a local domain and use the discover model functionality, see 
[Create ToDo List Domain]({{< relref "/setup/quickstart/qs-advanced#create-the-local-todo-list-domain" >}}) in the Advanced section.

### Create the ToDo List Domain

Start on the Model Design View tab, which will default to the **Domain Info** section top-level page. Set the 
`Admin User Name` and `Admin Password` fields to the user name and password that you want for your WebLogic domain. Also,
select the `Server Start Mode` value of `Production Mode` to simplify things for this guide.

{{< img "Domain Settings" "images/domain-info-settings.png" >}}

Next, click on the **Topology** section in the navigation bar to go to the domain settings.  Enter `todolist_domain` in 
the `Name` field.  There is no need to turn on `Production Mode Enabled` since you already took care of that on the 
**Domain Info** page.

{{< img "Domain Settings" "images/domain-settings.png" >}}

Next, you need to create a server template that you will use with your dynamic cluster.  Select the **Server Templates**
element, add a new server template using the **+** icon in the table header, specify the name as `todo-srv-template`, 
and then click **OK**.  After you create the template, select the link in the table enable `Listen Port Enabled` so that
the screen looks like the following image.  

{{< img "Server Template" "images/server-template-1.png" >}}

Next, you will need to create the dynamic cluster.  Select the **Clusters** item in the navigation bar and create a new 
cluster named `mycluster`. Before moving on to configure the new cluster, return to the Server Template `todo-srv-template`
page and set the `Cluster` field using the dropdown menu to `mycluster`.

Navigate to the new cluster, `Clusters` > `mycluster`, and select the **Dynamic Servers** tab.  Set the fields to the 
values specified in the following table. A couple of things to note:

- The `Max Dynamic Cluster Size` is in the **WLDF Elasticity Framework Settings** expandable setion at the bottom of the page.
- 

| Field Name | Value |
| --- | --- |
| `Server Template` |  `todo-srv-template` |
| `Server Name Prefix` |  `ToDoServer-` |
| `Dynamic Cluster Size` |  `10` |
| `Max Dynamic Cluster Size` | `10` |
| `Enable Calculated Listen Ports` | `Off` |

### Create a Data Source

The next step is to create a data source to communicate with the MySQL database.  Before doing that, switch to the `Code View` tab to see what the WDT model looks like so far.

{{< img "Partial Model Code View" "images/partial-model-code-view.png" >}}

As you can see in the preceding image, the settings you entered are represented in the YAML Editor.  Notice that the model
editor inserted the fields for the domain’s administrative user name and password, and set the values to tokens of the
form `@@PROP:<property-name>@@`.  These tokens reference variables; you can see that the variable names were added to the
Variables Editor.  Go ahead and fill in the values you want to use; for example, `weblogic` for the user name and a strong
password value for the password.  Now, switch back to the `Design View` tab.

Go to the `Services` > `Data Sources` area, add a new Data Source using the values in the following table, and then click **Create**.
Note that you can choose any database user name and password below.  Just make sure that you use these same credentials when deploying the MySQL database later. 

| Field Name | Value                                                            |
| --- |------------------------------------------------------------------|
| `Name` | `myDataSource`                                                   |
| `JNDI Names` | `jdbc/ToDoDB`                                                    |
| `Targets` | `mycluster` (move to `Chosen` column)                            |
| `Datasource Type` | `Generic Data Source`                                            |
| `Database Type` | `MySQL`                                                          |
| `Database Driver` | `MySQL’s Driver (Type 4) Versions: using com.mysql.cj.jdbc.Driver` |
| `Global Transactions Protocol` | `OnePhaseCommit`                                                 |
| `Database Name` | `tododb`                                                         |
| `Host Name` | `mysql`                                                          |
| `Port` | `3306`                                                           |
| `Database User Name` | Choose a database user name                                      |
| `Password` | Choose a database password for the database user               |

After the `myDataSource` Data Source is created, go to the `Connection Pool` > `Advanced` tab and make the following changes:
1.	Enable `Test Connection On Reserve`.
2.	Set the Test Table Name to `ToDos`.


Now, you need to add the application.  Go to `Deployments` > `App Deployments`, add a new application using the values in the following table, and then click **Create**.  You must replace the `$QS_HOME` value in the table with the path where you stored the Quick Start directory when downloading the code.   Note that after the actual file system location is entered, the value will change to reflect its path in the archive file (`wlsdeploy/applications/todo.war`).

| Field Name | Value |
| --- | --- |
| `Name` |  `todo` |
| `Targets` |  `mycluster` (move to `Chosen` column) |
| `Add Source to Archive` |  `ON` |
| `Source` | `$QS_HOME/app/target/todo.war` |

Even though the model is complete enough to create a local domain, you still need to add a few fields so that the WebLogic Kubernetes Operator can use the model.  Switch back to the `Code View` tab.  You will edit the model directly this time.  Make the topology section of the model look like the following.

```
topology:
    Name: todolist_domain
    ProductionModeEnabled: true
    AdminServerName: AdminServer
    Server:
        AdminServer:
    Cluster:
        mycluster:
            DynamicServers:
                ServerTemplate: 'todo-srv-template'
                ServerNamePrefix: 'ToDoServer-'
                DynamicClusterSize: 10
                MaxDynamicClusterSize: 10
                CalculatedListenPorts: false
                MinDynamicClusterSize: 0
    ServerTemplate:
        'todo-srv-template':
            ListenPortEnabled: true
            Cluster: mycluster
```
### Validate and Prepare the Model

The domain model is now complete.  Go ahead and validate the model by clicking **Validate Model** or using the `Go` menu, `Validate Model Files` menu item.  Doing this will invoke the WDT Validate Model Tool and the Console window at the bottom of the screen will display the output of the tool, as shown in the following image. You can close the Console Window at any time.

{{< img "Validate Model Code View" "images/validate-model-code-view.png" >}}

When deploying a domain in Kubernetes, you need to prepare it for that environment.  The WDT Prepare Model Tool gives you what you need to accomplish that.  WKTUI has a special integration with Prepare Model in that not only does it adjust the model for the Kubernetes environment, but also it returns data extracted from the model that WKTUI needs.  For example, Prepare Model returns the list of WebLogic clusters and non-clustered managed servers that other parts of the application use to tailor the environment for this domain.  Click **Prepare Model** to invoke the WDT Prepare Model Tool.

Because you chose to use Model-in-Image for the Quick Start exercise, Prepare Model made several changes to your model.

- Replaced credentials with tokens that reference Kubernetes Secrets.
- Replaced fields like the `Data Source URL` with a token that references a variable.

The following image shows the completed model that is ready to put in an image, so save the project before you move to the next section.

{{< img "Prepare Model Code View" "images/prepare-model-code-view.png" >}}
