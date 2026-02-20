/**
 * @license
 * Copyright (c) 2024, 2026, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0 as shown at https://oss.oracle.com/licenses/upl/
 */
'use strict';

define(['accUtils', 'knockout',
  'utils/modelEdit/model-edit-helper', 'utils/modelEdit/module-helper', 'utils/modelEdit/meta-helper',
  'utils/modelEdit/message-helper', 'utils/modelEdit/alias-helper'
],
function(accUtils, ko, ModelEditHelper, ModuleHelper, MetaHelper, MessageHelper, AliasHelper) {
  function FolderContentViewModel(args) {
    // Display the attribute groups, single folders, and multiple folders for a model path.
    // Customizations from MetaHelper are taken into account.
    // This is usually embedded in folder-page or folder-section.

    const MODEL_PATH = args.modelPath;
    const ALIAS_PATH = AliasHelper.getAliasPath(MODEL_PATH);

    this.subscriptions = [];

    this.connected = () => {
      accUtils.announce('Folder Content loaded.', 'assertive');
      this.subscriptions = [];
    };

    this.disconnected = () => {
      this.subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    };

    const metaSections = MetaHelper.getSections(ALIAS_PATH);
    const attributeMap = ModelEditHelper.createAttributeMap(MODEL_PATH, this.subscriptions);
    const mergeFolder = MetaHelper.getMergeFolder(ALIAS_PATH);
    const mergeModelPath = mergeFolder ? [...MODEL_PATH, mergeFolder] : null;
    if(mergeFolder) {
      ModelEditHelper.updateAttributeMap(attributeMap, mergeModelPath, this.subscriptions);
    }

    const folderInfo = getFolderInfo(metaSections, attributeMap);

    this.sectionsConfig = ModuleHelper.createSectionsConfig(MODEL_PATH, metaSections, folderInfo, attributeMap, true);

    // get summary information about the top-level metadata sections, such as:
    // - are there remaining attributes that ar not assigned?
    // - is there a specified location for remaining attributes?
    // - are tabs configured?
    function getFolderInfo(metaSections, attributeMap) {
      const assignmentInfo = {
        assignedAttributes: [],
        remainingAttributesAssigned: false,
      };
      updateAssignmentInfo(assignmentInfo, metaSections);

      let usesTabs = false;
      metaSections.forEach(section => {
        if (MetaHelper.isTabSection(section.type)) {
          usesTabs = true;
        }
      });

      const remainingAttributes = ModelEditHelper.getRemainingNames(attributeMap, assignmentInfo.assignedAttributes);

      return {
        remainingAttributes,
        remainingAttributesAssigned: assignmentInfo.remainingAttributesAssigned,
        usesTabs
      };
    }

    // get unclaimed attribute / folder information about nested sections, such as:
    // - attributes / folders that are assigned
    // - are there sections that include remaining attributes / folders?
    function updateAssignmentInfo(assignmentInfo, sections) {
      const assignedAttributes = [];
      let remainingAttributesAssigned = assignmentInfo.remainingAttributesAssigned;

      sections.forEach(section => {
        // several section types can have attributes, including: attributes, custom, hidden
        const attributes = section.attributes || [];
        assignedAttributes.push(...attributes);
        if (section.addRemainingAttributes) {
          remainingAttributesAssigned = true;
        }

        // several section types can list subsections, including: collapsible, tab, custom
        const subsections = section.sections || [];
        if(sections.length) {
          updateAssignmentInfo(assignmentInfo, subsections);
        }
      });

      assignmentInfo.assignedAttributes.push(...assignedAttributes);
      assignmentInfo.remainingAttributesAssigned |= remainingAttributesAssigned;
    }
  }

  return FolderContentViewModel;
});
