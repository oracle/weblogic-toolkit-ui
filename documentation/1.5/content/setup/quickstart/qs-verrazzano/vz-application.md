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
