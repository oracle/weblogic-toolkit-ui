#!/usr/bin/env sh
#
# Copyright (c) 2023, Oracle and/or its affiliates.
# Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
#
BASEDIR="$( cd "$( dirname "$0" )" && pwd )"
if [ -z "${WKTUI_QS_HOME}" ]; then
  WKTUI_QS_HOME="$( cd "${BASEDIR}/.." && pwd )"; export WKTUI_QS_HOME
fi

MYSQL_NAMESPACE=todolist-domain-ns
SECRET_NAME=ocr
MYSQL_SECRET_NAME=mysql
MYSQL_ROOT_PASS_NAME=rootPass
MYSQL_USER_NAME=username
MYSQL_USER_PASS_NAME=password
CONFIG_MAP_NAME=todolist-mysql-cm

if [ -z "${ORCL_SSO_USER}" ]; then
  printf "Please enter your Oracle SSO account username: "
  read -r ORCL_SSO_USER
  if [ -z "${ORCL_SSO_USER}" ]; then
    echo "No Oracle SSO account username provided...exiting" >&2
    exit 1
  fi
fi

if [ -z "${ORCL_SSO_PASS}" ]; then
  stty -echo
  printf "Please enter your Oracle SSO account password: "
  read -r ORCL_SSO_PASS
  stty echo
  if [ -z "${ORCL_SSO_PASS}" ]; then
    echo "No Oracle SSO account password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

if [ -z "${MYSQL_ROOT_PASS}" ]; then
  stty -echo
  printf "Please enter a password for the MySQL root user: "
  read -r MYSQL_ROOT_PASS
  stty echo
  if [ -z "${MYSQL_ROOT_PASS}" ]; then
    echo "No MySQL root user password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

if [ -z "${MYSQL_USER}" ]; then
  printf "Please enter a MySQL username: "
  read -r MYSQL_USER
  if [ -z "${MYSQL_USER}" ]; then
    echo "No MySQL username provided...exiting" >&2
    exit 1
  fi
fi

if [ -z "${MYSQL_USER_PASS}" ]; then
  stty -echo
  printf "Please enter a MySQL user password: "
  read -r MYSQL_USER_PASS
  stty echo
  if [ -z "${MYSQL_USER_PASS}" ]; then
    echo "No MySQL user password provided...exiting" >&2
    exit 1
  fi
  echo ""
fi

#
# Create namespace if it doesn't already exist
#

if ! kubectl get namespace "${MYSQL_NAMESPACE}" > /dev/null 2>&1; then
  echo "MySQL image pull secret namespace ${MYSQL_NAMESPACE} does not exist...creating"
  if ! kubectl create namespace "${MYSQL_NAMESPACE}"; then
    echo "Failed to create MySQL image pull secret namespace ${MYSQL_NAMESPACE}...exiting" >&2
    exit 1
  fi
fi

#
# Create the ocr image pull secret if it doesn't already exist
#

if kubectl get secret "${SECRET_NAME}" -n "${MYSQL_NAMESPACE}" > /dev/null 2>&1; then
  echo "MySQL image pull secret ${SECRET_NAME} already exists in namespace ${MYSQL_NAMESPACE}...skipping"
elif ! kubectl create secret docker-registry "${SECRET_NAME}" -n "${MYSQL_NAMESPACE}" \
      --docker-server=container-registry.oracle.com \
      --docker-username="${ORCL_SSO_USER}" \
      --docker-password="${ORCL_SSO_PASS}" \
      --docker-email="${ORCL_SSO_USER}"; then
  echo "Failed to create MySQL image pull secret ${SECRET_NAME} in namespace ${MYSQL_NAMESPACE}...exiting" >&2
  exit 1
fi

#
# Create MySQL Secret to initialize MySQL user and password
#

if kubectl get secret "${MYSQL_SECRET_NAME}" -n "${MYSQL_NAMESPACE}" > /dev/null 2>&1; then
  echo "MySQL secret ${MYSQL_SECRET_NAME} already exists in namespace ${MYSQL_NAMESPACE}...skipping"
