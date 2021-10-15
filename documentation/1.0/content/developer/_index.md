+++
title = "Developer Guide"
date = 2019-02-22T15:27:38-05:00
weight = 4
pre = "<b> </b>"
+++




The WebLogic Kubernetes Toolkit UI is a desktop application designed to help WebLogic users move their applications to run in a Kubernetes environment.

#### Setting up your development environment
When working with this project, you must be on the Oracle network.

1. Download and install the latest LTS version of node.js from [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
2. Create the file ~/.npmrc (%USERPROFILE%\.npmrc on Windows) with the following content:
   ```
   registry=https://artifacthub-tip.oraclecorp.com/api/npm/npmjs-remote
   noproxy=localhost,127.0.0.1,.local,.oracle.com,.oraclecorp.com
   ```
3. Set these 5 environment variables to configure the proxy correctly:
   ```
   ELECTRON_GET_USE_PROXY=true
   GLOBAL_AGENT_HTTPS_PROXY=http://www-proxy-hqdc.us.oracle.com:80
   WKTUI_DEV_PROXY=http://www-proxy-hqdc.us.oracle.com:80
   HTTPS_PROXY=http://www-proxy-hqdc.us.oracle.com:80
   NO_PROXY=.oraclecorp.com,.us.oracle.com,.oraclevcn.com
   ```
4. Open a command line window are run the following command to update the version of npm to the latest:
   ```bash
   sudo npm install --global npm
   ```
5. Set up your global git configuration by running the following commands:
   ```bash
   git config --global user.name "<your real name>"
   git config --global user.email "<your-oracle-email-address>"
   git config --global core.ignoreCase false
   ```
   **This last command is critical if you are developing on either Windows or MacOS.  Yes, the MacOS file system
   is, by default, case-insensitive!**


6. Clone the git repository on GitHub at [https://github.com/oracle/weblogic-toolkit-ui](https://github.com/oracle/weblogic-toolkit-ui).
7. Open a command-line in the `wktui` directory and run `npm install` to download and install the JavaScript dependencies required by the project.
8. Open a command-line in the `wktui/electron` directory and run `npm run install-tools`.
9. Open a command-line in the `wktui/webui` directory and run `npm start`.
10. Once the server from the previous step is fully running, open a command-line in the `wktui/electron` directory and run `npm start`.

#### Building a Windows or MacOS installer
0. Set up your development environment and verify that the application is working properly from it.
1. Open a command-line in the `wktui/electron` directory and run `npm run build`.
2. Find the executable and installer(s) in the `wktui/dist` directory.

#### Building a Linux installer
0. Set up your development environment and verify that the application is working properly from it.
1. Open a command-line in the `wktui/webui` directory and run `npm run build:release`.
2. From the command-line in the `wktui/scripts` directory, run `./devBuildLinuxInstallers.sh`.
3. Find the executable and installer(s) in the `wktui/dist` directory.
