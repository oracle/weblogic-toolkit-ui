---
title: "Deploy the Verrazzano Component for the WebLogic Domain"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 3
description: "Create and deploy the Verrazzano component for the WebLogic domain."
---

Verrazzano installation includes the WebLogic Kubernetes Operator.  To tell the operator about a new WebLogic or FMW domain, you need to create a Verrazzano component that includes an operator Domain resource object in Kubernetes.  Starting in Verrazzano 1.5.0, the Verrazzano component also needs an operator Cluster resource object for every cluster in the domain.  This separation is required to work with the Kubernetes Horizontal Pod Autoscaler (HPA) to allow it to automatically scale the clusters based on load (but only up to the maximum size of the WebLogic cluster). For more information, see this WebLogic Kubernetes Operator [Scaling](https://oracle.github.io/weblogic-kubernetes-operator/managing-domains/domain-lifecycle/scaling/) documentation.

WKTUI generates the required Verrazzano Component objects for your domain because of the project settings.  Go to the `Verrazzano` > `Component` page.  Fill in the form fields, as described in the following table.  Don’t worry about the Image Pull Secret value `ocr` and the fact that it does not exist.  You will create that secret before deploying the domain.

| Field Name | Value |
| --- | --- |
| `Verrazzano Version` |  If not already populated, use the button inside the field to get the installed version from the Kubernetes cluster. |
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

After you have filled out the fields in the preceding table, you need to look at some additional fields contained in tables, shown in the following image.  

{{< img "VZ Domain Clusters" "images/vz-domain-clusters.png" >}}

1. First, look at the `Clusters` table.  As you can see, the cluster from your model has been added to this table (by the earlier invocation of the Prepare Model action).  If you do not see the cluster, run **Prepare Model** again to populate the table.  
2. Notice that the `Replicas` value for the cluster is set to the maximum size of the cluster, as specified in the model.  Select the Pencil icon toward the right end of the row.  Notice that you cannot set the `Replicas` value higher than 10.  After you are done, change the value to `2` and click `OK`.
3. Next, look at the `Model Variables Overrides` section.  This section lets you override the values specified in the variables model file in the auxiliary image using a Kubernetes ConfigMap.  Because you do not need to override these values, you can move on to the Secrets section.

The Secrets section contains all model-defined secrets and lets you specify the user name and password.  In the preceding image, notice that the secret associated with your MySQL database connection is already populated.  This value was removed from the model (or the variable reference) by the Prepare Model action and added here.  If you run **Prepare Model** more than once, you will lose this value and must type it in manually.  WDT generally will not populate password values so you need to enter your MySQL database password, which is set to `welcome1` in the Quick Start `scripts/wkoDeployMySQL` script.  If you want, feel free to change it to something more secure but make sure that the user name and password match in the script and WKTUI.

Before you deploy your component, switch to the `Code View` tab and select the `Component Resource` sub-tab.  Notice that your component contains a workload object, `VerrazzanoWebLogicWorkload`.  This object contains the WebLogic Kubernetes Operator Domain and Cluster custom resources for your domain.  You also have a `ConfigMap Resource` sub-tab.  This is the Kubernetes config map where any `Model Variable Override` values are stored.  Because we did not override any of the model variables’ values, the `todolist-domain-overrides.properties` element is empty.

Click **Deploy Component**.  Remember, deploying a Verrazzano component simply creates the component object in Kubernetes, which does not cause the WebLogic domain to be instantiated.  That happens after a Verrazzano Application (also known as the Application Configuration) object is deployed.  

Before turning your attention to creating the Verrazzano application object, you need to create the Verrazzano component for your MySQL database.  You will deploy the database to the same namespace as the domain, so you need to create the following Kubernetes objects to deploy the database:

•	`todolist-domain-ns` Namespace – The Kubernetes namespace where both the WebLogic or FMW domain and MySQL database will reside.
•	`ocr` Secret – The Kubernetes image pull secret for pulling images from the Oracle Container Registry.
•	`mysql` Secret – the Kubernetes secret that holds the root password, user name, and password of the user the ToDo List application uses to connect to the database.
•	`todolist-mysql-cm` Config Map – The Kubernetes config map used to hold the `init-schema.sql` script to initialize the MySQL database on startup.
•	`todolist-mysql-deployment` Deployment – The Kubernetes deployment that will start and manage the MySQL database.
•	`mysql` Service – The Kubernetes service that exposes the MySQL database by the `mysql` DNS name to the WebLogic managed servers.

To do make this easier, go to the `QuickStart` directory and do the following:
1.	Edit the demarcated section of the `setQuickstartEnv` shell script to match your environment.
2.	Source (macOS or Linux) or run the `setQuickstartEnv` shell script.
3.	Change to the `scripts` subdirectory and run the `vzDeployMySQL` script, which creates the Kubernetes objects and Verrazzano components described previously.

Now that the MySQL database components are deployed, you are ready to create the Verrazzano application, which is covered in the next section.
