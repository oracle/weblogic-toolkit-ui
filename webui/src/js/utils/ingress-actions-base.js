/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'utils/dialog-helper', 'utils/i18n', 'utils/helm-helper'],
  function (WktActionsBase, dialogHelper, i18n, helmHelper) {
    class IngressActionsBase extends WktActionsBase {
      constructor() {
        super();
      }

      getIngressControllerHelmChartName(provider) {
        return helmHelper.getIngressHelmChartData(provider).chartName;
      }

      async isIngressControllerInstalled(helmExe, helmOptions, ingressControllerProvider, ingressControllerName,
        ingressControllerNamespace, errTitle, errPrefix) {
        let result = {
          isInstalled: false
        };
        try {
          const helmListResults = await window.api.ipc.invoke('helm-list-all-namespaces', helmExe, helmOptions);

          if (!helmListResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-checking-already-installed-error-message`,
              { name: ingressControllerName, namespace: ingressControllerNamespace, error: helmListResults.reason});
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }

          const helmChartList = JSON.parse(helmListResults.stdout);
          let ingressChartNamePrefix = 'ingress-nginx-';
          if (ingressControllerProvider === 'traefik') {
            ingressChartNamePrefix = 'traefik-';
          } else if (ingressControllerProvider === 'voyager') {
            ingressChartNamePrefix = 'voyager-';
          }

          for (const obj of helmChartList) {
            if (obj['chart'].startsWith(ingressChartNamePrefix) === true && obj['namespace'] === ingressControllerNamespace) {
              result.isInstalled = true;
              result.chartName = obj['chart'];
              result.namespace = obj['namespace'];
              result.installedName = obj['name'];
              result.status = obj['status'];
              break;
            }
          }
        } catch (err) {
          return Promise.reject(err);
        }
        return Promise.resolve(result);
      }

      async addIngressControllerHelmChart(helmExe, helmOptions, ingressControllerType, errTitle, errPrefix) {
        try {
          const helmChartData = helmHelper.getIngressHelmChartData(ingressControllerType);
          const ingressRepoName = helmChartData.repoName;
          const ingressRepoUrl = helmChartData.chartUrl;

          const helmResults = await window.api.ipc.invoke('helm-add-update-repo', helmExe, ingressRepoName,
            ingressRepoUrl, helmOptions);
          if (!helmResults.isSuccess) {
            const errMessage = i18n.t(`${errPrefix}-add-repo-error-message`,
              {
                repoName: ingressRepoName,
                error: helmResults.reason
              });
            dialogHelper.closeBusyDialog();
            await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
            return Promise.resolve(false);
          }

        } catch (err) {
          return Promise.reject(err);
        }
        return Promise.resolve(true);
      }
    }

    return IngressActionsBase;
  }
);
