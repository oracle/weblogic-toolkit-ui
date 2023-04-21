---
title: "Online Remote Discover"
date: 2019-02-22T15:44:42-05:00
draft: false
weight: 2
description: "Add Model Using Remote Online Discovery"
---

In WKTUI, go to the `Model` page and select the `Code View` tab.  Select the `File` > `Add Model` > `Discover Model (online)`
menu item.  The following dialog box appears.  Enter the information shown in the following image, including the Domain Home
path `$WKTUI_QS_HOME/todolist_domain` directory.  Make sure to provide the WebLogic user name and password specified when
you ran the `createToDoListDomain` script.

{{< img "Online Discovery" "images/a4-online-discovery.png" >}}

This path is used to present the results of what we need to do, as shown in the following image.

{{< img "Online Discovery Results" "images/a5-online-discovery-results.png" >}}

Depending on the version of WDT you are using, online remote discovery adds some fields with their default values that were not actually set in the original model used to build the domain.  WDT is continuing to improve discovery so your results may be slightly different than those shown in the following image.

{{< img "Online Discovered Model" "images/a6-online-discovered-model.png" >}}

Because we want to be able to go back seamlessly to the main flow with your model, you will clean it up a bit, fill in the missing variable values, and add the application to the archive file. Please make the following changes:
1.	Delete the SSL block under the `todo-srv-template`.
2.	Under `todo-srv-template`, remove the `ListenPort` field and replace it with the `ListenPortEnabled` field set to `true`.
3.	In the `JDBCDriverParams` block, change `localhost` to `mysql` in the URL field.
4.	Set the empty variable values using the values specified when you ran the `startMySQL` and `createToDoListDomain` scripts.

Now, click the Plus Sign in the archive editor.  Choose the `Archive Entry Type`, `Application`, and set the `Application Archive File` to the file at `$WKTUI_QS_HOME/app/target/todo.war`, as shown in the following image, and then click **OK**.

{{< img "Add to Archive" "images/a7-add-to-archive.png" >}}

Now, the model should look similar to the one shown in the following image (except that the variable values will match the credentials you chose).

{{< img "Completed Online Discovered Model" "images/a8-completed-online-discovered-model.png" >}}

At this point, the model is roughly equivalent to the hand-built one shown in the [Validate Model Code View]({{< relref "/setup/quickstart/create-wdt-model#validate-and-prepare-the-model" >}}).  Most of the minor differences will go away after you prepare the model.  

You can stop any running WebLogic Servers in the local domain, and stop and remove the `mysql` container.  To continue, return to [Validate and Prepare the Model]({{< relref "/setup/quickstart/create-wdt-model#validate-and-prepare-the-model" >}}).
