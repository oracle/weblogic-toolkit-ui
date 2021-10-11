/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['models/wkt-project', 'utils/script-generator-base'],
  function(project, ScriptGeneratorBase) {
    const scriptDescription = [
      'This script adds/updates ingress routes for your application',
      'using the specified ingress controller.'
    ];

    class IngressRoutesScriptGenerator extends ScriptGeneratorBase {
      constructor(scriptType) {
        super(scriptType);
      }

      generate() {
        const httpsProxyUrl = this.project.getHttpsProxyUrl();
        const bypassProxyHosts = this.project.getBypassProxyHosts();

        this.adapter.addScriptHeader(scriptDescription);
        this.adapter.addVariableStartBanner();

        this.adapter.addKubectlVariablesBlock(this.project.kubectl.executableFilePath.value, httpsProxyUrl,
          bypassProxyHosts, this.project.kubectl.kubeConfig.value, this.project.kubectl.kubeConfigContextToUse.value,
          undefined, this.project.ingress.opensslExecutableFilePath.value);

        let comment = [
          'When using TLS with Ingress routes, you must specify the secret to use',
          'and create it if it does not already exist. If you do not have a certificate,',
          'this script can generate one for you using OpenSSL.'
        ];
        this.adapter.addVariableDefinition('USE_TLS_SECRET', this.project.ingress.specifyIngressTLSSecret.value, comment);
        this.adapter.addVariableDefinition('USE_EXISTING_TLS_SECRET', !this.project.ingress.createTLSSecret.value);
        this.adapter.addVariableDefinition('TLS_SECRET_NAME', this.project.ingress.ingressTLSSecretName.value);
        this.adapter.addVariableDefinition('TLS_SECRET_NAMESPACE', this.project.k8sDomain.kubernetesNamespace.value);
        this.adapter.addVariableDefinition('GENERATE_TLS_SECRET', this.project.ingress.generateTLSFiles.value);

        let tlsCertFile = 'tls.crt';
        let tlsKeyFile = 'tls.key';
        if (this.project.ingress.generateTLSFiles.value) {
          this.adapter.addVariableDefinition('GEN_TLS_SUBJECT', this.project.ingress.ingressTLSSubject.value);
          this.adapter.addVariableDefinition('GEN_TLS_CERT_OUT', tlsCertFile);
          this.adapter.addVariableDefinition('GEN_TLS_KEY_OUT', tlsKeyFile);
        } else {
          tlsCertFile = project.ingress.ingressTLSCertFile.value;
          tlsKeyFile = project.ingress.ingressTLSKeyFile.value;
        }
        this.adapter.addVariableDefinition('TLS_CERT_FILE', tlsCertFile);
        this.adapter.addVariableDefinition('TLS_PRIVATE_KEY_FILE', tlsKeyFile);
        this.adapter.addEmptyLine();

        comment = [
          'Save the ingress routes yaml in a file and set the path here.',
          'Set to empty if there are no routes to add/update.'
        ];
        this.adapter.addVariableDefinition('INGRESS_ROUTES_YAML', this.fillInFileNameMask, comment);
        this.adapter.addEmptyLine();

        this.adapter.addVariableEndBanner();

        this.adapter.addKubectlExportAndUseContextBlock();
        const kubectlExe = this.adapter.getVariableReference('KUBECTL_EXE');

        comment = [ 'Generate the TLS certificate and private key files, if needed.' ];
        const generateCert = this.adapter.getVariableReference('GENERATE_TLS_SECRET');
        const openSslExe = this.adapter.getVariableReference('OPENSSL_EXE');
        const tlsSubject = this.adapter.getVariableReference('GEN_TLS_SUBJECT');
        const tlsCertOut = this.adapter.getVariableReference('GEN_TLS_CERT_OUT');
        const tlsKeyOut = this.adapter.getVariableReference('GEN_TLS_KEY_OUT');
        const tlsErrorMessage = 'Failed to generate TLS certificate and private key files';
        const tlsSuccessMessage = `TLS certificate file ${tlsCertOut} and private key file ${tlsKeyOut} generated`;
        this.adapter.addConditionalGenerateCertificateBlock(comment, generateCert, 'true', openSslExe,
          tlsSubject, tlsCertOut, tlsKeyOut, tlsErrorMessage, tlsSuccessMessage);

        comment = [ 'Create the TLS secret namespace, if needed.' ];
        const secretNamespace = this.adapter.getVariableReference('TLS_SECRET_NAMESPACE');
        const useExistingSecret = this.adapter.getVariableReference('TLS_USE_EXISTING_SECRET');
        let createErrorMessage = `Failed to create namespace ${secretNamespace}`;
        let alreadyExistsMessage = `Namespace ${secretNamespace} already exists`;
        this.adapter.addConditionalCreateNamespaceBlock(comment, useExistingSecret, 'false', kubectlExe,
          secretNamespace, createErrorMessage, alreadyExistsMessage);

        comment = [ 'Create TLS secret, if needed.' ];
        const secretName = this.adapter.getVariableReference('TLS_SECRET_NAME');
        const useTlsSecret = this.adapter.getVariableReference('USE_TLS_SECRET');
        const secretData = {
          cert: this.adapter.getVariableReference('TLS_SECRET_CERT'),
          key: this.adapter.getVariableReference('TLS_SECRET_KEY')
        };
        createErrorMessage = `Failed to create tls secret ${secretName} in namespace ${secretNamespace}`;
        const replaceMessage = `Replacing existing tls secret ${secretName} in namespace ${secretNamespace}`;
        const deleteErrorMessage = `Failed to delete tls secret ${secretName} in namespace ${secretNamespace}`;
        this.adapter.addCreateTlsSecretBlock(comment, kubectlExe, secretName, secretNamespace, secretData,
          createErrorMessage, deleteErrorMessage, replaceMessage, useTlsSecret, useExistingSecret);

        comment = [ 'Add/update Ingress Routes.' ];
        const routesYaml = this.adapter.getVariableReference('INGRESS_ROUTES_YAML');
        const routesErrorMessage = `Failed to add/update routes using YAML file ${routesYaml}`;
        this.adapter.addKubectlApplyBlock(comment, kubectlExe, routesYaml, routesErrorMessage);

        this.adapter.addScriptFooter();
        return this.adapter.getScript();
      }
    }

    return IngressRoutesScriptGenerator;
  }
);
