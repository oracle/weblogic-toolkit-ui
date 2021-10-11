# WebLogic Kubernetes Toolkit UI
The WebLogic Kubernetes Toolkit (WKT) is a collection of open source tools that help you provision WebLogic-based
applications to run in Linux containers on a Kubernetes cluster.  WKT includes the following tools:

- [WebLogic Deploy Tooling (WDT)](https://github.com/oracle/weblogic-deploy-tooling) - A set of single-purpose,
  lifecycle tools that operate off of a single metadata model representation of a WebLogic domain.
- [WebLogic Image Tool (WIT)](https://github.com/oracle/weblogic-image-tool) - A tool for creating Linux container
  images for running WebLogic domains.
- [WebLogic Kubernetes Operator (WKO)](https://github.com/oracle/weblogic-kubernetes-operator) - A Kubernetes operator
  that allows WebLogic domains to run natively in a Kubernetes cluster.

The WKT UI provides a graphical user interface that wraps the WKT tools, Docker, Helm, and the Kubernetes client
(`kubectl`) and helps guide you through the process of creating and modifying a model of your WebLogic domain, creating
a Linux container image to use to run the domain, and setting up and deploying the software and configuration
necessary to deploy and access the domain in your Kubernetes cluster.

## Get Started

Download the latest WebLogic Kubernetes Toolkit UI application here.

(How to install and whatever else is needed to get started can go either here (if brief) or in a separate doc.)

Initial launch of the application displays a thorough "Introduction" to the WKT UI. Step through
it or dismiss it; you can peruse it at any time using `Help > Show Introduction`.

## About the Documentation
For detailed user information, read the following:

- WebLogic Kubernetes Toolkit UI [Prerequisites](site/prerequisites.md)
- About the [WKT UI Application](site/setup.md)
- [Navigate the WKT UI](site/project-settings.md)
    - [Model](site/model.md)
    - [Image](site/image.md)
    - [Kubernetes](site/k8s-client-config.md)
    - [Verrazzano](site/verrazzano.md)

For developer information, see [WebLogic Kubernetes Toolkit UI Project](site/developer.md).

## Get Help

We have a closely monitored public Slack channel where you can get in touch with us to ask questions about using the
WebLogic Toolkit UI or give us feedback or suggestions about what features and improvements you would like to see.
We would love to hear from you.

## Related Projects
For detailed documentation and access to WebLogic Toolkit-related projects, see:

- [WebLogic Kubernetes Operator](https://oracle.github.io/weblogic-kubernetes-operator/)
- [WebLogic Deploy Tooling](https://oracle.github.io/weblogic-deploy-tooling/)
- [WebLogic Image Tool](https://oracle.github.io/weblogic-image-tool/)
