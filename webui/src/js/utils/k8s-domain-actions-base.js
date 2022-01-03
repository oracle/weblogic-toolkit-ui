/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['utils/wkt-actions-base', 'models/wkt-project', 'models/wkt-console', 'utils/i18n',
  'utils/project-io', 'utils/dialog-helper', 'utils/k8s-domain-resource-generator', 'utils/k8s-domain-configmap-generator',
  'utils/validation-helper', 'utils/helm-helper', 'utils/wkt-logger'],
function (WktActionsBase, project, wktConsole, i18n, projectIo, dialogHelper) {
  class K8sDomainActionsBase extends WktActionsBase {
    constructor() {
      super();
    }

    async validateDomainExists(kubectlExe, kubectlOptions, errTitle, errPrefix) {
      try {
        const validationResults = await window.api.ipc.invoke('validate-wko-domain-exist', kubectlExe,
          kubectlOptions, this.project.k8sDomain.uid.value, this.project.k8sDomain.kubernetesNamespace.value);
        if (!validationResults.isSuccess) {
          const errMessage = i18n.t(`${errPrefix}-validate-domain-failed-error-message`, {
            domain: this.project.k8sDomain.uid.value,
            error: validationResults.reason
          });
          dialogHelper.closeBusyDialog();
          await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
          return Promise.resolve(false);
        } else if (!validationResults.isValid) {
          const errMessage = i18n.t(`${errPrefix}-domain-not-exist-error-message`,
            { domain: this.project.k8sDomain.uid.value });
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

  return K8sDomainActionsBase;
});