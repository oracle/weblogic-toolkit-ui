---
title: "Offline Discover"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 1
description: "Add Model Using Discover Model (Offline)"
---

In WKTUI, go to the Model page and select the Code View tab.  Select the `File` > `Add Model` > `Discover Model (offline)` menu item.  The following dialog box appears.  Enter the path to the `$WKTUI_QS_HOME/todolist_domain` directory as the Domain Home, as shown in the following image.

{{< img "Offline Discovery" "images/a2-offline-discovery.png" >}}

To start the discovery process, click **OK**.  After it completes, make the following required model changes:

- Fill in the credentials using `weblogic` as the user names and `welcome1` as the passwords
- Change `localhost` in the JDBC URL on line 34 to `mysql`.

Because a server template’s `ListenPortEnabled` value defaults to `true`, this attribute was omitted from the discovered model.  To make your model look the same as the hand-built one, add the `ListenPortEnabled` attribute with a value of `true` to the server template, as shown in the following image.

{{< img "Offline Discovered Model" "images/a3-offline-discovered-model.png" >}}

At this point, the model is roughly equivalent to the hand-built one shown in the [Validate Model Code View]({{< relref "/setup/quickstart/create-wdt-model#validate-and-prepare-the-model" >}}).  All the minor differences will go away after you prepare the model.  

You can stop any running WebLogic Servers in the local domain, and stop and remove the `mysql` container.  To continue, return to [Validate and Prepare the Model]({{< relref "/setup/quickstart/create-wdt-model#validate-and-prepare-the-model" >}}).
