/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
pipeline {
    agent { label 'ol8' }
    environment {
        WKTUI_PROXY = "${env.ORACLE_HTTP_PROXY}"
        ELECTRON_GET_USE_PROXY = "true"
        GLOBAL_AGENT_HTTPS_PROXY = "${WKTUI_PROXY}"
        WKTUI_DEV_PROXY = "${WKTUI_PROXY}"
        WKTUI_BUILD_EMAIL = sh(returnStdout: true, script: "echo ${env.WKTUI_BUILD_NOTIFY_EMAIL} | sed -e 's/^[[:space:]]*//'")
        WKTUI_PROXY_HOST = "${env.ORACLE_HTTP_PROXY_HOST}"
        WKTUI_PROXY_PORT = "${env.ORACLE_HTTP_PROXY_PORT}"

        npm_registry = "${env.ARTIFACTORY_NPM_REPO}"
        npm_noproxy = "${env.ORACLE_NO_PROXY}"
        node_version = "16.15.1"

        project_name = "$JOB_NAME"
        version_prefix = sh(returnStdout: true, script: 'cat electron/package.json | grep version | awk \'match($0, /[0-9]+.[0-9]+.[0-9]+/) { print substr( $0, RSTART, RLENGTH )}\'').trim()
        version_number = VersionNumber([versionNumberString: '-${BUILD_YEAR}${BUILD_MONTH,XX}${BUILD_DAY,XX}${BUILDS_TODAY_Z,XX}', versionPrefix: "${version_prefix}"])
        github_url = "${env.GIT_URL}"
        github_creds = "fa369a2b-8c50-43ea-8956-71764cbcbe3d"

        downstream_job_name = "wktui-sign"
        TAG_NAME = sh(returnStdout: true, script: '/usr/bin/git describe --abbrev=0 --tags').trim()
        is_release = "true"

        sonarscanner_version = '4.7.0.2747'
        sonarscanner_zip_file = "sonar-scanner-cli-${sonarscanner_version}.zip"
        sonarscanner_download_url = "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/${sonarscanner_zip_file}"

        sonar_org = 'oracle'
        sonar_project_key = "${sonar_org}_weblogic-toolkit-ui"
    }
    stages {
        stage('Compute file version number') {
            when {
                not {
                    tag "v${version_prefix}"
                }
            }
            steps {
                script {
                    version_number = version_number.replaceFirst(version_prefix, version_prefix + '-SNAPSHOT')
                    is_release = "false"
                }
                echo "file version number = ${version_number}"
            }
        }
        stage('Parallel Builds') {
            failFast true
            parallel {
                stage('Linux Build') {
                    agent { label 'ol8' }
                    environment {
                        linux_node_dir_name = "node-v${node_version}-linux-x64"
                        linux_node_installer = "${linux_node_dir_name}.tar.gz"
                        linux_node_url = "https://nodejs.org/dist/v${node_version}/${linux_node_installer}"
                        linux_node_dir = "${WORKSPACE}/${linux_node_dir_name}"
                        linux_node_exe = "${linux_node_dir}/bin/node"
                        linux_npm_modules_dir = "${linux_node_dir}/lib"
                        linux_npm_exe = "${linux_node_dir}/bin/npm"

                        sonarscanner_install_dir = "${WORKSPACE}/sonar-scanner-${sonarscanner_version}"
                        sonarscanner_exe = "${sonarscanner_install_dir}/bin/sonar-scanner"
                    }
                    stages {
                        stage('Linux Echo Environment') {
                            steps {
                                sh 'env|sort'
                                sh 'which rpmbuild'
                                echo "file version = ${version_number}"
                                echo "is_release = ${is_release}"
                                sh 'yum list installed'
                            }
                        }
                        stage('Linux Checkout') {
                            steps {
                                checkout([$class: 'GitSCM', branches: [[name: "${GIT_COMMIT}"]],
                                          doGenerateSubmoduleConfigurations: false,
                                          extensions: [], submoduleCfg: [],
                                          userRemoteConfigs: [[credentialsId: "${github_creds}", url: "${github_url}"]]])
                                sh 'echo ${version_number} > ${WORKSPACE}/WKTUI_VERSION.txt'
                            }
                        }
                        stage('Linux Node.js Installation') {
                            steps {
                                sh 'curl -x ${WKTUI_PROXY} ${linux_node_url} --output /tmp/${linux_node_installer}'
                                sh 'tar xzf /tmp/${linux_node_installer}'
                            }
                        }
                        stage('Linux Node.js Configuration') {
                            steps {
                                echo 'Removing any existing .npm cache directory'
                                sh 'rm -rf ~/.npm ${WORKSPACE}/.npm'
                                echo 'Removing all existing .npmrc files'
                                sh 'rm -f ~/.npmrc ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc ${WORKSPACE}/electron/.npmrc'
                                echo 'Creating .npmrc configuration file'
                                sh 'echo registry=${npm_registry} > ${WORKSPACE}/.npmrc'
                                sh 'echo noproxy=${npm_noproxy} >> ${WORKSPACE}/.npmrc'
                                sh 'echo cache=${WORKSPACE}/.npm  >> ${WORKSPACE}/.npmrc'
                                sh 'mkdir ${WORKSPACE}/.npm'
                                echo 'New .npmrc file contents'
                                sh 'cat ${WORKSPACE}/.npmrc'
                                echo 'Copying .npmrc file to project subdirectories'
                                sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc'
                                sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/electron/.npmrc'
                            }
                        }
                        stage('Linux Update NPM') {
                            steps {
                                sh 'cp -f ${WORKSPACE}/.npmrc ${linux_node_dir}/lib/.npmrc'
                                sh 'cd ${linux_node_dir}/lib; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} install npm; cd ${WORKSPACE}'
                                sh 'rm -f ${linux_node_dir}/lib/.npmrc'
                                sh 'PATH="${linux_node_dir}/bin:$PATH" ${linux_node_exe} --version'
                                sh 'PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} --version'
                            }
                        }
                        stage('Linux Install Project Dependencies') {
                            steps {
                                sh 'cat ${WORKSPACE}/webui/.npmrc'
                                sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} install; cd ${WORKSPACE}'
                                sh 'cat ${WORKSPACE}/electron/.npmrc'
                                sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH"  HTTPS_PROXY=${ORACLE_HTTP_PROXY} ${linux_npm_exe} install; cd ${WORKSPACE}'
                            }
                        }
                        stage('Linux Install Tools Dependencies') {
                            steps {
                                sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run install-tools; cd ${WORKSPACE}'
                            }
                        }
                        stage('Install SonarScanner') {
                            steps {
                                sh "curl -x ${WKTUI_PROXY} ${sonarscanner_download_url} --output ${WORKSPACE}/${sonarscanner_zip_file}"
                                sh "unzip ${WORKSPACE}/${sonarscanner_zip_file}"
                                sh "rm -f ${WORKSPACE}/${sonarscanner_zip_file}"
                            }
                        }
                        stage('Linux Run Unit Tests with Coverage') {
                            steps {
                                sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run coverage; cd ${WORKSPACE}'
                                sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run coverage; cd ${WORKSPACE}'
                            }
                        }
                        stage('Run Sonar Analysis') {
                            tools {
                                jdk "JDK 11.0.9"
                            }
                            environment {
                                sonarscanner_config_file = "${sonarscanner_install_dir}/conf/sonar-scanner.properties"
                                electron_coverage = "${WORKSPACE}/electron/coverage/lcov.info"
                                webui_coverage = "${WORKSPACE}/webui/coverage/lcov.info"
                                electron_sources = "${WORKSPACE}/electron"
                                webui_sources = "${WORKSPACE}/webui"
                                wktui_sources = "${electron_sources},${webui_sources}"
                                lcov_report_paths = "${electron_coverage},${webui_coverage}"
                            }
                            steps {
                                echo "JAVA_HOME = ${JAVA_HOME}"
                                sh "which java"
                                sh "java -version"

                                withSonarQubeEnv('SonarCloud') {
                                    sh """
                                        echo "sonar.host.url=${SONAR_HOST_URL}"                       >> ${sonarscanner_config_file}
                                        echo "sonar.sourceEncoding=UTF-8"                             >> ${sonarscanner_config_file}
                                        echo "sonar.organization=${sonar_org}"                        >> ${sonarscanner_config_file}
                                        echo "sonar.projectKey=${sonar_project_key}"                  >> ${sonarscanner_config_file}
                                        echo "sonar.projectVersion=${version_prefix}"                 >> ${sonarscanner_config_file}
                                        echo "sonar.javascript.lcov.reportPaths=${lcov_report_paths}" >> ${sonarscanner_config_file}
                                        echo "sonar.c.file.suffixes=-"                                >> ${sonarscanner_config_file}
                                        echo "sonar.cpp.file.suffixes=-"                              >> ${sonarscanner_config_file}
                                        echo "sonar.objc.file.suffixes=-"                             >> ${sonarscanner_config_file}
                                        echo "sonar.sources=${wktui_sources}"                         >> ${sonarscanner_config_file}
                                        cat "${sonarscanner_config_file}"

                                        PATH="${linux_node_dir}/bin:${PATH}"; export PATH
                                        SONAR_SCANNER_OPTS="-server -Dhttps.proxyHost=${WKTUI_PROXY_HOST} -Dhttps.proxyPort=${WKTUI_PROXY_PORT} -Dsonar.login=${SONAR_AUTH_TOKEN}"
                                        export SONAR_SCANNER_OPTS
                                        ${sonarscanner_exe}
                                    """
                                }
                            }
                        }
                        stage('Linux Run eslint') {
                            // No need to run this on other platforms since the results will be the same...
                            steps {
                                sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run eslint; cd ${WORKSPACE}'
                                sh 'cd ${WORKSPACE}/webui; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run eslint; cd ${WORKSPACE}'
                            }
                        }
                        stage('Linux Build Installers') {
                            steps {
                                sh 'cd ${WORKSPACE}/electron; PATH="${linux_node_dir}/bin:$PATH" ${linux_npm_exe} run build; cd ${WORKSPACE}'
                                archiveArtifacts "dist/wktui*.*"
                                archiveArtifacts "dist/*.AppImage"
                                archiveArtifacts "dist/latest-linux.yml"
                            }
                        }
                    }
                }
                stage('MacOS Build') {
                    agent { label('wls-mini1 || wls-mini2') }
                    environment {
                        mac_node_dir_name = "node-v${node_version}-darwin-x64"
                        mac_node_installer = "node-v${node_version}-darwin-x64.tar.gz"
                        mac_node_url = "https://nodejs.org/dist/v${node_version}/${mac_node_installer}"
                        mac_node_dir = "${WORKSPACE}/${mac_node_dir_name}"
                        mac_node_exe = "${mac_node_dir}/bin/node"
                        mac_npm_modules_dir = "${mac_node_dir}/lib"
                        mac_npm_exe = "${mac_node_dir}/bin/npm"
                    }
                    stages {
                        stage('MacOS Echo Environment') {
                            steps {
                                sh 'env|sort'
                                echo "file version = ${version_number}"
                                echo "is_release = ${is_release}"
                                sh "uname -a"
                            }
                        }
                        stage('MacOS Checkout') {
                            steps {
                                checkout([$class: 'GitSCM', branches: [[name: "${GIT_COMMIT}"]],
                                          doGenerateSubmoduleConfigurations: false,
                                          extensions: [], submoduleCfg: [],
                                          userRemoteConfigs: [[credentialsId: "${github_creds}", url: "${github_url}"]]])
                                sh 'echo ${version_number} > ${WORKSPACE}/WKTUI_VERSION.txt'
                            }
                        }
                        stage('MacOS Node.js Installation') {
                            steps {
                                sh 'curl -x ${WKTUI_PROXY} ${mac_node_url} --output /tmp/${mac_node_installer}'
                                sh 'tar zxf /tmp/${mac_node_installer}'
                            }
                        }
                        stage('MacOS Node.js Configuration') {
                            steps {
                                echo 'Removing any existing .npm cache directory'
                                sh 'rm -rf ~/.npm ${WORKSPACE}/.npm'
                                echo 'Removing all existing .npmrc files'
                                sh 'rm -f ~/.npmrc ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc ${WORKSPACE}/electron/.npmrc'
                                echo 'Creating .npmrc configuration file'
                                sh 'echo registry=${npm_registry} > ${WORKSPACE}/.npmrc'
                                sh 'echo noproxy=${npm_noproxy} >> ${WORKSPACE}/.npmrc'
                                sh 'echo cache=${WORKSPACE}/.npm >> ${WORKSPACE}/.npmrc'
                                sh 'mkdir ${WORKSPACE}/.npm'
                                echo 'New .npmrc file contents'
                                sh 'cat ${WORKSPACE}/.npmrc'
                                echo 'Copying .npmrc file to project subdirectories'
                                sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/webui/.npmrc'
                                sh 'cp ${WORKSPACE}/.npmrc ${WORKSPACE}/electron/.npmrc'
                            }
                        }
                        stage('MacOS Update NPM') {
                            steps {
                                sh 'cp -f ${WORKSPACE}/.npmrc ${mac_node_dir}/lib/.npmrc'
                                sh 'cd ${mac_node_dir}/lib; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} install npm; cd ${WORKSPACE}'
                                sh 'rm -f ${mac_node_dir}/lib/.npmrc'
                                sh 'PATH="${mac_node_dir}/bin:$PATH" ${mac_node_exe} --version'
                                sh 'PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} --version'
                            }
                        }
                        stage('MacOS Install Project Dependencies') {
                            steps {
                                sh 'cat ${WORKSPACE}/webui/.npmrc'
                                sh 'cd ${WORKSPACE}/webui; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} install; cd ${WORKSPACE}'
                                sh 'cat ${WORKSPACE}/electron/.npmrc'
                                sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH" HTTPS_PROXY=${ORACLE_HTTP_PROXY} ${mac_npm_exe} install; cd ${WORKSPACE}'
                            }
                        }
                        stage('MacOS Install Tools Dependencies') {
                            steps {
                                sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} run install-tools; cd ${WORKSPACE}'
                            }
                        }
                        stage('MacOS Run Unit Tests') {
                            steps {
                                // On MacOS, the keychain needs to be unlocked when the tests are run...
                                // We have disabled the tests on the Jenkins MacOS environment so no need
                                // to do any of this keychain manipulation...
                                //
                                // sh 'security list-keychains'
                                // sh 'security create-keychain -p "" temporary'
                                // sh 'security default-keychain -s temporary'
                                // sh 'security unlock-keychain -p "" temporary'
                                // sh 'security set-keychain-settings -lut 7200 temporary'
                                sh 'cd ${WORKSPACE}/electron; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} test; cd ${WORKSPACE}'
                                sh 'cd ${WORKSPACE}/webui; PATH="${mac_node_dir}/bin:$PATH" ${mac_npm_exe} test; cd ${WORKSPACE}'
                            }
                            // post {
                            //     always {
                            //         sh 'security delete-keychain temporary'
                            //     }
                            // }
                        }
                        stage('MacOS Build Installers') {
                            steps {
                                sh '''
                                    cd "${WORKSPACE}/electron"
                                    PATH="${mac_node_dir}/bin:$PATH" HTTPS_PROXY=${WKTUI_PROXY} CSC_IDENTITY_AUTO_DISCOVERY=false ${mac_npm_exe} run build:jet
                                    PATH="${mac_node_dir}/bin:$PATH" HTTPS_PROXY=${WKTUI_PROXY} CSC_IDENTITY_AUTO_DISCOVERY=false ${mac_npm_exe} run install-tools
                                    PATH="${mac_node_dir}/bin:$PATH" HTTPS_PROXY=${WKTUI_PROXY} CSC_IDENTITY_AUTO_DISCOVERY=false ${mac_npm_exe} run build:installer -- --mac --x64 --arm64
                                    cd "${WORKSPACE}"
                                '''
                                archiveArtifacts 'dist/*.dmg'
                                archiveArtifacts 'dist/*.zip'
                                archiveArtifacts "dist/*.blockmap"
                                archiveArtifacts "dist/latest-mac.yml"
                                sh 'ditto -c -k --sequesterRsrc --keepParent "$WORKSPACE/dist/mac/WebLogic Kubernetes Toolkit UI.app" "WebLogic Kubernetes Toolkit UI.app.zip"'
                                archiveArtifacts "WebLogic Kubernetes Toolkit UI.app.zip"
                                sh 'ditto -c -k --sequesterRsrc --keepParent "$WORKSPACE/dist/mac-arm64/WebLogic Kubernetes Toolkit UI.app" "WebLogic Kubernetes Toolkit UI.arm64.app.zip"'
                                archiveArtifacts "WebLogic Kubernetes Toolkit UI.arm64.app.zip"
                            }
                        }
                    }
                }
                stage('Windows Build') {
                    agent { label 'windows'}
                    environment {
                        windows_node_dir_name = "node-v${node_version}-win-x64"
                        windows_node_installer = "node-v${node_version}-win-x64.zip"
                        windows_node_url = "https://nodejs.org/dist/v${node_version}/${windows_node_installer}"
                        windows_node_dir = "${WORKSPACE}\\${windows_node_dir_name}"
                        windows_node_exe = "${windows_node_dir}\\node"
                        windows_npm_modules_dir = "${windows_node_dir}"
                        windows_npm_exe = "${windows_node_dir}\\npm"
                        windows_git_path = "C:\\jenkins\\tools\\git\\PortableGit\\bin"
                    }
                    stages {
                        stage('Windows Echo Environment') {
                            steps {
                                bat 'set'
                                echo "file version = ${version_number}"
                                echo "is_release = ${is_release}"
                            }
                        }
                        stage('Windows Checkout') {
                            steps {
                                checkout([$class: 'GitSCM', branches: [[name: "${GIT_COMMIT}"]],
                                          doGenerateSubmoduleConfigurations: false,
                                          extensions: [], submoduleCfg: [],
                                          userRemoteConfigs: [[credentialsId: "${github_creds}", url: "${github_url}"]]])
                                bat 'echo %version_number% > "%WORKSPACE%/WKTUI_VERSION.txt"'
                            }
                        }
                        stage('Windows Node.js Installation') {
                            steps {
                                powershell '''
                                    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls -bor [Net.SecurityProtocolType]::Tls11 -bor [Net.SecurityProtocolType]::Tls12;
                                    $ProgressPreference = "SilentlyContinue";
                                    Invoke-WebRequest -Proxy "$env:WKTUI_PROXY" -Uri "$env:windows_node_url" -OutFile "$env:TEMP\\$env:windows_node_installer";
                                    $ProgressPreference = "Continue"
                                  '''
                                bat 'unzip -q "%TEMP%\\%windows_node_installer%"'
                            }
                        }
                        stage('Windows Node.js Configuration') {
                            steps {
                                echo 'Removing any existing npm-cache directory'
                                powershell 'Remove-Item "$env:APPDATA\\npm-cache" -Force  -Recurse -ErrorAction SilentlyContinue'
                                powershell 'Remove-Item "$env:WORKSPACE\\npm-cache" -Force  -Recurse -ErrorAction SilentlyContinue'
                                echo 'Removing all existing .npmrc files'
                                powershell 'Remove-Item -Force "$env:USERPROFILE\\.npmrc", "$env:WORKSPACE\\.npmrc", "$env:WORKSPACE\\webui\\.npmrc", "$env:WORKSPACE\\electron\\.npmrc" -ErrorAction SilentlyContinue'
                                echo 'Creating .npmrc configuration file'
                                bat 'echo registry=%npm_registry% > "%WORKSPACE%\\.npmrc"'
                                bat 'echo noproxy=%npm_noproxy% >> "%WORKSPACE%\\.npmrc"'
                                bat 'echo cache=%WORKSPACE%\\npm-cache >> "%WORKSPACE%\\.npmrc"'
                                bat 'mkdir "%WORKSPACE%\\npm-cache"'
                                echo 'New .npmrc file contents'
                                bat 'type "%WORKSPACE%\\.npmrc"'
                                echo 'Copying .npmrc file to project subdirectories'
                                bat 'copy /Y "%WORKSPACE%\\.npmrc" "%WORKSPACE%\\webui\\.npmrc"'
                                bat 'copy /Y "%WORKSPACE%\\.npmrc" "%WORKSPACE%\\electron\\.npmrc"'
                            }
                        }
                        stage('Windows Update NPM') {
                            steps {
                                bat 'copy /Y "%WORKSPACE%\\.npmrc" "%windows_node_dir%\\.npmrc"'
                                bat 'cd "%windows_node_dir%" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" install npm@latest & cd "%WORKSPACE%"'
                                bat 'del /F /Q "%windows_node_dir%\\.npmrc"'
                            }
                        }
                        stage('Windows Install Project Dependencies') {
                            steps {
                                bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & set HTTPS_PROXY=%ORACLE_HTTP_PROXY% & "%windows_npm_exe%" install & cd "%WORKSPACE%"'
                                bat 'cd "%WORKSPACE%\\webui" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" install & cd "%WORKSPACE%"'
                            }
                        }
                        stage('Windows Install Tools Dependencies') {
                            steps {
                                bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" run install-tools & cd "%WORKSPACE%"'
                            }
                        }
                        stage('Windows Run Unit Tests') {
                            steps {
                                bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" test & cd "%WORKSPACE%"'
                                bat 'cd "%WORKSPACE%\\webui" & set "PATH=%windows_node_dir%;%PATH%" & "%windows_npm_exe%" test & cd "%WORKSPACE%"'
                            }
                        }
                        stage('Windows Build Installers') {
                            steps {
                                bat 'cd "%WORKSPACE%\\electron" & set "PATH=%windows_node_dir%;%PATH%" & set "HTTPS_PROXY=%WKTUI_PROXY%" & "%windows_npm_exe%" run build & cd "%WORKSPACE%"'
                                archiveArtifacts 'dist/*.exe'
                                archiveArtifacts "dist/*.blockmap"
                                archiveArtifacts "dist/latest.yml"
                            }
                        }
                    }
                }
            }
        }
        stage('Call Downstream Job') {
            steps {
                build job: "${downstream_job_name}", propagate: false, parameters: [
                    string(name: "wktui_git_commit", value: "${GIT_COMMIT}"),
                    string(name: "parent_job_name", value: "${JOB_NAME}"),
                    string(name: "parent_release_version", value: "${version_prefix}"),
                    string(name: "parent_build_version", value: "${version_number}"),
                    string(name: "parent_job_number", value: "${BUILD_NUMBER}"),
                    string(name: "is_release", value: "${is_release}"),
                    string(name: "node_version", value: "${node_version}")
                ]
            }
        }
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
