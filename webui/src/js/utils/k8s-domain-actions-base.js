/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
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

    // create a data structure with readable details about domain status.
    // wkoDomainStatus is the domainStatus value from the k8s-get-wko-domain-status IPC result.
    buildDomainStatus(wkoDomainStatus, operatorMajorVersion) {
      const status = wkoDomainStatus.status;
      let result = {isSuccess: true, domainOverallStatus: 'Unknown'};

      if (typeof status !== 'undefined' && 'conditions' in status && status['conditions'].length > 0) {
        const conditions = status['conditions'];
        // default status
        result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-unknown');
        conditions.sort((a, b) => {
          if (a.lastTransitionTime < b.lastTransitionTime) {
            return 1;
          }
          if (a.lastTransitionTime > b.lastTransitionTime) {
            return -1;
          }
          return 0;
        });

        if (operatorMajorVersion < 4) {
          const hasErrors = this.hasErrorConditions(conditions);
          const latestCondition = conditions[0];

          if (hasErrors.error) {
            //  There seems to be a problem in the operator where the latest condition is progressing but
            // there is an error previously but
            result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-failed',
              {reason: hasErrors.reason});
          } else if (latestCondition.type === 'Failed') {
            result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-failed',
              {reason: latestCondition.reason});
          } else if (latestCondition.type === 'Progressing') {
            // Progressing maybe the domain is coming up, maybe the introspector is running
            result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-progressing',
              {reason: latestCondition.reason});
          } else if (latestCondition.type === 'Available') {
            result['domainOverallStatus'] = 'Progressing';
            if (status['clusters'].length > 0) {
              const clusters = status['clusters'];
              let ready = true;
              clusters.forEach((cluster) => {
                if (Number(cluster['replicasGoal']) !== Number(cluster['readyReplicas'])) {
                  ready = false;
                }
              });

              if (ready) {
                result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-complete');
              } else {
                result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-available',
                  {reason: latestCondition.reason});
              }
            } else {
              // remain in progressing
            }
          }
        } else {
          ///
          const hasErrors = this.hasErrorConditions(conditions);
          const completeCondition = this.getCompletedCondition(conditions);
          const availableCondition = this.getAvailableCondition(conditions);
          const latestCondition = conditions[0];

          if (hasErrors.error) {
            result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-failed',
              {reason: hasErrors.reason});
          } else if (completeCondition.status === 'True' && availableCondition.status === 'True') {
            result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-complete');
          } else {
            // Assume this is introspection progressing

            if (completeCondition.status === 'False' && !this.hasAvailableCondition(conditions)) {
              result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-progressing',
                {reason: latestCondition.reason});
            } else if (completeCondition.status === 'False' && availableCondition.status === 'False') {
              result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-available',
                {reason: latestCondition.reason});
            } else if (completeCondition.status === 'True' && availableCondition.status === 'False') {
              result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-available',
                {reason: latestCondition.reason});
            }  else {
              // should never happened?
              result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-unknown',
                {reason: latestCondition.reason});
            }
          }
        }

      } else {
        // status not defined or no conditions - error in operator or namespace is not monitored
        result['domainOverallStatus'] = i18n.t('k8s-domain-status-checker-domain-status-unknown');
      }
      return result;
    }

    hasErrorConditions(conditions) {
      for (const condition of conditions) {
        if (condition.type === 'Failed') {
          return {error: true, reason: condition.reason};
        }
      }
      return {error: false, reason: ''};
    }

    getCompletedCondition(conditions) {
      const defaultCondition = {type: 'Completed', status: 'False'};
      for (const condition of conditions) {
        if (condition.type === 'Completed') {
          return condition;
        }
      }
      return defaultCondition;
    }

    getAvailableCondition(conditions) {
      const defaultCondition = {type: 'Available', status: 'False'};
      for (const condition of conditions) {
        if (condition.type === 'Available') {
          return condition;
        }
      }
      return defaultCondition;
    }

    hasAvailableCondition(conditions) {
      for (const condition of conditions) {
        if (condition.type === 'Available') {
          return true;
        }
      }
      return false;
    }

    getSecretValue(secret, key) {
      for(const secretKey of secret.keys) {
        if(secretKey.key === key) {
          return secretKey.value;
        }
      }
      return null;
    }
  }

  return K8sDomainActionsBase;
});