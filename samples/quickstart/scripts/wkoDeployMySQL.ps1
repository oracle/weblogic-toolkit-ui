<#
   Copyright (c) 2023, Oracle and/or its affiliates.
   Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#>
$BASEDIR = $PSScriptRoot
if (-not $env:WKTUI_QS_HOME) {
    $env:WKTUI_QS_HOME = (get-item $BASEDIR).parent.FullName
}

$MYSQL_NAMESPACE = "todolist-domain-ns"
$SECRET_NAME = "ocr"
$MYSQL_SECRET_NAME = "mysql"
$MYSQL_ROOT_PASS_NAME = "rootPass"
$MYSQL_USER_NAME = "username"
$MYSQL_USER_PASS_NAME = "password"
$CONFIG_MAP_NAME = "todolist-mysql-cm"
$KUBECTL_EXE = (get-command kubectl.exe).Path
$KUBECTL_EXE = (get-command kubectl.exe).Path

if (-not $env:ORCL_SSO_USER) {
    $env:ORCL_SSO_USER = Read-Host "Please enter your Oracle SSO account username: "
    if (-not $env:ORCL_SSO_USER) {
        Write-Error "No Oracle SSO account username provided...exiting"
        exit 1
    }
}

if (-not $env:ORCL_SSO_PASS) {
    $ORCL_SSO_PASS = Read-Host "Please enter your Oracle SSO account password: " -AsSecureString
    if (-not $ORCL_SSO_PASS) {
        Write-Error "No Oracle SSO account password provided...exiting"
        exit 1
    }
    $env:ORCL_SSO_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ORCL_SSO_PASS))
}

if (-not $env:MYSQL_ROOT_PASS) {
    $MYSQL_ROOT_PASS = Read-Host "Please enter a password for the MySQL root user: " -AsSecureString
    if (-not $MYSQL_ROOT_PASS) {
        Write-Error "No MySQL root user password provided...exiting"
        exit 1
    }
    $env:MYSQL_ROOT_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_ROOT_PASS))
}

if (-not $env:MYSQL_USER) {
    $env:MYSQL_USER = Read-Host "Please enter a MySQL username: "
    if (-not $env:MYSQL_USER) {
        Write-Error "No MySQL username provided...exiting"
        exit 1
    }
}

if (-not $env:MYSQL_USER_PASS) {
    $MYSQL_USER_PASS = Read-Host "Please enter a MySQL user password: " -AsSecureString
    if (-not $MYSQL_USER_PASS) {
        Write-Error "No MySQL user password provided...exiting"
        exit 1
    }
    $env:MYSQL_USER_PASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($MYSQL_USER_PASS))
}

#
# Create namespace if it doesn't already exist
#

$proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "get namespace $MYSQL_NAMESPACE" `
    -PassThru -RedirectStandardError "NUL" -RedirectStandardOutput "$env:TEMP\stdout"
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
    Write-Output "MySQL image pull secret namespace $MYSQL_NAMESPACE does not exist...creating"
    $proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList `
        "create namespace $MYSQL_NAMESPACE" -PassThru
    Wait-Process -InputObject $proc
    if ($proc.ExitCode -ne 0) {
        Write-Error "Failed to create MySQL image pull secret namespace $MYSQL_NAMESPACE...exiting"
        exit 1
    }
}

#
# Create the ocr image pull secret if it doesn't already exist
#

$proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "get secret $SECRET_NAME -n $MYSQL_NAMESPACE" `
    -PassThru -RedirectStandardError "NUL" -RedirectStandardOutput "$env:TEMP\stdout"
Wait-Process -InputObject $proc
if ($proc.ExitCode -eq 0) {
    Write-Output "MySQL image pull secret $SECRET_NAME already exists in namespace $MYSQL_NAMESPACE...skipping"
} else {
    $argList = "create secret docker-registry $SECRET_NAME -n $MYSQL_NAMESPACE " `
        + "--docker-server=container-registry.oracle.com " `
        + "--docker-username=`"$env:ORCL_SSO_USER`" " `
        + "--docker-password=`"$env:ORCL_SSO_PASS`" " `
        + "--docker-email=`"$env:ORCL_SSO_USER`" "

    $proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "$argList" -PassThru
    Wait-Process -InputObject $proc
    if ($proc.ExitCode -ne 0) {
        Write-Error "Failed to create MySQL image pull secret $SECRET_NAME in namespace $MYSQL_NAMESPACE...exiting"
        exit 1
    }
}

#
# Create MySQL Secret to initialize MySQL user and password
#

$proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "get secret $MYSQL_SECRET_NAME -n $MYSQL_NAMESPACE" `
    -PassThru -RedirectStandardError "NUL" -RedirectStandardOutput "$env:TEMP\stdout"
