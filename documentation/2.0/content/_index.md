---
weight: 1
pre: "<b> </b>"
hideHeader: true
---

## WebLogic Kubernetes Toolkit UI Documentation

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

Be sure to check out the [Quick Start]({{% relref "/setup/quickstart/" %}}) guide for a tutorial, which will step you
through WebLogic Kubernetes Toolkit UI (WKTUI) functionality and familiarize you with its capabilities.

### Current release

WebLogic Kubernetes Toolkit UI version and release information can be found [here](https://github.com/oracle/weblogic-toolkit-ui/releases).

### About the Documentation
For detailed user information, read the following:

- [About the WKT UI Application]({{% relref "/concepts/" %}})
- WebLogic Kubernetes Toolkit UI [Prerequisites]({{% relref "/setup/prerequisites.md" %}}) and [Installation]({{% relref "/setup/install.md" %}})
- [Navigate the WKT UI]({{% relref "/navigate/" %}})
    - [Model]({{% relref "/navigate/model.md" %}})
    - [Image]({{% relref "/navigate/image.md" %}})
    - [Kubernetes]({{% relref "/navigate/kubernetes/" %}})

For developer information, see [WebLogic Kubernetes Toolkit UI Project]({{% relref "/developer/" %}}).

### Get Help

We have a closely monitored public Slack channel where you can get in touch with us to ask questions about using the
WebLogic Toolkit UI or give us feedback or suggestions about what features and improvements you would like to see.
We would love to hear from you.

To join our public channel, please visit this [site](https://join.slack.com/t/oracle-weblogic/shared_invite/zt-1ni1gtjv6-PGC6CQ4uIte3KBdm_67~aQ) to get an invitation. The invitation email will include details of how to access our Slack workspace. After you are logged in, please come to `#weblogic-kubernetes-toolkit` and say, “hello!”

### Related Projects
For detailed documentation and access to WebLogic Toolkit-related projects, see:

- [WebLogic Kubernetes Operator](https://oracle.github.io/weblogic-kubernetes-operator/)
- [WebLogic Deploy Tooling](https://oracle.github.io/weblogic-deploy-tooling/)
- [WebLogic Image Tool](https://oracle.github.io/weblogic-image-tool/)
