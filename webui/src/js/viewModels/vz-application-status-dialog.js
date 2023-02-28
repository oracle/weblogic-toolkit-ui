/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'js-yaml', 'utils/i18n', 'models/wkt-project', 'utils/view-helper',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojdialog', 'ojs/ojformlayout', 'ojs/ojvalidationgroup'],
function(accUtils, ko, jsyaml, i18n, project, viewHelper) {
  function VzApplicationStatusDialogModel(args) {
    const DIALOG_SELECTOR = '#applicationStatusDialog';

    this.project = project;
    this.clusterName = args.clusterName;
    this.domainStatus = args.domainStatus;
    this.domainOverallStatus = args.domainOverallStatus;

    this.title = i18n.t('vz-application-status-title',
      { clusterName: this.clusterName, application: args.applicationName });
    this.dialogTitle = i18n.t('vz-application-status-domain-title', { domain: args.domainName });
    this.domainMessage = this.domainStatus.message;

    this.connected = () => {
      accUtils.announce('Show application status dialog loaded.', 'assertive');

      this.dialogContainer = $(DIALOG_SELECTOR)[0];

      // open the dialog when the container is ready.
      // using oj-dialog initial-visibility="show" causes vertical centering issues.
      viewHelper.componentReady(this.dialogContainer).then(() => {
        this.dialogContainer.open();
      });
    };

    this.labelMapper = (labelId) => {
      return i18n.t(`domain-design-${labelId}`);
    };

    this.anyLabelMapper = (labelId, arg) => {
      return i18n.t(labelId, arg);
    };

    this.okInput = () => {
      this.dialogContainer.close();
    };

    this.makeYamlOutput = (data) => {
      let result = '';
      if (typeof data !== 'undefined') {
        const options = { lineWidth: -1 };
        result = data.map(item => { return jsyaml.dump(item, options); }).join('\n');
      }
      return result;
    };

    this.domainConditions = '';
    this.domainClusterStatus = '';
    this.domainServerStatus = '';
    this.introspectJobFailureCount = 0;
    this.domainHasError = false;

    if ('status' in this.domainStatus && 'conditions' in this.domainStatus.status) {
      this.domainConditions = this.makeYamlOutput(this.domainStatus.status.conditions);
      this.domainClusterStatus = this.makeYamlOutput(this.domainStatus.status.clusters);
      this.domainServerStatus = this.makeYamlOutput(this.domainStatus.status.servers);
      this.domainName = this.domainStatus.spec.domainUID;
      this.introspectJobFailureCount = this.domainStatus.status.introspectJobFailureCount;
      const conditions = this.domainStatus.status.conditions;
      conditions.sort((a, b) => {
        if ( a.lastTransitionTime < b.lastTransitionTime ){
          return 1;
        }
        if ( a.lastTransitionTime > b.lastTransitionTime){
          return -1;
        }
        return 0;
      });

      for (const condition of conditions) {
        if (condition.type === 'Failed' && typeof condition.message !== 'undefined') {
          this.domainErrorMessage = condition.message;
          this.domainHasError = true;
          break;
        }
      }
    }

  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return VzApplicationStatusDialogModel;
});
