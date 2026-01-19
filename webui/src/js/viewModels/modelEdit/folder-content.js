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

    let folderMap = AliasHelper.getFolderMap(MODEL_PATH);
    if(mergeModelPath) {
      const mergeMap = AliasHelper.getFolderMap(mergeModelPath);
      for (const key in mergeMap) {
        const qualifiedKey = mergeFolder + '/' + key;
        folderMap[qualifiedKey] = mergeMap[key];
      }
    }

    const folderInfo = getFolderInfo(metaSections, attributeMap, folderMap);

    // remove merge folder from remaining folders
    const remainingFolders = folderInfo.remainingFolders;
    if(mergeFolder && remainingFolders.includes(mergeFolder)) {
      remainingFolders.splice(remainingFolders.indexOf(mergeFolder), 1);
    }

    this.sectionsConfig = ModuleHelper.createSectionsConfig(MODEL_PATH, metaSections, folderInfo, attributeMap, true);

    // get summary information about the top-level metadata sections, such as:
    // - are tabs configured or needed?
    // - is there a specified location for remaining attributes?
    // - is there a specified location for remaining subfolders?
    function getFolderInfo(metaSections, attributeMap, folderMap) {
      const assignmentInfo = {
        assignedAttributes: [],
        assignedFolders: [],
        remainingAttributesAssigned: false,
        remainingFoldersAssigned: false
      };
      updateAssignmentInfo(assignmentInfo, metaSections);

      let hasTabSections = false;

      metaSections.forEach(section => {
        if (MetaHelper.isTabSection(section.type)) {
          hasTabSections = true;
        }
      });

      const remainingAttributes = ModelEditHelper.getRemainingNames(attributeMap, assignmentInfo.assignedAttributes);
      const remainingFolders = ModelEditHelper.getRemainingNames(folderMap, assignmentInfo.assignedFolders);

      // special case - don't need tabs if one remaining folder, no unassigned attributes
      const hasUnassignedAttributes = remainingAttributes.length && !assignmentInfo.remainingAttributesAssigned;
      const hasOnlyOneFolder = (remainingFolders.length === 1) && !hasUnassignedAttributes;

      const usesTabs = hasTabSections || (remainingFolders.length && !hasOnlyOneFolder);

      return {
        remainingAttributes,
        remainingFolders,
        remainingAttributesAssigned: assignmentInfo.remainingAttributesAssigned,
        remainingFoldersAssigned: assignmentInfo.remainingFoldersAssigned,
        usesTabs
      };
    }

    // get unclaimed attribute / folder information about nested sections, such as:
    // - attributes / folders that are assigned
    // - are there sections that include remaining attributes / folders?
    function updateAssignmentInfo(assignmentInfo, sections) {
      const assignedAttributes = [];
      const assignedFolders = [];
      let remainingAttributesAssigned = assignmentInfo.remainingAttributesAssigned;
      let remainingFoldersAssigned = assignmentInfo.remainingFoldersAssigned;

      sections.forEach(section => {
        // several section types can have attributes, including: attributes, custom, hidden
        const attributes = section.attributes || [];
        assignedAttributes.push(...attributes);
        if (section.addRemainingAttributes) {
          remainingAttributesAssigned = true;
        }

        // several section types can list folders, including: custom, hidden
        const folders = section.folders || [];
        assignedFolders.push(...folders);
        if (section.addRemainingFolders) {
          remainingFoldersAssigned = true;
        }

        // some sections reference a single folder, including folder, folderTab
        const folder = section.folder;
        if(folder) {
          assignedFolders.push(folder);
        }

        // several section types can list subsections, including: collapsible, tab, custom
        const subsections = section.sections || [];
        if(sections.length) {
          updateAssignmentInfo(assignmentInfo, subsections);
        }
      });

      assignmentInfo.assignedAttributes.push(...assignedAttributes);
      assignmentInfo.assignedFolders.push(...assignedFolders);
      assignmentInfo.remainingAttributesAssigned |= remainingAttributesAssigned;
      assignmentInfo.remainingFoldersAssigned |= remainingFoldersAssigned;
    }
  }

  return FolderContentViewModel;
});
