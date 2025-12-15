+++
title = "Advanced"
date = 2019-02-22T15:27:38-05:00
weight = 10
pre = "<b> </b>"
description = "Use the these sections to walk-through examples of offline discovery and online remote discovery."
+++

As mentioned previously, WKT UI lets you add a model to the project by discovering the model from an existing domain.  To
do this, WKT UI uses the WDT [Discover Domain Tool](https://oracle.github.io/weblogic-deploy-tooling/userguide/tools/discover/).  

Discover Domain has two primary modes of operation:

- Offline Discovery – Uses WLST offline to read the domain directory directly.
- Online Discovery – Uses WLST online to make a connection to the Administration Server and discover the configuration
  by API calls.

Even with online discovery, WDT requires access to the Administration Server file system in order to collect any files
referenced by the domain (for example, application EAR file, CLASSPATH JAR file, database wallet). Online discovery has
three options to choose from:

1. `Collect artifacts from the local file system` - This requires that WKT UI is running on the same machine as the
    Admin Server.
2. `Do not collect artifacts` - This option uses the `-remote` option that preforms the discovery and does its best to
    inform you of the files required by the domain.  This is an imperfect solution; for example, a domain may depend on
    JAR files in the `$DOMAIN_HOME/lib` directory.  Unfortunately, there is no way for remote discovery to determine
    that these files are present using remote API calls.
3. `Use SSH to collect artifacts for remote domain` - This option relies on having SSH configured so that WKT UI can tell
    WDT to establish an SSH connection to the machine where the Admin Server is running so that it can collect the files.
    **Note that this depends on you having previously used SSH (outside the WKT UI application) to establish an SSH
    connection from the local machine to the machine on which the Admin Server is running.**

{{< img "ToDo List App" "images/online-discover.png" >}}

Because your ToDo List domain is simple, in these sections, you will see examples of both offline discovery and online
remote discovery.  Online, non-remote, discovery is very similar process-wise to online remote discovery (except that
you won’t need to build the archive file).  To get started, you will need to set up a local domain.

### Create the Local ToDo List Domain

The WKT UI QuickStart bundle includes scripts to help accomplish this goal.  Go to the directory where you expanded the
QuickStart ZIP file; we refer to this directory as `$WKT UI_QS_HOME` in the following instructions.  

Do the following steps:
1. In the `$WKT UI_QS_HOME` directory, edit the appropriate `setQuickstartEnv` script file (for example, 
   `setQuickstartEnv.ps1` on Windows or `setQuickstartEnv.sh` on macOS or Linux) to match the local machine’s
   environment and your Oracle account credentials.
2. Source (or run) the script file to set the environment variables used by the other scripts.
3. Change to the `$WKT UI_QS_HOME/scripts/local-domain` directory.
4. To start the MySQL database in a container, run the appropriate `startMySQL` script.
5. Create the WDT archive file with the correct version of the todo.war inside of it by simply running the appropriate
   `createArchiveFile` script.
6. To create the domain, run the appropriate `createToDoListDomain` script.
7. Start the Administration Server of the newly created domain using the `$WKT UI_QS_HOME/todolist_domain/startWebLogic`
   script.
8. After the Administration Server is started, open another command-line window, change to the 
   `$WKT UI_QS_HOME/todolist_domain` directory, and run the appropriate `bin/startManagedWebLogic` script like this:

```
$ bin/startManagedWebLogic.sh ToDoServer-1 t3://localhost:7001
```

When prompted, enter the WebLogic Server user name and password chosen when running the `createToDoListDomain` script.
Verify that the application is working properly by opening `http://localhost:8100/todo` in your browser.  You will see
Derek’s ToDo List with five items, as shown in the following image.

{{< img "ToDo List App" "images/a1-todo-list-app.png" >}}

{{% children style="h4" description="true" %}}
