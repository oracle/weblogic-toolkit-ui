# WebLogic Kubernetes Toolkit UI
The WebLogic Kubernetes Toolkit (WKT) is a collection of open source tools that help you provision WebLogic-based
applications to run in Linux containers on a Kubernetes cluster.  WKT includes the following tools:

- [WebLogic Deploy Tooling (WDT)](https://github.com/oracle/weblogic-deploy-tooling) - A set of single-purpose,
  lifecycle tools that operate off of a single metadata model representation of a WebLogic domain.
- [WebLogic Image Tool (WIT)](https://github.com/oracle/weblogic-image-tool) - A tool for creating Linux container
  images for running WebLogic domains.
- [WebLogic Kubernetes Operator (WKO)](https://github.com/oracle/weblogic-kubernetes-operator) - A Kubernetes operator
  that allows WebLogic domains to run natively in a Kubernetes cluster.
- [WebLogic Remote Console](https://github.com/oracle/weblogic-remote-console) - A lightweight console for managing
  WebLogic Server domains running anywhere.

The WKT UI provides a graphical user interface that wraps the WKT tools, Docker, Helm, and the Kubernetes client
(`kubectl`) and helps guide you through the process of creating and modifying a model of your WebLogic domain, creating
a Linux container image to use to run the domain, and setting up and deploying the software and configuration
necessary to deploy and access the domain in your Kubernetes cluster.

**NOTE**: The WKT UI application is built using the Electron framework and as such, we support only the platforms and versions supported by [Electron](https://www.electronjs.org/docs/latest/tutorial/support#supported-platforms).  For example, because of the Electron requirement for Fedora 24 or newer, we support _only_ versions 8.0 and higher of Oracle Linux, RedHat Linux, and CentOS Linux.


## About the Documentation

Documentation for WebLogic Kubernetes Toolkit UI is available [here](https://oracle.github.io/weblogic-toolkit-ui/).

This documentation includes information for users and for developers.

## Get Help

We have a closely monitored public Slack channel where you can get in touch with us to ask questions about using the
WebLogic Toolkit UI or give us feedback or suggestions about what features and improvements you would like to see.
We would love to hear from you.

To join our public channel, please visit this [site](https://weblogic-slack-inviter.herokuapp.com/) to get an invitation. The invitation email will include details of how to access our Slack workspace. After you are logged in, please come to `#weblogic-kubernetes-toolkit` and say, “hello!”

## Related Projects
For detailed documentation and access to WebLogic Toolkit-related projects, see:

* [WebLogic Kubernetes Operator](https://github.com/oracle/weblogic-kubernetes-operator)
* [WebLogic Deploy Tooling](https://github.com/oracle/weblogic-deploy-tooling)
* [WebLogic Image Tool](https://github.com/oracle/weblogic-image-tool)