Wait-Process -InputObject $proc
if ($proc.ExitCode -eq 0) {
    Write-Output "MySQL secret $MYSQL_SECRET_NAME already exists in namespace $MYSQL_NAMESPACE...skipping"
} else {
    $argList = "create secret generic $MYSQL_SECRET_NAME -n $MYSQL_NAMESPACE " `
        + "--from-literal=$MYSQL_ROOT_PASS_NAME=$env:MYSQL_ROOT_PASS " `
        + "--from-literal=$MYSQL_USER_NAME=$env:MYSQL_USER " `
        + "--from-literal=$MYSQL_USER_PASS_NAME=$env:MYSQL_USER_PASS"

    $proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "$argList" -PassThru
    Wait-Process -InputObject $proc
    if ($proc.ExitCode -ne 0) {
        Write-Error "Failed to create MySQL secret $MYSQL_SECRET_NAME in namespace $MYSQL_NAMESPACE...exiting"
        exit 1
    }
}

#
# Create the MySQL config map that holds the initialization SQL script if it does not already exist
#

$INIT_SCRIPT_DIR = Join-Path -Path "$env:WKTUI_QS_HOME" -ChildPath "\sql\"
$proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "get cm $CONFIG_MAP_NAME -n $MYSQL_NAMESPACE" `
    -PassThru -RedirectStandardError "NUL" -RedirectStandardOutput "$env:TEMP\stdout"
Wait-Process -InputObject $proc
if ($proc.ExitCode -eq 0) {
    Write-Output "MySQL config map $CONFIG_MAP_NAME already exists in namespace $MYSQL_NAMESPACE...skipping"
} else {
    $argList = "create cm $CONFIG_MAP_NAME -n $MYSQL_NAMESPACE --from-file=${INIT_SCRIPT_DIR}"

    $proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "$argList" -PassThru
    Wait-Process -InputObject $proc
    if ($proc.ExitCode -ne 0) {
        Write-Error "Failed to create MySQL config map $CONFIG_MAP_NAME in namespace $MYSQL_NAMESPACE...exiting"
        exit 1
    }
}

#
# Create the MySQL deployment
#

$tmp_file = Join-Path -Path "$env:TEMP" -ChildPath "\todolist-mysql-deployment.yaml"
@"
apiVersion: apps/v1
kind: Deployment
metadata:
    name: todolist-mysql-deployment
    namespace: $MYSQL_NAMESPACE
    labels:
        app: todolist-mysql
spec:
    replicas: 1
    selector:
        matchLabels:
            app: todolist-mysql
    template:
        metadata:
            namespace: $MYSQL_NAMESPACE
            labels:
                app: todolist-mysql
        spec:
            containers:
                - name: todolist-mysql
                  image: container-registry.oracle.com/mysql/community-server:8.0.32
                  ports:
                      - containerPort: 3306
                  volumeMounts:
                      - name: init-sql
                        mountPath: /docker-entrypoint-initdb.d/
                  securityContext:
                      allowPrivilegeEscalation: false
                      runAsNonRoot: true
                      runAsUser: 27
                  env:
                      - name: MYSQL_ROOT_PASSWORD
                        valueFrom:
                          secretKeyRef:
                            name: $MYSQL_SECRET_NAME
                            key: $MYSQL_ROOT_PASS_NAME
                      - name: MYSQL_USER
                        valueFrom:
                          secretKeyRef:
                            name: $MYSQL_SECRET_NAME
                            key: $MYSQL_USER_NAME
                      - name: MYSQL_PASSWORD
                        valueFrom:
                          secretKeyRef:
                            name: $MYSQL_SECRET_NAME
                            key: $MYSQL_USER_PASS_NAME
                      - name: MYSQL_DATABASE
                        value: tododb
            volumes:
                - name: init-sql
                  configMap:
                      name: $CONFIG_MAP_NAME
            imagePullSecrets:
                - name: $SECRET_NAME
"@ > $tmp_file

$proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "apply -f $tmp_file" -PassThru
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
    Write-Error "Failed to create MySQL deployment todolist-mysql-deployment in namespace $MYSQL_NAMESPACE...exiting"
    exit 1
}

if (Test-Path "$tmp_file") {
    Remove-Item -Path "$tmp_file" -Force
}

#
# Create the MySQL service
#

$tmp_file = Join-Path -Path "$env:TEMP" -ChildPath "\todolist-mysql-service.yaml"
@"
apiVersion: v1
kind: Service
metadata:
    name: mysql
    namespace: ${MYSQL_NAMESPACE}
spec:
    selector:
        app: todolist-mysql
    ports:
        - port: 3306
"@ > $tmp_file
$proc = Start-Process -NoNewWindow -FilePath "$KUBECTL_EXE" -ArgumentList "apply -f $tmp_file" -PassThru
Wait-Process -InputObject $proc
if ($proc.ExitCode -ne 0) {
    Write-Error "Failed to create MySQL service mysql in namespace $MYSQL_NAMESPACE...exiting"
    exit 1
}

if (Test-Path "$tmp_file") {
    Remove-Item -Path "$tmp_file" -Force
}
