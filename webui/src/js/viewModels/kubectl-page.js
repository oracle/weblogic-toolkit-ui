/**
 * @license
 * Copyright (c) 2021, 2023, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout', 'models/wkt-project', 'utils/i18n', 'ojs/ojarraydataprovider',
  'ojs/ojbufferingdataprovider', 'utils/url-catalog', 'utils/k8s-helper', 'utils/common-utilities',
  'utils/dialog-helper', 'utils/view-helper', 'utils/wkt-logger', 'ojs/ojformlayout', 'ojs/ojinputtext',
  'ojs/ojselectsingle', 'ojs/ojtable'],
function(accUtils, ko, project, i18n, ArrayDataProvider, BufferingDataProvider, urlCatalog, k8sHelper, utils,
  dialogHelper, viewHelper, wktLogger) {
  function KubectlViewModel() {

    this.connected = () => {
      accUtils.announce('Kubectl page loaded.', 'assertive');
      this.updateInstructions(project.kubectl.k8sFlavor.observable());
    };

    this.project = project;

    this.labelMapper = (labelId, arg) => {
      if (arg) {
        return i18n.t(`kubectl-${labelId}`, arg);
      }
      return i18n.t(`kubectl-${labelId}`);
    };

    this.disableVerify = ko.observable(false);

    this.verifyKubectlConnectivity = async () => {
      await k8sHelper.startVerifyClusterConnectivity();
    };

    this.isMac = () => {
      return window.api.process.isMac();
    };

    this.usingWko = () => {
      return this.project.settings.wdtTargetType.value === 'wko';
    };

    this.vzManagedClustersColumnData = [
      {
        headerText: this.labelMapper('vz-managed-cluster-name-heading'),
        sortProperty: 'name'
      },
      {
        headerText: this.labelMapper('vz-managed-cluster-kubeconfig-heading'),
        'sortable': 'disable'
      },
      {
        headerText: this.labelMapper('vz-managed-cluster-kubecontext-heading'),
        sortProperty: 'kubeContext'
      },
      {
        'className': 'wkt-table-delete-cell',
        'headerClassName': 'wkt-table-add-header',
        'headerTemplate': 'headerTemplate',
        'template': 'actionTemplate',
        'sortable': 'disable',
        width: viewHelper.BUTTON_COLUMN_WIDTH
      },
    ];

    this.vzManagedClustersDP = new BufferingDataProvider(new ArrayDataProvider(
      this.project.kubectl.vzManagedClusters.observable, {keyAttributes: 'uid'}));

    this.getConnectivityHeading = ko.computed(() => {
      if (this.usingWko()) {
        return this.labelMapper('wko-connectivity-heading');
      } else {
        return this.labelMapper('vz-connectivity-heading');
      }
    }, this);

    this.chooseKubectl = () => {
      window.api.ipc.invoke('get-kubectl-exe').then(kubectlPath => {
        if (kubectlPath) {
          this.project.kubectl.executableFilePath.observable(kubectlPath);
        }
      });
    };

    this.chooseHelm = () => {
      window.api.ipc.invoke('get-helm-exe').then(helmPath => {
        if (helmPath) {
          this.project.kubectl.helmExecutableFilePath.observable(helmPath);
        }
      });
    };

    async function getKubeConfig() {
      const kubeConfigPath = await window.api.ipc.invoke('get-kube-config-files');
      wktLogger.debug('get-kube-config-files returned: %s', kubeConfigPath);
      return kubeConfigPath;
    }

    this.chooseKubeConfig = () => {
      getKubeConfig().then(kubeConfigPath => {
        if (Array.isArray(kubeConfigPath)) {
          this.project.kubectl.kubeConfig.observable(kubeConfigPath);
        } else if (typeof kubeConfigPath ==='string' && kubeConfigPath.length > 0) {
          this.project.kubectl.kubeConfig.observable(kubeConfigPath.split(window.api.path.delimiter));
        }
      });
    };

    this.chooseManagedKubeConfig = (event, context) => {
      const index = context.item.index;
      const managedClusterData = this.project.kubectl.vzManagedClusters.observable()[index];
      getKubeConfig().then(kubeConfigPath => {
        let kubeConfig;
        if (Array.isArray(kubeConfigPath)) {
          kubeConfig = kubeConfigPath;
        } else if (typeof kubeConfigPath === 'string'  && kubeConfigPath.length > 0) {
          kubeConfig = kubeConfigPath.split(window.api.path.delimiter);
        }

        if (kubeConfig) {
          const newManagedClusterData = { ...managedClusterData, kubeConfig };
          this.project.kubectl.vzManagedClusters.observable.replace(managedClusterData, newManagedClusterData);
        }
      });
    };

    async function getCurrentClusterContext(kubectlExe, options) {
      return window.api.ipc.invoke('kubectl-get-current-context', kubectlExe, options);
    }

    this.getCurrentContext = () => {
      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const options = { kubeConfig: this.project.kubectl.kubeConfig.value };
      getCurrentClusterContext(kubectlExe, options).then(results => {
        if (results.isSuccess) {
          this.project.kubectl.kubeConfigContextToUse.observable(results.context);
        } else {
          const errTitle = i18n.t('kubectl-get-current-context-error-title');
          const errMessage = i18n.t('kubectl-get-current-context-error-message', { error: results.reason });
          window.api.ipc.invoke('show-error-message', errTitle, errMessage).then().catch();
        }
      });
    };

    this.getManagedCurrentContext = (event, context) => {
      const index = context.item.index;
      const managedClusterData = this.project.kubectl.vzManagedClusters.observable()[index];
      wktLogger.debug('getting current context for managed cluster" %s', JSON.stringify(managedClusterData));

      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const options = { kubeConfig: managedClusterData.kubeConfig };
      getCurrentClusterContext(kubectlExe, options).then(results => {
        if (results.isSuccess) {
          const newManagedClusterData = { ...managedClusterData, kubeContext: results.context};
          this.project.kubectl.vzManagedClusters.observable.replace(managedClusterData, newManagedClusterData);
        } else {
          const errTitle = i18n.t('kubectl-get-current-context-error-title');
          const errMessage = i18n.t('kubectl-get-current-context-error-message', { error: results.reason });
          window.api.ipc.invoke('show-error-message', errTitle, errMessage).then().catch();
        }
      });
    };

    async function getContext(kubectlExe, options, kubeContext) {
      const results = await window.api.ipc.invoke('kubectl-get-contexts', kubectlExe, options);
      if (results.isSuccess) {
        const availableKubectlContextNames = [];
        results.contexts.forEach(entry => {
          availableKubectlContextNames.push({
            name: entry,
            label: entry
          });
        });
        const args = {
          availableKubectlContextNames,
          selectedKubectlContextName: kubeContext
        };
        return await dialogHelper.promptDialog('choose-kubectl-context-dialog', args);
      } else {
        const errTitle = i18n.t('kubectl-get-contexts-error-title');
        const errMessage = i18n.t('kubectl-get-contexts-error-message', { error: results.reason });
        window.api.ipc.invoke('show-error-message', errTitle, errMessage).then().catch();
      }
    }

    this.chooseContext = () => {
      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const options = { kubeConfig: this.project.kubectl.kubeConfig.value };
      const kubeContext = this.project.kubectl.kubeConfigContextToUse.value;
      getContext(kubectlExe, options, kubeContext).then(result => {
        if (result?.kubectlContextName) {
          this.project.kubectl.kubeConfigContextToUse.observable(result.kubectlContextName);
        }
      });
    };

    this.chooseManagedContext = (event, context) => {
      const index = context.item.index;
      const managedClusterData = this.project.kubectl.vzManagedClusters.observable()[index];

      const kubectlExe = this.project.kubectl.executableFilePath.value;
      const options = { kubeConfig: managedClusterData.kubeConfig };
      const kubeContext = managedClusterData.kubeContext;
      getContext(kubectlExe, options, kubeContext).then(result => {
        if (result?.kubectlContextName) {
          const newManagedClusterData = { ...managedClusterData, kubeContext: result.kubectlContextName };
          this.project.kubectl.vzManagedClusters.observable.replace(managedClusterData, newManagedClusterData);
        }
      });
    };

    this.chooseAdminContextTooltip = ko.computed(() => {
      if (this.project.settings.wdtTargetType.observable() === 'vz') {
        return this.labelMapper('config-vz-choose-admin-context-tooltip');
      } else {
        return this.labelMapper('config-wko-choose-context-tooltip');
      }
    });

    const generatedManagedClusterNameRegex = /^managed(\d+)$/;

    this.generateNewManagedClusterName = () => {
      let index = 1;
      this.project.kubectl.vzManagedClusters.observable().forEach(managedCluster => {
        const match = managedCluster.name.match(generatedManagedClusterNameRegex);
        if (match) {
          const indexFound = Number(match[1]);
          if (indexFound >= index) {
            index = indexFound + 1;
          }
        }
      });
      return `managed${index}`;
    };

    this.handleAddManagedCluster = () => {
      const managedClusterToAdd = {
        uid: utils.getShortUuid(),
        name: this.generateNewManagedClusterName(),
        kubeConfig: this.project.kubectl.kubeConfig.value
      };
      this.project.kubectl.vzManagedClusters.addNewItem(managedClusterToAdd);
    };

    this.handleDeleteManagedCluster = (event, context) => {
      const index = context.item.index;
      this.project.kubectl.vzManagedClusters.observable.splice(index, 1);
    };

    this.createLink = function (url, label) {
      return '<a href="' + url + '">' + label + '</a>';
    };

    // build an instruction message with one link substitution
    this.createInstructionMessage = function (messageKey, labelKey, url) {
      return this.labelMapper(messageKey, { link: this.createLink(url, this.labelMapper(labelKey)) });
    };

    // build a "complete following instructions" message with one link substitution
    this.createCompleteMessage = function (labelKey, url) {
      return this.createInstructionMessage('list-completeInstructions', labelKey, url);
    };

    // translate the version skew note with prefix and link
    const notePrefix = this.labelMapper('list-notePrefix');
    const versionSkewUrl = urlCatalog.getUrl('kubectl', 'versionSkewPolicy');
    const versionSkewMessage = this.createInstructionMessage('list-versionSkew', 'list-versionSkewLabel', versionSkewUrl);
    this.versionSkewNote = '<b>' + notePrefix + '</b> ' + versionSkewMessage;

    // translate the install kubectl messages with and without verification
    const installKubectlUrl = urlCatalog.getUrl('kubectl', 'installKubectl');
    const installKubectl = this.createInstructionMessage('list-install', 'list-linkHere', installKubectlUrl);
    const installKubectlNoVerify = this.createInstructionMessage('list-installNoVerify', 'list-linkHere', installKubectlUrl);

    // translate the verify install message with and without --client option
    const verifyInstall = this.labelMapper('list-verifyInstall', { command: '<code>kubectl version</code>'});
    const verifyInstallClient = this.labelMapper('list-verifyInstall', { command: '<code>kubectl version --client</code>'});

    // build a list of k8s flavors with key, label, title, and instructions
    this.k8sFlavors = [];

    const okeCompleteUrl = urlCatalog.getUrl('kubectl', 'okeClient');
    const okeComplete = this.createCompleteMessage('list-okeCompleteLabel', okeCompleteUrl);
    const okeInstructions = [installKubectlNoVerify, verifyInstallClient, okeComplete];
    if (this.isMac()) {
      const okeExtraPathDirectories = this.labelMapper('list-extraPathDirectories', { executable: '<code>oci</code>' });
      okeInstructions.push(okeExtraPathDirectories);
    }
    this.k8sFlavors.push({ key: 'OKE', label: 'Oracle Container Engine for Kubernetes',
      title: this.labelMapper('list-okeTitle'),
      instructions: okeInstructions
    });

    const eksCompleteUrl = urlCatalog.getUrl('kubectl', 'eksClient');
    const eksComplete = this.createCompleteMessage('list-eksCompleteLabel', eksCompleteUrl);
    const eksInstructions = [installKubectlNoVerify, verifyInstallClient, eksComplete];
    if (this.isMac()) {
      const eksExtraPathDirectories = this.labelMapper('list-eks-extraPathDirectories',
        { executable1: '<code>aws</code>', executable2: '<code>aws-iam-authenticator</code>' });
      eksInstructions.push(eksExtraPathDirectories);
    }
    this.k8sFlavors.push({ key: 'EKS', label: 'AWS Elastic Container Service for Kubernetes',
      title: this.labelMapper('list-eksTitle'),
      instructions: eksInstructions
    });

    const aksCompleteUrl = urlCatalog.getUrl('kubectl', 'aksClient');
    const aksComplete = this.createCompleteMessage('list-aksCompleteLabel', aksCompleteUrl);
    const aksInstructions = [installKubectlNoVerify, verifyInstallClient, aksComplete];
    if (this.isMac()) {
      const aksExtraPathDirectories = this.labelMapper('list-extraPathDirectories', { executable: '<code>az</code>' });
      aksInstructions.push(aksExtraPathDirectories);
    }
    this.k8sFlavors.push({ key: 'AKS', label: 'Azure Kubernetes Service',
      title: this.labelMapper('list-aksTitle'),
      instructions: aksInstructions
    });

    const gkeCompleteUrl = urlCatalog.getUrl('kubectl', 'gkeClient');
    const gkeComplete = this.createCompleteMessage('list-gkeCompleteLabel', gkeCompleteUrl);
    const gkeInstructions = [installKubectlNoVerify, verifyInstallClient, gkeComplete];
    if (this.isMac()) {
      const gkeExtraPathDirectories = this.labelMapper('list-extraPathDirectories', { executable: '<code>gcloud</code>' });
      gkeInstructions.push(gkeExtraPathDirectories);
    }
    this.k8sFlavors.push({ key: 'GKE', label: 'Google Kubernetes Engine',
      title: this.labelMapper('list-gkeTitle'),
      instructions: gkeInstructions
    });

    this.k8sFlavors.push({ key: 'K8S', label: 'Kubernetes',
      title: this.labelMapper('list-k8sTitle'),
      instructions: [installKubectl, verifyInstall]
    });

    const kindClusterUrl = urlCatalog.getUrl('kubectl', 'kindClient');
    const kindClusterAccess = this.createInstructionMessage('list-kindClusterAccess', 'list-kindClusterLabel', kindClusterUrl);
    this.k8sFlavors.push({ key: 'KND', label: 'kind',
      title: this.labelMapper('list-kindTitle'),
      instructions: [installKubectlNoVerify, verifyInstallClient, kindClusterAccess]
    });

    // end of building k8s flavors

    this.flavorTitle = ko.observable();
    this.instructions = ko.observableArray();

    this.k8sFlavorDP = new ArrayDataProvider(this.k8sFlavors, { keyAttributes: 'key' });

    project.kubectl.k8sFlavor.observable.subscribe((newFlavorKey) => {
      this.updateInstructions(newFlavorKey);
    });

    this.updateInstructions = (key) => {
      const k8sFlavor = this.getK8sFlavor(key);
      this.flavorTitle(k8sFlavor.title);
      this.instructions(k8sFlavor.instructions);
    };

    this.getK8sFlavor = (key) => {
      let flavor;
      for (let k8sFlavor of this.k8sFlavors) {
        if (k8sFlavor.key === key) {
          flavor = k8sFlavor;
          break;
        }
      }
      return flavor;
    };
  }

  /*
   * Returns a constructor for the ViewModel.
   */
  return KubectlViewModel;
});
