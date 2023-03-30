---
title: "Deploy the Verrazzano Application"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 4
description: "Deploy the Verrazzano application."
---

A Verrazzano application is a list of components, each with zero or more traits attached.  Go to the `Verrazzano` > `Application` page.  Add all five components and fill out the remaining fields, as shown in the following figure.

{{< img "Verrazzano Application" "images/verrazzano-application.png" >}}

Now, expand the `todolist-domain` component, enable `Enable Ingress Trait`, and click the plus sign on the `Ingress Rules` table.  Fill in the resulting form with the data shown in the following image.  

{{< img "Ingress Trait Rule" "images/ingress-trait-rule.png" >}}

Click **Deploy Application**.  After the action completes, it will still take several minutes for the application to fully deploy.  Use **Get Application Status** to check on the progress.

After the application is deployed and the WebLogic Domain is up and running, click the **Update URLs** button associated with the `Ingress Rules` table to update the URL with the actual hostname, which will also activate the link, as shown in the following image.  

{{< img "Ingress Trait URL Link" "images/ingress-trait-url-link.png" >}}

Click on the link to go to your application, as shown in in the following image.  Note that because your installation is using self-signed certificates, the browser will likely warn you that going to the application is unsafe.  This is typical for an example environment.

{{< img "VZ ToDo List App" "images/vz-todo-list-app.png" >}}
