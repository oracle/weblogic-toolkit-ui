# WebLogic Kubernetes Toolkit UI Project

The WebLogic Kubernetes Toolkit UI is a desktop application designed to help WebLogic users move their applications to run in a Kubernetes environment.

## Setting up your development environment
1. Download and install the latest LTS version of node.js from [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
2. If you rely on a proxy server to reach the Internet, set these 5 environment variables to configure the proxy correctly:
   ```
   ELECTRON_GET_USE_PROXY=true
   GLOBAL_AGENT_HTTPS_PROXY=<proxy-url>
   WKTUI_DEV_PROXY=<proxy-url>
   HTTPS_PROXY=<proxy-url>
   NO_PROXY=<list-of-no-proxy-hosts>
   ```
3. Open a command line window are run the following command to update the version of npm to the latest:
   ```bash
   sudo npm install --global npm
   ```
   Note: If developing on Windows, run the following commands from a shell running as Administrator instead: 
   ```cmd
   npm install --global --production npm-windows-upgrade
   npm-windows-upgrade --npm-version latest
   ```
4. Set up your global git configuration by running the following commands:
   ```bash
   git config --global user.name "<your real name>"
   git config --global user.email "<your-oracle-email-address>"
   git config --global core.ignoreCase false
   ```
   **This last command is critical if you are developing on either Windows or MacOS.  Yes, the MacOS file system
   is, by default, case-insensitive!**

5. Clone the git repository on GitHub at [https://github.com/oracle/weblogic-toolkit-ui](https://github.com/oracle/weblogic-toolkit-ui).
6. Open a command-line in the `wktui` directory and run `npm install` to download and install the JavaScript dependencies required by the project.
7. Open a command-line in the `wktui/electron` directory and run `npm run install-tools`.
8. Open a command-line in the `wktui/webui` directory and run `npm start`.
9. Once the server from the previous step is fully running, open a command-line in the `wktui/electron` directory and run `npm start`.

## Building a Windows or MacOS installer
0. Set up your development environment and verify that the application is working properly from it.
1. Open a command-line in the `wktui/electron` directory and run `npm run build`.
2. Find the executable and installer(s) in the `wktui/dist` directory.

## Building a Linux installer
0. Set up your development environment and verify that the application is working properly from it.
1. Open a command-line in the `wktui/webui` directory and run `npm run build:release`.
2. From the command-line in the `wktui/scripts` directory, run `./devBuildLinuxInstallers.sh`.
3. Find the executable and installer(s) in the `wktui/dist` directory.
