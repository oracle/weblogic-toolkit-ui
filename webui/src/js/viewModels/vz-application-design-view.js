/**
 * @license
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['models/wkt-project', 'accUtils', 'utils/common-utilities', 'knockout', 'utils/i18n', 'ojs/ojbufferingdataprovider',
  'ojs/ojarraydataprovider', 'utils/dialog-helper', 'utils/validation-helper', 'utils/k8s-helper', 'utils/view-helper',
  'ojs/ojlistdataproviderview', 'ojs/ojconverter-number', 'utils/vz-get-installed-version', 'utils/wkt-logger',
  'ojs/ojmessaging', 'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout', 'ojs/ojcollapsible',
  'ojs/ojselectsingle', 'ojs/ojselectcombobox', 'ojs/ojlistview', 'ojs/ojtable', 'ojs/ojswitch', 'ojs/ojinputnumber',
  'ojs/ojradioset', 'ojs/ojaccordion'],
function (project, accUtils, utils, ko, i18n, BufferingDataProvider, ArrayDataProvider, dialogHelper,
  validationHelper, k8sHelper, viewHelper, ListDataProviderView, ojConverterNumber, verrazzanoInstallVersionChecker) {
  function VerrazzanoApplicationDesignViewModel() {

    this.connected = () => {
      accUtils.announce('Verrazzano Application Design View page loaded.', 'assertive');

      this.populateObservableSecrets();
      this.populateObservableClusters();
    };

    this.labelMapper = (labelId, payload) => {
      if (labelId.startsWith('page-design-')) {
        return i18n.t(labelId);
      }
      return i18n.t(`vz-application-design-${labelId}`, payload);
    };

    this.project = project;
    this.i18n = i18n;

    this.getInstalledVersionNumber = () => {
      verrazzanoInstallVersionChecker.startVerrazzanoInstallVersionCheck().then();
    };

    this.components = this.project.vzApplication.components;
    this.componentsDataProvider = new ArrayDataProvider(this.components.observable, { keyAttributes: 'name' });
    this.hasComponents = ko.computed(() => this.components.observable().length > 0);

    // eslint-disable-next-line no-unused-vars
    this.disableComponentDeleteButton = (index) => {
      return false;
    };

    this.deleteApplicationComponent = (index) => {
      this.project.vzApplication.components.removeItemByIndex(index);
    };

    this.integerConverter = new ojConverterNumber.IntlNumberConverter({
      style: 'decimal',
      roundingMode: 'HALF_DOWN',
      maximumFractionDigits: 0
    });

    this.getValidationObject = (flowNameKey) => {
      const validationObject = validationHelper.createValidatableObject(flowNameKey);
      const kubectlFormConfig = validationObject.getDefaultConfigObject();
      kubectlFormConfig.formName = 'kubectl-form-name';

      validationObject.addField('kubectl-exe-file-path-label',
        validationHelper.validateRequiredField(this.project.kubectl.executableFilePath.value), kubectlFormConfig);

      const vzAppFormConfig = validationObject.getDefaultConfigObject();
      vzAppFormConfig.formName = 'vz-application-design-form-name';

      validationObject.addField('vz-application-design-namespace-label',
        this.project.k8sDomain.kubernetesNamespace.validate(true), vzAppFormConfig);
      return validationObject;
    };

    this.addComponent = async () => {
      // First, determine if the required fields are set...
      const errTitle = this.labelMapper('add-component-validation-error-title');
      const validationObject = this.getValidationObject('vz-application-design-add-component-flow-nane');
      if (validationObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve();
      }

      // Next, get the list of components deployed in the namespace and filter out those already added.
      //
      const inUseComponentNames = this.components.value.map(component => component.name);
      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const namespace = this.project.k8sDomain.kubernetesNamespace.value;

      const busyDialogMessage = this.labelMapper('get-components-in-progress', { namespace });
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
      dialogHelper.openBusyDialog(busyDialogMessage, 0);
      const componentNamesResult =
        await window.api.ipc.invoke('get-verrazzano-component-names', kubectlExe, namespace, kubectlOptions);
      dialogHelper.closeBusyDialog();

      if (!componentNamesResult.isSuccess) {
        const errMessage = this.labelMapper('get-components-error-message', { error: componentNamesResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve();
      }

      const availableComponentNames = componentNamesResult.payload
        .filter(componentName => !inUseComponentNames.includes(componentName))
        .map(componentName => {
          return { value: componentName, label: componentName };
        });

      dialogHelper.promptDialog('choose-component-dialog', { availableComponentNames }).then(result => {
        // no result indicates operation was cancelled
        if (result && result.componentNames) {
          for(const componentName of result.componentNames) {
            this.project.vzApplication.components.addNewItem({
              name: componentName,
              ingressTraitEnable: false,
              manualScalerTraitEnabled: false,
              metricsTraitEnabled: false,
              loggingTraitEnabled: false,
            });
          }
          this.components.observable.sort((a, b) => (a.name > b.name) ? 1 : -1);

          // this shouldn't be needed, but duplicate entries will show in the components accordion
          // if multiple components are added at once.
          this.components.observable.sort();

          // this shouldn't be needed, but when a new component is added,
          // the accordion control doesn't enforce "single collapsible open" behavior.
          const accordion = $('#componentsList')[0];
          viewHelper.componentReady(accordion).then(() => {
            accordion.refresh();
          });
        }
      });
    };

    this.observableSecrets = ko.observableArray();
    this.observableClusters = ko.observableArray();

    this.populateObservableSecrets = () => {
      const secretsArray = this.project.vzApplication.secrets.value.map(secretName => {
        return { name: secretName };
      });
      this.observableSecrets(secretsArray);
    };

    this.populateObservableClusters = () => {
      const clustersArray = this.project.vzApplication.placementClusters.value.map(clusterName => {
        return { name: clusterName };
      });
      this.observableClusters(clustersArray);
    };

    this.mapFields = (item) => {
      const data = item.data;
      return {
        data: { label: data.name, value: data.name },
        metadata: { key: data.name }
      };
    };

    this.mapFieldsFilterCriterion = (filter) => {
      return {
        op: '$or',
        criteria: [
          { op: filter.op, attribute: 'name', value: filter.value },
        ],
      };
    };

    this.dataMapping = {
      mapFields: this.mapFields,
      mapFilterCriterion: this.mapFieldsFilterCriterion
    };

    this.secretsArrayDataProvder = new ArrayDataProvider(this.observableSecrets, { keyAttributes: 'name' });
    this.secretsDataProvider = new ListDataProviderView(this.secretsArrayDataProvder, { dataMapping: this.dataMapping });
    this.clustersArrayDataProvider = new ArrayDataProvider(this.observableClusters, { keyAttributes: 'name' });
    this.clustersDataProvider = new ListDataProviderView(this.clustersArrayDataProvider, { dataMapping: this.dataMapping });

    this.getDomainSecrets = () => {
      const defaultSecretNames = [];
      if (this.project.k8sDomain.imageRegistryPullRequireAuthentication.value && this.project.k8sDomain.imageRegistryPullSecretName.value) {
        defaultSecretNames.push(this.project.k8sDomain.imageRegistryPullSecretName.value);
      }

      if (this.project.image.useAuxImage && this.project.k8sDomain.auxImageRegistryPullRequireAuthentication.value
        && this.project.k8sDomain.auxImageRegistryPullSecretName.value) {
        defaultSecretNames.push(this.project.k8sDomain.auxImageRegistryPullSecretName.value);
      }

      if (this.project.k8sDomain.credentialsSecretName.value) {
        defaultSecretNames.push(this.project.k8sDomain.credentialsSecretName.value);
      }

      if (this.project.settings.targetDomainLocation.value === 'mii') {
        if (this.project.k8sDomain.runtimeSecretName.value) {
          defaultSecretNames.push(this.project.k8sDomain.runtimeSecretName.value);
        }

        const domainSecrets = this.project.k8sDomain.secrets.value;
        if (Array.isArray(domainSecrets) && domainSecrets.length > 0) {
          const domainSecretNames = domainSecrets.map(domainSecret => domainSecret.name);
          defaultSecretNames.push(...domainSecretNames);
        }
      }

      return defaultSecretNames;
    };

    this.chooseSecrets = async () => {
      const errTitleKey = 'vz-application-design-choose-secrets-validation-error-title';
      const errMessageKey = 'vz-application-design-get-secrets-error-message';
      const availableSecretNames = await this._getAvailableSecretNames(errTitleKey, errMessageKey);
      if (!availableSecretNames) {
        return Promise.resolve();
      }

      const selectedSecretNames =
        this.project.vzApplication.secrets.hasValue() ? this.project.vzApplication.secrets.value : this.getDomainSecrets();
      const args = { selectedSecretNames, availableSecretNames };

      dialogHelper.promptDialog('choose-secrets-dialog', args).then(result => {
        // no result indicates operation was cancelled
        if (result && result.secretNames) {
          this.project.vzApplication.secrets.value = result.secretNames;
          this.populateObservableSecrets();
        }
      });
    };

    this.chooseIngressTraitSecret = async (component) => {
      const errTitleKey = 'vz-application-design-choose-ingress-trait-secret-validation-error-title';
      const errMessageKey = 'vz-application-design-choose-ingress-trait-get-secrets-error-message';
      const availableSecretNames = await this._getAvailableSecretNames(errTitleKey, errMessageKey);
      if (!availableSecretNames) {
        return Promise.resolve();
      }

      const selectedSecretNameObservable = this.componentObservable(component, 'ingressTraitSecretName');
      const args = {
        selectedSecretName: selectedSecretNameObservable(),
        availableSecretNames,
      };
      dialogHelper.promptDialog('choose-secret-dialog', args).then(result => {
        // no result indicates operation was cancelled
        if (result && result.secretName) {
          selectedSecretNameObservable(result.secretName);
        }
      });
    };

    this.chooseMetricsTraitSecret = async (component) => {
      const errTitleKey = 'vz-application-design-choose-metrics-trait-secret-validation-error-title';
      const errMessageKey = 'vz-application-design-choose-metrics-trait-get-secrets-error-message';
      const availableSecretNames = await this._getAvailableSecretNames(errTitleKey, errMessageKey);
      if (!availableSecretNames) {
        return Promise.resolve();
      }

      const selectedSecretNameObservable = this.componentObservable(component, 'metricsTraitSecretName');
      const args = {
        selectedSecretName: selectedSecretNameObservable(),
        availableSecretNames,
      };
      dialogHelper.promptDialog('choose-secret-dialog', args).then(result => {
        // no result indicates operation was cancelled
        if (result && result.secretName) {
          selectedSecretNameObservable(result.secretName);
        }
      });
    };

    this._getAvailableSecretNames = async (errTitleKey, errMessageKey) => {
      // First, determine if the required fields are set...
      const errTitle = i18n.t(errTitleKey);
      const validationObject = this.getValidationObject('vz-application-design-choose-secrets-flow-nane');
      if (validationObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve();
      }

      // Next, get the list of secrets deployed in the namespace.
      //
      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const namespace = this.project.k8sDomain.kubernetesNamespace.value;

      const busyDialogMessage = this.labelMapper('get-secrets-in-progress', { namespace });
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar');
      dialogHelper.openBusyDialog(busyDialogMessage, 0);
      const secretNamesResult =
        await window.api.ipc.invoke('get-verrazzano-secret-names', kubectlExe, namespace, kubectlOptions);
      dialogHelper.closeBusyDialog();

      if (!secretNamesResult.isSuccess) {
        const errMessage = i18n.t(errMessageKey, { error: secretNamesResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve();
      }

      return secretNamesResult.payload.map(secretName => {
        return { name: secretName, label: secretName };
      });
    };

    this.choosePrometheusDeployment = async (component) => {
      // First, determine if the required fields are set...
      const errTitle = 'vz-application-design-choose-deployment-validation-error-title';
      const validationObject = this.getValidationObject('vz-application-design-choose-deployment-flow-nane');
      if (validationObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve();
      }

      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const kubectlContext = this.project.kubectl.kubeConfigContextToUse.value;

      let busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 0 / 2.0);
      const useContextResult =
        await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
      if (!useContextResult.isSuccess) {
        const errMessage = this.labelMapper('use-context-error-message', { error: useContextResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve();
      }

      busyDialogMessage = this.labelMapper('get-deployments-in-progress');
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 1 / 2.0);
      const deploymentNamesResult =
        await window.api.ipc.invoke('get-verrazzano-deployment-names-all-namespaces', kubectlExe, kubectlOptions);
      dialogHelper.closeBusyDialog();

      if (!deploymentNamesResult.isSuccess) {
        const errMessage = this.labelMapper('get-deployments-error-message', { error: deploymentNamesResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve();
      }

      const availableDeploymentNames = deploymentNamesResult.payload.map(deploymentName => {
        return { name: deploymentName, label: deploymentName };
      });
      const selectedDeploymentNameObservable = this.componentObservable(component, 'metricsTraitDeploymentName');
      const args = {
        selectedDeploymentName: selectedDeploymentNameObservable(),
        availableDeploymentNames,
      };
      dialogHelper.promptDialog('choose-deployment-dialog', args).then(result => {
        // no result indicates operation was cancelled
        if (result && result.deploymentName) {
          selectedDeploymentNameObservable(result.deploymentName);
        }
      });
    };

    this.chooseVerrazzanoClusters = async () => {
      // First, determine if the required fields are set...
      const errTitle = 'vz-application-design-choose-clusters-validation-error-title';
      const validationObject = this.getValidationObject('vz-application-design-choose-clusters-flow-nane');
      if (validationObject.hasValidationErrors()) {
        const validationErrorDialogConfig = validationObject.getValidationErrorDialogConfig(errTitle);
        dialogHelper.openDialog('validation-error-dialog', validationErrorDialogConfig);
        return Promise.resolve();
      }

      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const kubectlContext = this.project.kubectl.kubeConfigContextToUse.value;

      let busyDialogMessage = i18n.t('flow-kubectl-use-context-in-progress');
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 0 / 2.0);
      const useContextResult =
        await window.api.ipc.invoke('kubectl-set-current-context', kubectlExe, kubectlContext, kubectlOptions);
      if (!useContextResult.isSuccess) {
        const errMessage = this.labelMapper('use-context-error-message', { error: useContextResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve();
      }

      busyDialogMessage = this.labelMapper('get-clusters-in-progress');
      dialogHelper.updateBusyDialog(busyDialogMessage, 1 / 2.0);

      const clusterNamesResult =
        await window.api.ipc.invoke('get-verrazzano-cluster-names', kubectlExe, kubectlOptions);
      dialogHelper.closeBusyDialog();

      if (!clusterNamesResult.isSuccess) {
        const errMessage = this.labelMapper('get-clusters-error-message', { error: clusterNamesResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return Promise.resolve();
      }

      const availableClusterNames = clusterNamesResult.payload.map(clusterName => {
        return { name: clusterName };
      });
      const selectedClusterNames = this.project.vzApplication.placementClusters.value;

      dialogHelper.promptDialog('choose-clusters-dialog', { selectedClusterNames, availableClusterNames }).then(result => {
        // no result indicates operation was cancelled
        if (result && result.clusterNames) {
          this.project.vzApplication.placementClusters.value = result.clusterNames;
          this.populateObservableClusters();
        }
      });
    };

    this.getCollapsibleId = (index) => {
      return `componentCollapsible${index + 1}`;
    };

    this.componentObservables = {};
    this.componentIngressTraitRulesDataProviders = {};

    // create an observable that will read/write from the component object field
    this.componentObservable = (component, fieldName) => {
      const key = component.name + '/' + fieldName;
      let observable = this.componentObservables[key];

      if (!observable) {
        observable = fieldName === 'ingressTraitRules' ? ko.observableArray(component[fieldName]) : ko.observable(component[fieldName]);
        observable.subscribe(value => {
          // Convert empty arrays or strings to undefined so that they are not persisted in the project file.
          if ((Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.length === 0) || value === null) {
            component[fieldName] = undefined;
          } else {
            component[fieldName] = value;
          }
          this.project.vzApplication.componentChanged();
        });
        this.componentObservables[key] = observable;
      }
      return observable;
    };

    // this is dynamic to allow i18n fields to load correctly
    this.ingressTraitRulesColumnData = [
      {
        headerText: this.labelMapper('ingress-trait-rules-hosts-label'),
        'resizable': 'enabled',
        sortable: 'disable'
      },
      {
        headerText: this.labelMapper('ingress-trait-rules-first-path-label'),
        'resizable': 'enabled',
        sortable: 'disable'
      },
      {
        headerText: this.labelMapper('ingress-trait-rules-first-path-url-label'),
        resizable: 'enabled',
        sortable: 'disable',
        width: '35%'
      },
      {
        headerText: this.labelMapper('ingress-trait-rules-destination-label'),
        sortable: 'disable'
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'chooseHeaderTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
      {
        className: 'wkt-table-delete-cell',
        headerClassName: 'wkt-table-add-header',
        headerTemplate: 'headerTemplate',
        template: 'actionTemplate',
        sortable: 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
    ];

    // display in the first path column, example "/path (regex)"
    this.getFirstPathText = (rowData) => {
      let result = null;
      const paths = rowData.paths;
      if (Array.isArray(paths) && paths.length > 0) {
        result = paths[0].path;
        if(result && result.length) {
          const pathType = paths[0].pathType;
          if(pathType && pathType !== 'exact') {
            result += ` (${pathType})`;
          }
        }
      }
      return result;
    };

    // display in the destination column, example "host:port"
    this.getDestinationText = (rowData) => {
      let result = rowData.destinationHost;
      if(result) {
        const port = rowData.destinationPort;
        if(port != null) {
          result += `:${port}`;
        }
      }
      return result;
    };

    function getRuleHost(rowData) {
      const ruleHostsText = rowData.hosts;
      if(ruleHostsText) {
        const ruleHosts = ruleHostsText.split(',').map(host => host.trim());
        if(ruleHosts.length) {
          return ruleHosts[0];
        }
      }
      return null;
    }

    function getUrl(ruleData, generatedHostname) {
      let urlHost = '<host>';
      if(generatedHostname && generatedHostname.length) {
        urlHost = generatedHostname;
      }

      const ruleHost = getRuleHost(ruleData);
      if(ruleHost) {
        urlHost = ruleHost;
      }

      let result = 'https://' + urlHost;

      let urlPath = '<path>';
      const paths = ruleData.paths;
      if(paths && paths.length) {
        urlPath = paths[0].path;
        if(urlPath && urlPath.length) {
          result += urlPath;
        }
      }

      return result;
    }

    function isLinkable(ruleData, hostnames) {
      if(!hostnames || !hostnames.length) {
        return false;
      }

      const ruleHost = getRuleHost(ruleData);
      if(ruleHost && !hostnames.includes(ruleHost)) {
        return false;
      }

      const paths = ruleData.paths;
      if(!paths || !paths.length) {
        return false;
      }

      return paths[0].pathType !== 'regex';
    }

    this.updateUrls = async(component) => {
      const busyDialogMessage = this.labelMapper('get-hosts-in-progress');
      dialogHelper.openBusyDialog(busyDialogMessage, 'bar', 1 / 2.0);

      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const kubectlOptions = k8sHelper.getKubectlOptions();
      const applicationName = project.vzApplication.applicationName.value;
      const applicationNamespace = project.k8sDomain.kubernetesNamespace.value;
      const hostsResult = await window.api.ipc.invoke('get-verrazzano-host-names', kubectlExe, applicationName,
        applicationNamespace, kubectlOptions);

      dialogHelper.closeBusyDialog();

      if (!hostsResult.isSuccess) {
        const errTitle = 'vz-application-design-get-hosts-error-title';
        const errMessage = this.labelMapper('get-hosts-error-message', { error: hostsResult.reason });
        await window.api.ipc.invoke('show-error-message', errTitle, errMessage);
        return;
      }

      const observableRules = this.componentObservable(component, 'ingressTraitRules');
      for(const ruleData of observableRules()) {
        const canLink = isLinkable(ruleData, hostsResult.hostnames);
        const url = getUrl(ruleData, hostsResult.generatedHostname);

        if((ruleData.url !== url) || (ruleData.canLink !== canLink)) {
          const newData = {...ruleData, canLink: canLink, url: url };
          observableRules.replace(ruleData, newData);
        }
      }
    };

    this.componentsIngressTraitRulesDataProvider = (component) => {
      const key = component.name;
      let provider = this.componentIngressTraitRulesDataProviders[key];

      if (!provider) {
        const observableArray = this.componentObservable(component, 'ingressTraitRules');
        provider = new ArrayDataProvider(observableArray, { keyAttributes: 'uid' });
        this.componentIngressTraitRulesDataProviders[key] = provider;
      }

      return provider;
    };

    this._findComponentIndex = (component) => {
      return this.components.value.findIndex(c => c.name === component.name);
    };

    this.handleAddRule = async (event, context, bindingContext) => {
      const component = bindingContext.component.data;

      const observableArray = this.componentObservable(component, 'ingressTraitRules');
      const newRule = { uid: utils.getShortUuid() };
      dialogHelper.promptDialog('vz-ingress-trait-rule-edit-dialog', newRule).then(result => {
        if (result && result.rule) {
          observableArray.push(result.rule);
        }
      });
    };

    this.handleEditRule = (event, rowContext, bindingContext) => {
      const component = bindingContext.component.data;

      const observableArray = this.componentObservable(component, 'ingressTraitRules');
      const rule = observableArray()[rowContext.item.index];
      const ruleOptions = { ...rule };

      dialogHelper.promptDialog('vz-ingress-trait-rule-edit-dialog', ruleOptions).then(result => {
        if (result && result.rule) {
          const mergedRule = this.mergeRule(rule, result.rule);
          observableArray.replace(rule, mergedRule);
        }
      });
    };

    this.handleDeleteRule = (event, rowContext, bindingContext) => {
      const component = bindingContext.component.data;

      const observableArray = this.componentObservable(component, 'ingressTraitRules');
      observableArray.splice(rowContext.item.index, 1);
    };

    this.mergeRule = (originalRule, ruleChanges) => {
      const resultRule = { ...originalRule };
      const keysToMerge = Object.keys(ruleChanges).filter(key => key !== 'uid');
      keysToMerge.forEach(key => {
        if ((typeof ruleChanges[key] === 'string' || Array.isArray(ruleChanges[key])) && ruleChanges[key].length === 0) {
          resultRule[key] = undefined;
        } else {
          resultRule[key] = ruleChanges[key];
        }
      });
      return resultRule;
    };
  }

  return VerrazzanoApplicationDesignViewModel;
});
