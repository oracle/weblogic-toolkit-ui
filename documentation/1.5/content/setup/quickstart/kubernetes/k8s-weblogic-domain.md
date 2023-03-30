---
title: "Deploy the Domain"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 3
description: "Create and deploy the Kubernetes custom resource for the WebLogic domain."
---

To tell the operator about a new WebLogic or FMW domain, you must create an operator Domain resource object in Kubernetes.  Starting in WKO 4.0.0, the operator also needs an operator Cluster resource object for every cluster in the domain.  This separation is required to work with the Kubernetes Horizontal Pod Autoscaler (HPA) to allow it to automatically scale the clusters based on load (but only up to the maximum size of the WebLogic cluster). For more information, see this WebLogic Kubernetes Operator [Scaling](https://oracle.github.io/weblogic-kubernetes-operator/managing-domains/domain-lifecycle/scaling/) documentation.

WKTUI generated the required operator resource objects for your domain because of the project’s settings.  Go to the `Kubernetes` > `WebLogic Domain` page.  Fill in the form fields, as described in the following table.  

| Field Name | Value |
| --- | --- |
| `WebLogic Admin Username` |  Enter the username that you want to use. |
| `WebLogic Admin Password` |  Enter the password that you want to use. |
| `WebLogic Kubernetes Operator Installed Version` |  If this field is not already populated, press the icon in the text box. |
| `Primary Image Tag` | `container-registry.oracle.com/middleware/weblogic: 14.1.1.0-11-ol8` or `container-registry.oracle.com/middleware/weblogic_cpu: 14.1.1.0-generic-jdk11-ol8` |
| `Specify Image Pull Credentials` | `ON` |
| `Use Existing Image Pull Secret` |  `ON` |
| `Image Pull Secret Name` | `ocr` |
| `Specify Auxiliary Image Pull Credentials` | `ON` |
| `Use Existing Auxiliary Image Pull Secret` | `OFF` |
| `Auxiliary Image Pull Secret Name` | `ocir` |
| `Auxiliary Image Registry Pull Username` | `<tenancy-name>/<oracle-cloud-username>` or user name for your image registry. |
| `Auxiliary Image Registry Pull Email Address` | Your email address. |
| `Auxiliary Image Registry Pull Password` | `<oracle-cloud-auth-token>` or password for your image registry. |

Don’t worry about the Image Pull Secret value `ocr` and the fact that it does not exist.  You will create that secret below before deploying the domain.

After you filled out the fields in the preceding table, you need to look at some additional fields contained in tables, shown in the following image.  

{{< img "Domain Clusters" "images/domain-clusters.png" >}}

1. First, look at the `Clusters` table.  As you can see, the cluster from your model has been added to this table (by the earlier invocation of the Prepare Model action).  If you do not see the cluster, run **Prepare Model** again to populate the table.  
2. Notice that the `Replicas` value for the cluster is set to the maximum size of the cluster, as specified in the model.  Select the Pencil icon toward the right end of the row.  Notice that you cannot set the `Replicas` value higher than 10.  After you are done, change the value to `2` and click `OK`.
3. Next, look at the `Model Variables Overrides` section.  This section lets you override the values specified in the variables model file in the auxiliary image using a Kubernetes ConfigMap.  Because you do not need to override these values, you can move on to the Secrets section.

The Secrets section contains all model-defined secrets and lets you specify the user name and password.  In the preceding image, notice that the secret associated with your MySQL database connection is already populated.  This value was removed from the model (or the variable reference) by the Prepare Model action and added here.  If you run **Prepare Model** more than once, you will lose this value and must type it in manually.  WDT generally will not populate password values so you need to enter your MySQL database password, which is set to `welcome1` in the Quick Start `scripts/wkoDeployMySQL` script.  If you want, feel free to change it to something more secure but make sure that the user name and password match in the script and WKTUI.

Before you deploy the domain, you must deploy the MySQL database.  You will deploy the database to the same namespace as the domain, so you need to create the following Kubernetes objects to deploy the database:

•	`todolist-domain-ns` Namespace – The Kubernetes namespace where both the WebLogic or FMW domain and MySQL database will reside.
•	`ocr` Secret – The Kubernetes image pull secret for pulling images from the Oracle Container Registry.
•	mysql Secret – the Kubernetes secret that holds the root password, user name, and password of the user the ToDo List application uses to connect to the database.
•	`todolist-mysql-cm` Config Map – The Kubernetes config map used to hold the `init-schema.sql` script to initialize the MySQL database on startup.
•	`todolist-mysql-deployment` Deployment – The Kubernetes deployment that will start and manage the MySQL database.
•	`mysql` Service – The Kubernetes service that exposes the MySQL database by the `mysql` DNS name to the WebLogic managed servers.

To do make this easier, go to the `QuickStart` directory and do the following:
1.	Edit the demarcated section of the `setQuickstartEnv` shell script to match your environment.
2.	Source (macOS or Linux) or run the `setQuickstartEnv` shell script.
3.	Change to the `scripts` subdirectory and run the `wkoDeployMySQL` script, which creates the Kubernetes objects described previously to start the MySQL database.

Now that the MySQL database is running at the hostname `mysql` (inside the namespace), click **Deploy Domain**.  This action takes some time to run.  Even after the action finishes, you need to wait a few minutes for the operator to introspect the domain and start the servers.  Use **Get Domain Status** to verify that the domain is up, and all servers are running, as shown in the following image.  

{{< img "Domain Status" "images/domain-status.png" >}}

After your domain is ready, move onto the next section.
