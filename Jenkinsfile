/*
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 pipeline {
    agent { label 'linux' }
    environment {
         WKTUI_PROXY = "${env.ORACLE_HTTP_PROXY}"
         ELECTRON_GET_USE_PROXY = "true"
         GLOBAL_AGENT_HTTPS_PROXY = "${WKTUI_PROXY}"
         WKTUI_DEV_PROXY = "${WKTUI_PROXY}"
         WKTUI_BUILD_EMAIL = sh(returnStdout: true, script: "echo ${env.WKTUI_BUILD_NOTIFY_EMAIL} | sed -e 's/^[[:space:]]*//'")

        npm_registry = "${env.ARTIFACTORY_NPM_REPO}"
        npm_noproxy = "${env.ORACLE_NO_PROXY}"
        node_version = "14.18.0"

        project_name = "$JOB_NAME"
        version_prefix = "0.8.0"
        version_number = VersionNumber([versionNumberString: '-${BUILD_YEAR}${BUILD_MONTH,XX}${BUILD_DAY,XX}${BUILDS_TODAY_Z,XX}', versionPrefix: "${version_prefix}"])

        git_url = "https://github.com/oracle/weblogic-toolkit-ui.git"
        dockerhub_creds = "wktui-dockerhub"
        branch = sh(returnStdout: true, script: 'echo $GIT_BRANCH | sed --expression "s:origin/::"')
    }
    stages {
        stage('Parallel Builds') {
            failFast true
            parallel {
                stage('Linux Build') {
                    agent { label 'linux' }
                    environment {
                        linux_node_dir_name = "node-v${node_version}-linux-x64"
                        linux_node_installer = "${linux_node_dir_name}.tar.gz"
                        linux_node_url = "https://nodejs.org/dist/v${node_version}/${linux_node_installer}"
                        linux_node_dir = "${WORKSPACE}/${linux_node_dir_name}"
                        linux_node_exe = "${linux_node_dir}/bin/node"
                        linux_npm_modules_dir = "${linux_node_dir}/lib"
                        linux_npm_exe = "${linux_node_dir}/bin/npm"
                    }
                    stages {
                        stage('Linux Echo Environment') {
                            steps {
                                sh 'env'
                            }
                        }
                        stage('Linux Checkout') {
                            steps {
                                 sh '''
                                   export http_proxy="${env.ORACLE_HTTP_PROXY}"
                                   export https_proxy="${env.ORACLE_HTTP_PROXY}"
                                   export no_proxy="${env.ORACLE_NO_PROXY}"
                                   export HTTP_PROXY="${env.ORACLE_HTTP_PROXY}"
                                   export HTTPS_PROXY="${env.ORACLE_HTTP_PROXY}"
                                   export NO_PROXY="${env.ORACLE_NO_PROXY}"
                                 '''
                                 sh 'env'
//                                  git url: "${git_url}", branch: "${branch}"
//                                  sh 'echo ${version_number} > ${WORKSPACE}/WKTUI_VERSION.txt'
                            }
                        }
//                         stage('Linux Node.js Installation') {
//                             steps {
//                                 sh 'curl -x ${WKTUI_PROXY} ${linux_node_url} --output /tmp/${linux_node_installer}'
//                                 sh 'tar xzf /tmp/${linux_node_installer}'
//                             }
//                         }
//                         stage('Linux Node.js Configuration') {
//                             steps {
//                                 echo 'Removing any existing .npm cache directory'
//                                 sh 'rm -rf ~/.npm ${WORKSPACE}/.npm'
//                                 echo 'Removing all existing .npmrc files'
//                                 sh 'rm -f ~/.npmrc ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc ${WORKSPACE}/electron/.npmrc'
//                                 echo 'Creating .npmrc configuration file'
//                                 sh 'echo registry=${npm_registry} > ${WORKSPACE}/.npmrc'
//                                 sh 'echo noproxy=${npm_noproxy} >> ${WORKSPACE}/.npmrc'
//                                 sh 'echo cache=${WORKSPACE}/.npm  >> ${WORKSPACE}/.npmrc'
//                                 sh 'mkdir ${WORKSPACE}/.npm'
//                                 echo 'New .npmrc file contents'
//                                 sh 'cat ${WORKSPACE}/.npmrc'
//                                 echo 'Copying .npmrc file to project subdirectories'
//                                 sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc'
//                                 sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/electron/.npmrc'
//                             }
//                         }
//                         stage('Linux Update NPM') {
//                             steps {
//                                 sh 'cp -f ${WORKSPACE}/.npmrc ${linux_node_dir}/lib/.npmrc'
//                                 sh 'cd ${linux_node_dir}/lib; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} install npm; cd ${WORKSPACE}'
//                                 sh 'rm -f ${linux_node_dir}/lib/.npmrc'
//                                 sh 'PATH="${linux_node_dir}/bin:$PATH" ${linux_node_exe} --version'
//                                 sh 'PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} --version'
//                             }
//                         }
//                         stage('Linux Install Project Dependencies') {
//                             steps {
//                                 sh 'cat ${WORKSPACE}/webui/.npmrc'
//                                 sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} install; cd ${WORKSPACE}'
//                                 sh 'cat ${WORKSPACE}/electron/.npmrc'
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH"  HTTPS_PROXY=${ORACLE_HTTP_PROXY} ${linux_npm_exe} install; cd ${WORKSPACE}'
//                                 // keytar depends on libsecret-devel...
//                                 // sh 'sudo yum install -y libsecret-devel'
//                             }
//                         }
//                         stage('Linux Install Tools Dependencies') {
//                             steps {
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run install-tools; cd ${WORKSPACE}'
//                             }
//                         }
// //                         stage('Linux Run Unit Tests') {
// //                             steps {
// //                                 sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} test; cd ${WORKSPACE}'
// //                                 sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} test; cd ${WORKSPACE}'
// //                             }
// //                         }
//                         stage('Linux Run eslint') {
//                             // No need to run this on other platforms since the results will be the same...
//                             steps {
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run eslint; cd ${WORKSPACE}'
//                                 sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run eslint; cd ${WORKSPACE}'
//                             }
//                         }
//                         stage('Linux Build Installers') {
//                             steps {
//                                 sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run build:release; cd ${WORKSPACE}'
//                                 withCredentials([usernamePassword(credentialsId: "${dockerhub_creds}", usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
//                                     sh 'echo ${PASSWORD} | docker login --username ${USERNAME} --password-stdin'
//                                 }
//                                 sh '${WORKSPACE}/scripts/linuxInstallers.sh'
//                                 sh 'docker logout'
//                                 archiveArtifacts "dist/wktui*.*"
//                                 archiveArtifacts "dist/*.AppImage"
//                             }
//                         }
                    }
                }
//                 stage('MacOS Build') {
//                     agent { label 'macosx'}
//                     environment {
//                         mac_node_dir_name = "node-v${node_version}-darwin-x64"
//                         mac_node_installer = "node-v${node_version}-darwin-x64.tar.gz"
//                         mac_node_url = "https://nodejs.org/dist/v${node_version}/${mac_node_installer}"
//                         mac_node_dir = "${WORKSPACE}/${mac_node_dir_name}"
//                         mac_node_exe = "${mac_node_dir}/bin/node"
//                         mac_npm_modules_dir = "${mac_node_dir}/lib"
//                         mac_npm_exe = "${mac_node_dir}/bin/npm"
//                     }
//                     stages {
//                         stage('MacOS Echo Environment') {
//                             steps {
//                                 sh 'env'
//                             }
//                         }
//                         stage('MacOS Checkout') {
//                             steps {
//                                  git url: "${git_url}", branch: "${branch}"
//                                  sh 'echo ${version_number} > ${WORKSPACE}/WKTUI_VERSION.txt'
//                             }
//                         }
//                         stage('MacOS Node.js Installation') {
//                             steps {
//                                 sh 'curl -x ${WKTUI_PROXY} ${mac_node_url} --output /tmp/${mac_node_installer}'
//                                 sh 'tar zxf /tmp/${mac_node_installer}'
//                             }
//                         }
//                         stage('MacOS Node.js Configuration') {
//                             steps {
//                                 echo 'Removing any existing .npm cache directory'
//                                 sh 'rm -rf ~/.npm ${WORKSPACE}/.npm'
//                                 echo 'Removing all existing .npmrc files'
//                                 sh 'rm -f ~/.npmrc ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc ${WORKSPACE}/electron/.npmrc'
//                                 echo 'Creating .npmrc configuration file'
//                                 sh 'echo registry=${npm_registry} > ${WORKSPACE}/.npmrc'
//                                 sh 'echo noproxy=${npm_noproxy} >> ${WORKSPACE}/.npmrc'
//                                 sh 'echo cache=${WORKSPACE}/.npm >> ${WORKSPACE}/.npmrc'
//                                 sh 'mkdir ${WORKSPACE}/.npm'
//                                 echo 'New .npmrc file contents'
//                                 sh 'cat ${WORKSPACE}/.npmrc'
//                                 echo 'Copying .npmrc file to project subdirectories'
//                                 sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc'
//                                 sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/electron/.npmrc'
//                             }
//                         }
//                         stage('MacOS Update NPM') {
//                             steps {
//                                 sh 'cp -f ${WORKSPACE}/.npmrc ${mac_node_dir}/lib/.npmrc'
//                                 sh 'cd ${mac_node_dir}/lib; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} install npm; cd ${WORKSPACE}'
//                                 sh 'rm -f ${mac_node_dir}/lib/.npmrc'
//                                 sh 'PATH="${mac_node_dir}/bin:$PATH" ${mac_node_exe} --version'
//                                 sh 'PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} --version'
//                             }
//                         }
//                         stage('MacOS Install Project Dependencies') {
//                             steps {
//                                 sh 'cat ${WORKSPACE}/webui/.npmrc'
//                                 sh 'cd ${WORKSPACE}/webui; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} install; cd ${WORKSPACE}'
//                                 sh 'cat ${WORKSPACE}/electron/.npmrc'
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH"  HTTPS_PROXY=${ORACLE_HTTP_PROXY} ${mac_npm_exe} install; cd ${WORKSPACE}'
//                             }
//                         }
//                         stage('MacOS Install Tools Dependencies') {
//                             steps {
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} run install-tools; cd ${WORKSPACE}'
//                             }
//                         }
//                         stage('MacOS Run Unit Tests') {
//                             steps {
//                                 // On MacOS, the keychain needs to be unlocked when the tests are run...
//                                 // We have disabled the tests on the Jenkins MacOS environment so no need
//                                 // to do any of this keychain manipulation...
//                                 //
//                                 // sh 'security list-keychains'
//                                 // sh 'security create-keychain -p "" temporary'
//                                 // sh 'security default-keychain -s temporary'
//                                 // sh 'security unlock-keychain -p "" temporary'
//                                 // sh 'security set-keychain-settings -lut 7200 temporary'
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} test; cd ${WORKSPACE}'
//                                 sh 'cd ${WORKSPACE}/webui; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} test; cd ${WORKSPACE}'
//                             }
//                             // post {
//                             //     always {
//                             //         sh 'security delete-keychain temporary'
//                             //     }
//                             // }
//                         }
//                         stage('MacOS Build Installers') {
//                             steps {
//                                 sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH" HTTPS_PROXY=${WKTUI_PROXY} ${mac_npm_exe} run build'
//                                 archiveArtifacts 'dist/*.dmg'
//                                 sh 'ditto -c -k --sequesterRsrc --keepParent "$WORKSPACE/dist/mac/WebLogic Kubernetes Toolkit UI.app" "WebLogic Kubernetes Toolkit UI.app.zip"'
//                                 archiveArtifacts "WebLogic Kubernetes Toolkit UI.app.zip"
//                             }
//                         }
//                     }
//                 }
//                 stage('Windows Build') {
//                     agent { label 'windows'}
//                     environment {
//                         windows_node_dir_name = "node-v${node_version}-win-x64"
//                         windows_node_installer = "node-v${node_version}-win-x64.zip"
//                         windows_node_url = "https://nodejs.org/dist/v${node_version}/${windows_node_installer}"
//                         windows_node_dir = "${WORKSPACE}\\${windows_node_dir_name}"
//                         windows_node_exe = "${windows_node_dir}\\node"
//                         windows_npm_modules_dir = "${windows_node_dir}"
//                         windows_npm_exe = "${windows_node_dir}\\npm"
//                     }
//                     stages {
//                         stage('Windows Echo Environment') {
//                             steps {
//                                 bat 'set'
//                             }
//                         }
//                         stage('Windows Checkout') {
//                             steps {
//                                  git url: "${git_url}", branch: "${branch}"
//                                  bat 'echo %version_number% > "%WORKSPACE%/WKTUI_VERSION.txt"'
//                             }
//                         }
//                         stage('Windows Node.js Installation') {
//                             steps {
//                                 powershell '''
//                                     [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls12;
//                                     $ProgressPreference = "SilentlyContinue";
//                                     Invoke-WebRequest -Proxy "$env:WKTUI_PROXY" -Uri "$env:windows_node_url" -OutFile "$env:TEMP\\$env:windows_node_installer";
//                                     $ProgressPreference = "Continue"
//                                   '''
//                                 bat 'unzip -q "%TEMP%\\%windows_node_installer%"'
//                             }
//                         }
//                         stage('Windows Node.js Configuration') {
//                             steps {
//                                 echo 'Removing any existing npm-cache directory'
//                                 powershell 'Remove-Item "$env:APPDATA\\npm-cache" -Force  -Recurse -ErrorAction SilentlyContinue'
//                                 powershell 'Remove-Item "$env:WORKSPACE\\npm-cache" -Force  -Recurse -ErrorAction SilentlyContinue'
//                                 echo 'Removing all existing .npmrc files'
//                                 powershell 'Remove-Item -Force "$env:USERPROFILE\\.npmrc", "$env:WORKSPACE\\.npmrc", "$env:WORKSPACE\\webui\\.npmrc", "$env:WORKSPACE\\electron\\.npmrc" -ErrorAction SilentlyContinue'
//                                 echo 'Creating .npmrc configuration file'
//                                 bat 'echo registry=%npm_registry% > "%WORKSPACE%\\.npmrc"'
//                                 bat 'echo noproxy=%npm_noproxy% >> "%WORKSPACE%\\.npmrc"'
//                                 bat 'echo cache=%WORKSPACE%\\npm-cache >> "%WORKSPACE%\\.npmrc"'
//                                 bat 'mkdir "%WORKSPACE%\\npm-cache"'
//                                 echo 'New .npmrc file contents'
//                                 bat 'type "%WORKSPACE%\\.npmrc"'
//                                 echo 'Copying .npmrc file to project subdirectories'
//                                 bat 'copy /Y "%WORKSPACE%\\.npmrc" "%WORKSPACE%\\webui\\.npmrc"'
//                                 bat 'copy /Y "%WORKSPACE%\\.npmrc" "%WORKSPACE%\\electron\\.npmrc"'
//                             }
//                         }
// //
// // FIXME - NPM is unable to update itself automatically on Windows.
// // Because we are not installing it and simply unzipping it, none of
// // the documented procedures for manually updating NPM seem to work.
// //
// //                         stage('Windows Update NPM') {
// //                             steps {
// //                                 bat 'copy /Y "%WORKSPACE%\\.npmrc" "%windows_node_dir%\\.npmrc"'
// //                                 bat 'cd "%windows_node_dir%" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" install npm & cd "%WORKSPACE%"'
// //                                 bat 'del /F /Q "%windows_node_dir%\\.npmrc"'
// //                             }
// //                         }
//                         stage('Windows Install Project Dependencies') {
//                             steps {
//                                 bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & set HTTPS_PROXY=%ORACLE_HTTP_PROXY% & "%windows_npm_exe%" install & cd "%WORKSPACE%"'
//                                 bat 'cd "%WORKSPACE%\\webui" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" install & cd "%WORKSPACE%"'
//                             }
//                         }
//                         stage('Windows Install Tools Dependencies') {
//                             steps {
//                                 bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" run install-tools & cd "%WORKSPACE%"'
//                             }
//                         }
//                         stage('Windows Run Unit Tests') {
//                             steps {
//                                 bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" test & cd "%WORKSPACE%"'
//                                 bat 'cd "%WORKSPACE%\\webui" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" test & cd "%WORKSPACE%"'
//                             }
//                         }
//                         stage('Windows Build Installers') {
//                             steps {
//                                 bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & set "HTTPS_PROXY=%WKTUI_PROXY%" & "%windows_npm_exe%" run build & cd "%WORKSPACE%"'
//                                 archiveArtifacts 'dist/*.exe'
//                             }
//                         }
//                     }
//                 }
            }
            post {
                failure {
                  echo "mail to address is ${WKTUI_BUILD_EMAIL}"
                  mail to: "${WKTUI_BUILD_EMAIL}", from: 'noreply@oracle.com',
                       subject: "WKTUI: ${env.JOB_NAME} - Failed",
                       body: "Job Failed - \"${env.JOB_NAME}\" build: ${env.BUILD_NUMBER}\n\nView the log at:\n ${env.BUILD_URL}\n"
                }
            }
        }
    }
}
