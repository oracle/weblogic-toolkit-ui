/**
 * @license
 * Copyright (c) 2025, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
'use strict';

define(['knockout', 'utils/modelEdit/model-edit-helper'],
  function (ko, ModelEditHelper) {
    function MetaOptions() {
      const TARGET_FOLDERS = ['Cluster', 'Server', 'MigratableTarget'];
      const JMS_TARGET_FOLDERS = ['JMSServer', 'SAFAgent'];

      this.targetOptions = () => {
        const adminServerName = getAdminServerName();
        const options = [
          { value: adminServerName, label: adminServerName },
        ];
        TARGET_FOLDERS.forEach(folder => {
          const names = getInstanceNames(['topology', folder]);
          names.forEach(name => {
            if (name !== adminServerName) {
              options.push({ value: name, label: name })
            }
          });
        });
        return options;
      };

      this.jmsTargetOptions = () => {
        const options = this.targetOptions();
        JMS_TARGET_FOLDERS.forEach(folder => {
          const names = getInstanceNames(['resources', folder]);
          names.forEach(name => options.push({ value: name, label: name }));
        });
        return options;
      };

      this.getDefaultRealmOptions = () => {
        const defaultRealmName = 'myrealm';
        const options = [
          { value: defaultRealmName, label: defaultRealmName },
        ]
        const realmNames = getInstanceNames(['topology', 'SecurityConfiguration', 'Realm']);
        realmNames.forEach(name => {
          if (name !== defaultRealmName) {
            options.push({ value: name, label: name });
          }
        });
        return options;
      }

      this.getCertIssuerPluginCredentialSetOptions = () => {
        const options = []
        const credentialSetNames = getInstanceNames(['topology', 'SecurityConfiguration', 'CredentialSet']);
        credentialSetNames.forEach(credentialSetName => options.push({ value: credentialSetName, label: credentialSetName }));
        return options;
      }

      this.getCertIssuerPluginDeploymentOptions = () => {
        const defaultOciCertIssuerDeploymentName = 'cert-issuer-for-oci-cert-svc'
        const options = [
          { value: defaultOciCertIssuerDeploymentName, label: defaultOciCertIssuerDeploymentName }
        ];
        const pluginDeploymentNames = getInstanceNames(['appDeployments', 'PluginDeployment']);
        pluginDeploymentNames.forEach(pluginDeploymentName => {
          if (pluginDeploymentName !== defaultOciCertIssuerDeploymentName) {
            options.push({ value: pluginDeploymentName, label: pluginDeploymentName });
          }
        });
        return options;
      }

      this.getCertPathBuilderInRealmOptions = (attribute) => {
        const modelPath = attribute.path;
        const options = [];
        const certPathProviderNames = getInstanceNames([...modelPath, 'CertPathProvider']);
        certPathProviderNames.forEach(certPathProviderName => options.push({ value: certPathProviderName, label: certPathProviderName }));
        return options;
      }

      function getInstanceNames(modelPath) {
        const folder = ModelEditHelper.getFolder(modelPath);
        return Object.keys(folder);
      }

      function getAdminServerName() {
        let result = 'AdminServer';
        const folder = ModelEditHelper.getFolder(['topology']);
        if (folder.hasOwnProperty('AdminServerName') && folder.AdminServerName) {
          result = folder.AdminServerName;
        }
        return result;
      }
    }

    // return a singleton instance
    return new MetaOptions();
  }
);
