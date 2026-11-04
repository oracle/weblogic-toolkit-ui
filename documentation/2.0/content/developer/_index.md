---
title: "Developer Guide"
weight: 4
pre: "<b> </b>"
---

The WebLogic Kubernetes Toolkit UI is a desktop application designed to help WebLogic users move their applications to run in a Kubernetes environment.

### Setting up your development environment
1. Download and install the latest LTS version of `node.js` from [https://nodejs.org/en/download/](https://nodejs.org/en/download/).
2. If you rely on a proxy server to reach the Internet, set these five environment variables to configure the proxy correctly:
   ```
   ELECTRON_GET_USE_PROXY=true
   GLOBAL_AGENT_HTTPS_PROXY=<proxy-url>
   WKTUI_DEV_PROXY=<proxy-url>
   HTTPS_PROXY=<proxy-url>
   NO_PROXY=<list-of-no-proxy-hosts>
   ```
3. Open a command line and run the following command to update the version of `npm` to the latest:
   ```bash
   sudo npm install --global npm
   ```
4. Set up your global git configuration by running the following commands:
   ```bash
   git config --global user.name "<your real name>"
   git config --global user.email "<your-oracle-email-address>"
   git config --global core.ignoreCase false
   ```
   **This last command is critical if you are developing on either Windows or macOS.  Yes, the macOS file system
   is, by default, case-insensitive!**

5. Clone the git repository on GitHub at [https://github.com/oracle/weblogic-toolkit-ui](https://github.com/oracle/weblogic-toolkit-ui).
6. Open a command line in the `weblogic-toolkit-ui` directory and run `npm install` to download and install the
   JavaScript dependencies required by the project.
7. Open a command line in the `weblogic-toolkit-ui/electron` directory and run `npm run install-tools`.
8. Open a command line in the `weblogic-toolkit-ui/webui` directory and run `npm start`.
9. After the server from the previous step is fully running, open a command line in the `weblogic-toolkit-ui/electron` directory and run `npm start`.

### Authenticating tool downloads

Set the optional `WKTUI_GITHUB_TOKEN` environment variable to a GitHub personal access token before running
`npm run install-tools` or `npm run build` to authenticate WDT and WIT downloads. Without it, developer
installations use unauthenticated GitHub requests. The application's **Help > Update WKT Tools** command
continues to use the GitHub API Key saved in Preferences.

For Jenkins, set `github_token_creds` in the Jenkinsfile to the ID of a **Secret text** credential accessible to the build job.
The pipeline binds it to `WKTUI_GITHUB_TOKEN` only during tool installation, including the installation before
packaging on Linux, macOS, and Windows. The token is not written to application preferences or packaged files.

### Updating Oracle JET

Use the [Oracle JET migration guide](https://docs.oracle.com/en/middleware/developer-tools/jet/21/develop/oracle-jet-app-migration-current-release.html)
and the target release's JavaScript MVVM `navdrawer` template as references. Create the reference application
from a temporary directory outside this checkout. Compare its package, configuration, library mapping,
bootstrap, and hook files, then incorporate the required changes into the existing WKTUI files. Preserve
the Electron locale initialization, custom library mappings, application styling, and release-build hook.

Keep `oraclejafconfig.json` aligned with the target JET release and run `npm run jet-audit` from `webui/`.
Compare audit findings with the previous release; existing findings do not establish an upgrade regression.
Run the unit tests and lint, build both development and release assets, and verify the running Electron UI.

Keep build and audit tools in `webui/package.json`'s `devDependencies`. The CLI supplies its matching
`oraclejet-tooling` dependency. Installer web assets are selected by `webui/src/js/path_mapping.json`;
release mappings exclude development source maps, type declarations, WebDriver adapters, and Preact
debugging tools. The release hook replaces the complete `electron/app/web` tree so obsolete libraries
cannot survive from an earlier build.

### Building a Windows or macOS installer
0. Set up your development environment and verify that the application is working properly from it.
1. Open a command line in the `weblogic-toolkit-ui/electron` directory and run `npm run build`.
2. Find the executable and installer(s) in the `weblogic-toolkit-ui/dist` directory.

### Building a Linux installer
0. Set up your development environment and verify that the application is working properly from it.
1. Open a command line in the `weblogic-toolkit-ui/webui` directory and run `npm run build:release`.
2. From the command line in the `weblogic-toolkit-ui/scripts` directory, run `./devBuildLinuxInstallers.sh`.
3. Find the executable and installer(s) in the `weblogic-toolkit-ui/dist` directory.
