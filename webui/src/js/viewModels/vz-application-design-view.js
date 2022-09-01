/**
 * @license
 * Copyright (c) 2022, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
define(['models/wkt-project', 'accUtils', 'utils/common-utilities', 'knockout', 'utils/i18n',
  'ojs/ojbufferingdataprovider', 'ojs/ojarraydataprovider', 'utils/dialog-helper', 'utils/validation-helper',
  'utils/k8s-helper', 'utils/wkt-logger', 'ojs/ojmessaging',
  'ojs/ojinputtext', 'ojs/ojlabel', 'ojs/ojbutton', 'ojs/ojformlayout', 'ojs/ojcollapsible', 'ojs/ojselectsingle',
  'ojs/ojlistview', 'ojs/ojtable', 'ojs/ojswitch', 'ojs/ojinputnumber', 'ojs/ojradioset', 'ojs/ojaccordion'],
function (project, accUtils, utils, ko, i18n, BufferingDataProvider, ArrayDataProvider, dialogHelper,
  validationHelper, k8sHelper, wktLogger) {
  function VerrazzanoApplicationDesignViewModel() {

    this.connected = () => {
      accUtils.announce('Verrazzano Application Design View page loaded.', 'assertive');
    };

    this.labelMapper = (labelId, payload) => {
      if (labelId.startsWith('page-design-')) {
        return i18n.t(labelId);
      }
      return i18n.t(`vz-application-design-${labelId}`, payload);
    };

    this.project = project;
    this.i18n = i18n;

    this.components = this.project.vzApplication.components;
    this.componentsDataProvider = new ArrayDataProvider(this.components.observable, { keyAttributes: 'name' });

    this.hasComponents = ko.computed(() => this.components.observable().length > 0);

    this.getAddComponentValidationObject = () => {
      const validationObject = validationHelper.createValidatableObject('vz-application.design-add-component-flow-nane');
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
      const errTitle = 'vz-application-design-add-component-validation-error-title';
      const validationObject = this.getAddComponentValidationObject();
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
        await (window.api.ipc.invoke('get-verrazzano-component-names', kubectlExe, namespace, kubectlOptions));
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
        if (result?.componentName) {
          this.project.vzApplication.components.addNewItem({
            name: result.componentName,
            ingressTraitEnable: false,
            manualScalerTraitEnabled: false,
            metricsTraitEnabled: false,
            loggingTraitEnabled: false,
          });

          // this shouldn't be needed, but when a new component is added,
          // the accordion control doesn't enforce "single collapsible open" behavior.
          $('#componentsList')[0].refresh();
        }
      });
    };

    this.getCollapsibleId = (index) => {
      return `componentCollapsible${index + 1}`;
    };

    this.componentObservables = {};

    // create an observable that will read/write from the component object field
    this.componentObservable = (component, fieldName) => {
      const key = component.name + '/' + fieldName;
      let observable = this.componentObservables[key];

      if(!observable) {
        observable = new ko.observable(component[fieldName]);
        observable.subscribe(value => {
          component[fieldName] = value;
          this.project.vzApplication.componentChanged();
        });
        this.componentObservables[key] = observable;
      }

      return observable;
    };

    this.getRulesEditMethod = component => {
      return () => {
        // placeholder code until dialog is ready
        component['ingressTraitRules'] = [{rule1: 'abc'}, {rule2: 'xyz'}];
        this.project.vzApplication.componentChanged();
      };
    };
  }

  return VerrazzanoApplicationDesignViewModel;
});
