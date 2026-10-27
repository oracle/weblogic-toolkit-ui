# WebLogic Kubernetes Toolkit UI agent guidance

This file records development conventions for coding agents. User documentation lives in
[README.md](README.md) and the [Developer Guide](documentation/2.0/content/developer/_index.md).
Follow [CONTRIBUTING.md](CONTRIBUTING.md) for contribution and sign-off requirements.

## Project layout and development

- `electron/` contains desktop integration, local files, credentials, and tool execution.
- `webui/src/` contains the Oracle JET interface, models, views, and view models. Edit source
  files rather than generated web assets or packaged output.
- Development uses two processes: run `npm start` in `webui/`, then `npm start` in `electron/`.
  The Electron development window loads the JET server at `http://localhost:8000/`.
- Development loads WDT from `tools/weblogic-deploy/`. To test a local WDT build, install the
  complete distribution there, including `VERSION.txt` and `lib/weblogic-deploy-core.jar`.
  Preserve the prior installation when replacing it. Restart the UI to reload WDT aliases.
  Installed tools are ignored development artifacts, not source changes to commit.

## Model Editor labels and help

- English Model Editor messages live in `electron/app/locales/en/modeledit.json`. Preserve
  existing message values, ordering, and formatting when adding entries.
- From the repository root, preview missing labels with
  `node electron/scripts/appendAliasLabels.js --dry-run`; omit `--dry-run` to append them.
  The script reads the installed WDT aliases and registered UI navigation and metadata.
- Generated attribute and folder labels are drafts requiring human review. Do not infer
  plurals or singulars automatically. Review generated collection labels alongside the
  singular folder `typeLabel`, list `itemLabel`, and dictionary `entryLabel` wording.
- Respect the UI's translation lookup precedence, including folder-specific overrides.
  Dots in attribute names become underscores in translation keys. Keep alias names intact
  even when correcting spelling or capitalization in display text.
- Label generation skips explicitly hidden attributes and beans omitted from top-level
  navigation. This is a conservative filter, not a complete simulation of UI visibility.
- Derive help from authoritative WLS documentation or source. Share help across beans when
  semantics match; use folder-specific keys when behavior differs materially. Check units,
  special values such as zero and minus one, restart requirements, and version differences.
- Attribute-specific help is optional to the label generator. Generic help such as
  `a-any-help` resolves successfully without producing a missing-translation entry, so a
  clean `modeledit.missing.json` does not establish that useful help exists for every field.
- For manual missing-label checks, restart the development UI, clear the local missing-key
  log, and exercise the relevant pages and dialogs. Missing-key logs are diagnostic output,
  not translation files to publish.

## Alias data and navigation

- Register new bean metadata in `webui/src/js/utils/modelEdit/metadata/all-metadata.js` and
  add top-level beans explicitly to the appropriate navigation JSON. Alias availability
  alone does not add a top-level navigation entry. Follow existing `SystemResource` to
  `Resource` merge patterns so descriptor fields appear on the system-resource page.
- Treat shared WDT alias data as immutable. Copy arrays before extending them for navigation.
- Merged folders can use compound navigation paths such as `JmsResource/Queue`. Split those
  paths into individual components before treating them as folder names.
- Only build provider-type choices for beans that actually use type folders.

## Attribute controls and credentials

- Translate documented formats, ranges, and enumerations into validators or appropriate
  controls where practical, preserving the ability to leave optional settings unset.
- Do not disable a field based solely on a local setting when a template can supply the
  effective value.
- Alias types do not identify every sensitive value. Check WLS semantics and WDT handling,
  and mask both attribute editors and table summaries. When another field determines
  sensitivity, update the control as that field changes without losing the value.
  For JMS foreign-server JNDI properties, the case-sensitive `.encrypted` suffix on `Key`
  determines WLS encryption. An explicit `Key` takes precedence over the UI instance name;
  when `Key` is unset, WDT uses the instance name as the key.

## Validation and repository workflow

- Run `npm test` and `npm run eslint` from the affected `webui/` or `electron/` directory.
  Use focused Mocha tests during development. Lint changed files explicitly when they are
  outside the package script's globs, such as `electron/scripts/`.
- UI unit tests and label-script unit tests should use fixtures and stubs without requiring
  an installed WDT. The running UI and the label-generation command do require WDT.
- Preserve unrelated workspace edits, particularly package lockfile changes caused by local
  dependency installation. Stage task files explicitly rather than staging the whole tree.
- Include lockfile changes for intentional dependency updates; exclude incidental changes
  from local installation when dependencies are unchanged.
- Check `git remote -v` before publishing. For this OraHub workspace, use the configured
  OraHub repository and merge requests. Describe behavior changes and validation in the MR.

## Issue tracking and reviews

- UI issues use the `WKTUI` project in
  [Oracle Jira](https://jira.oraclecorp.com/jira/). Issue URLs follow
  `https://jira.oraclecorp.com/jira/browse/WKTUI-<number>`. Related WDT issues use `WDT`
  on the same Jira server. If the connector cannot find a known issue, check whether its
  project filter includes the relevant project before assuming the issue is unavailable.
- This workspace publishes to
  [OraHub](https://orahub.oci.oraclecorp.com/weblogic-cloud/weblogic-toolkit-ui).
  [Merge requests](https://orahub.oci.oraclecorp.com/weblogic-cloud/weblogic-toolkit-ui/-/merge_requests)
  belong to that repository. Use the OraHub integration or authenticated `glab` for this host.
- Reference the Jira issue in commit messages and MR descriptions. Link related WDT issues
  and MRs when behavior depends on a WDT change, and state any remaining dependency.
  Keep temporary issue status and individual MR references in the MR description rather
  than in this general guidance. Do not put credentials or tokens in guidance files.
