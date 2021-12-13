/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['models/wkt-project', 'utils/k8s-helper'],
  function(project, k8sHelper) {
    const operatorHelmChartUrl = 'https://oracle.github.io/weblogic-kubernetes-operator/charts/';
    const operatorRepoName = 'weblogic-operator';
    const operatorChartName = 'weblogic-operator/weblogic-operator';

    const voyagerRepoName = 'ingress-appscode';
    const voyagerChartName = 'ingress-appscode/voyager';
    const voyagerChartUrl = 'https://charts.appscode.com/stable';

    const nginxRepoName = 'ingress-nginx';
    const nginxChartName = 'ingress-nginx/ingress-nginx';
    const nginxChartUrl = 'https://kubernetes.github.io/ingress-nginx';

    const traefikRepoName = 'ingress-traefik';
    const traefikChartName = 'ingress-traefik/traefik';
    const traefikChartUrl = 'https://helm.traefik.io/traefik';

    class HelmHelper {
      getHelmOptions() {
        const options = {};
        if (project.kubectl.kubeConfig.value) {
          options.kubeConfig = project.kubectl.kubeConfig.value;
        }
        if (project.kubectl.kubeConfigContextToUse.value) {
          options.kubeContext = project.kubectl.kubeConfigContextToUse.value;
        }
        const extraPathDirectories = project.kubectl.extraPathDirectories.value;
        if (extraPathDirectories && extraPathDirectories.length > 0) {
          options.extraPathDirectories = k8sHelper.getExtraPathDirectoriesArray(extraPathDirectories);
        }
        return options;
      }

      getOperatorHelmChartData() {
        return {
          repoName: operatorRepoName,
          chartName: operatorChartName,
          chartUrl: operatorHelmChartUrl
        };
      }

      getIngressHelmChartData(ingressControllerType) {
        let result;
        switch (ingressControllerType) {
          case 'traefik':
            result = {
              repoName: traefikRepoName,
              chartName: traefikChartName,
              chartUrl: traefikChartUrl
            };
            break;

          case 'nginx':
            result = {
              repoName: nginxRepoName,
              chartName: nginxChartName,
              chartUrl: nginxChartUrl
            };
            break;

          case 'voyager':
            result = {
              repoName: voyagerRepoName,
              chartName: voyagerChartName,
              chartUrl: voyagerChartUrl
            };
            break;
        }
        return result;
      }
    }

    return new HelmHelper();
  }
);