elif ! kubectl create secret generic "${MYSQL_SECRET_NAME}" -n "${MYSQL_NAMESPACE}" \
      --from-literal=${MYSQL_ROOT_PASS_NAME}="${MYSQL_ROOT_PASS}" \
      --from-literal=${MYSQL_USER_NAME}="${MYSQL_USER}" \
      --from-literal=${MYSQL_USER_PASS_NAME}="${MYSQL_USER_PASS}"; then
  echo "Failed to create MySQL secret ${MYSQL_SECRET_NAME} in namespace ${MYSQL_NAMESPACE}...exiting" >&2
  exit 1
fi

#
# Create the MySQL config map component
#

if ! kubectl apply -f - <<EOF; then
apiVersion: core.oam.dev/v1alpha2
kind: Component
metadata:
    name: ${CONFIG_MAP_NAME}
    namespace: ${MYSQL_NAMESPACE}
spec:
  workload:
      apiVersion: v1
      kind: ConfigMap
      metadata:
          name: ${CONFIG_MAP_NAME}
          namespace: ${MYSQL_NAMESPACE}
      data:
          init-schema.sql: |
              CREATE TABLE ToDos (taskId INT NOT NULL AUTO_INCREMENT,
                                  task VARCHAR(200) NOT NULL,
                                  completed BOOLEAN,
                                  constraint todo_pk PRIMARY KEY (taskId));
              INSERT INTO ToDos (task, completed)
              VALUES
                  ('Install WKTUI', FALSE),
                  ('Install Verrazzano', FALSE),
                  ('Move ToDo List to the the cloud', FALSE),
                  ('Celebrate', FALSE),
                  ('Clean off my desk', FALSE);
EOF
  echo "Failed to create Component ${CONFIG_MAP_NAME} in namespace ${MYSQL_NAMESPACE}...exiting" >&2
  exit 1
fi

#
# Create the MySQL deployment component
#

if ! kubectl apply -f - <<EOF; then
apiVersion: core.oam.dev/v1alpha2
kind: Component
metadata:
    name: todolist-mysql-deployment
    namespace: ${MYSQL_NAMESPACE}
spec:
    workload:
        apiVersion: apps/v1
        kind: Deployment
        metadata:
            name: todolist-mysql-deployment
            namespace: ${MYSQL_NAMESPACE}
            labels:
                app: todolist-mysql
        spec:
            replicas: 1
            selector:
                matchLabels:
                    app: todolist-mysql
            template:
                metadata:
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
                          env:
                              - name: MYSQL_ROOT_PASSWORD
                                valueFrom:
                                  secretKeyRef:
                                    name: ${MYSQL_SECRET_NAME}
                                    key: ${MYSQL_ROOT_PASS_NAME}
                              - name: MYSQL_USER
                                valueFrom:
                                  secretKeyRef:
                                    name: ${MYSQL_SECRET_NAME}
                                    key: ${MYSQL_USER_NAME}
                              - name: MYSQL_PASSWORD
                                valueFrom:
                                  secretKeyRef:
                                    name: ${MYSQL_SECRET_NAME}
                                    key: ${MYSQL_USER_PASS_NAME}
                              - name: MYSQL_DATABASE
                                value: tododb
                    volumes:
                        - name: init-sql
                          configMap:
                              name: ${CONFIG_MAP_NAME}
                    imagePullSecrets:
                        - name: ${SECRET_NAME}
EOF
  echo "Failed to create Component todolist-mysql-deployment in namespace ${MYSQL_NAMESPACE}...exiting" >&2
  exit 1
fi

#
# Create the MySQL service component
#

if ! kubectl apply -f - <<EOF; then
apiVersion: core.oam.dev/v1alpha2
kind: Component
metadata:
    name: todolist-mysql-service
    namespace: ${MYSQL_NAMESPACE}
spec:
    workload:
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
EOF
  echo "Failed to create Component todolist-mysql-service in namespace ${MYSQL_NAMESPACE}...exiting" >&2
  exit 1
fi
