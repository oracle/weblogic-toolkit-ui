/**
 * @license
 * Copyright (c) 2021, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const fetch = require('node-fetch');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const extract = require('extract-zip');
const tar = require('tar');
const gunzip = require('gunzip-maybe');
const HttpsProxyAgent = require('https-proxy-agent');

const fsUtils = require('./fsUtils');
const osUtils = require('./osUtils');

// WARNING: This file contains functions that are called by build scripts
//          (where this code is not running in Electron).  As such, do not
//          require files like userSettings.js, wktLogging.js, or
//          wktTools.js, all of which execute code during that requires an
//          electron environment to function properly.
//
const ghApiWdtBaseUrl = 'https://api.github.com/repos/oracle/weblogic-deploy-tooling';
const wdtToolName = 'WebLogic Deploy Tooling';
const wdtTopLevelDirectoryName = 'weblogic-deploy';

const ghApiWitBaseUrl = 'https://api.github.com/repos/oracle/weblogic-image-tool';
const witToolName = 'WebLogic Image Tool';
const witTopLevelDirectoryName = 'imagetool';

const ghApiWkoBaseUrl = 'https://api.github.com/repos/oracle/weblogic-kubernetes-operator';
const wkoToolName = 'WebLogic Kubernetes Operator';
const wkoImageName = 'ghcr.io/oracle/weblogic-kubernetes-operator';

const ZIP_EXTENSION = '.zip';
const TAR_GZ_EXTENSION = '.tar.gz';

async function updateTools(releases, outputPath, options) {
  if (!releases || releases.length === 0) {
    return new Promise(resolve => resolve());
  }

  return new Promise((resolve, reject) => {
    const installFunction = getInstallFunction(releases[0]);
    installFunction(outputPath, options)
      .then(() => {
        if (releases.length === 2) {
          const secondInstallFunction = getInstallFunction(releases[1]);
          secondInstallFunction(outputPath, options)
            .then(() => resolve())
            .catch(err => reject(`Unable to update to ${releases[1]}: ${err}`));
        } else {
          resolve();
        }
      })
      .catch(err => reject(`Unable to update to ${releases[0]}: ${err}`));
  });
}

async function downloadWdtRelease(outputPath, options) {
  return new Promise((resolve, reject) => {
    downloadToolRelease(wdtToolName, ghApiWdtBaseUrl, outputPath, options)
      .then((installerData) => resolve(installerData))
      .catch(err => reject(err));
  });
}

async function installWdtRelease(outputPath, options) {
  console.log(`Installing WebLogic Deploy Tooling to ${outputPath} directory`);
  return new Promise((resolve, reject) => {
    installToolRelease(wdtToolName, wdtTopLevelDirectoryName, ghApiWdtBaseUrl, outputPath, options)
      .then(() => {
        console.log('Finished installing WebLogic Deploy Tooling');
        resolve();
      })
      .catch(err => reject(err));
  });
}

async function installWitRelease(outputPath, options) {
  console.log(`Installing WebLogic Image Tool to ${outputPath} directory`);
  return new Promise((resolve, reject) => {
    installToolRelease(witToolName, witTopLevelDirectoryName, ghApiWitBaseUrl, outputPath, options)
      .then(() => {
        console.log('Finished installing WebLogic Image Tool');
        resolve();
      })
      .catch(err => reject(err));
  });
}

async function getWdtLatestReleaseName(options) {
  return new Promise((resolve, reject) => {
    getLatestGitHubReleaseObject(wdtToolName, ghApiWdtBaseUrl, getProxyAgent(options))
      .then(latestReleaseObj => resolve(latestReleaseObj['name']))
      .catch(err => reject(`Failed to determine latest release name for ${wdtToolName}: ${err}`));
  });
}

async function getWitLatestReleaseName(options) {
  return new Promise((resolve, reject) => {
    getLatestGitHubReleaseObject(witToolName, ghApiWitBaseUrl, getProxyAgent(options))
      .then(latestReleaseObj => resolve(latestReleaseObj['name']))
      .catch(err => reject(`Failed to determine latest release name for ${witToolName}: ${err}`));
  });
}

async function getWkoLatestReleaseImageName(options) {
  return new Promise((resolve, reject) => {
    getLatestGitHubReleaseObject(wkoToolName, ghApiWkoBaseUrl, getProxyAgent(options))
      .then(latestReleaseObj => {
        const version = latestReleaseObj['name'].split(' ')[1];
        resolve(`${wkoImageName}:${version}`);
      })
      .catch(err => reject(new Error(`Failed to determine latest release name for ${wkoToolName}: ${err}`)));
  });
}

async function installToolRelease(toolName, toolTopLevelDirectory, toolUrl, outputPath, options) {
  return new Promise((resolve, reject) => {
    fsUtils.makeDirectoryIfNotExists(outputPath)
      .then(() => {
        const proxyAgent = getProxyAgent(options);

        console.log(`Getting latest release information for ${toolName}`);
        getLatestGitHubReleaseObject(toolName, toolUrl, proxyAgent)
          .then(latestReleaseObj => {
            if (latestReleaseObj && 'name' in latestReleaseObj) {
              console.log(`Found latest release: ${latestReleaseObj['name']}`);
            }
            installTool(latestReleaseObj, outputPath, path.join(outputPath, toolTopLevelDirectory), proxyAgent)
              .then(() => resolve())
              .catch(err => reject(`Failed to install ${toolName}: ${err}`));
          })
          .catch(err => reject(`Failed to get latest release for ${toolName}: ${err}`));
      })
      .catch(err => reject(`Unable to install ${toolName} to ${outputPath}: ${err}`));
  });
}

async function downloadToolRelease(toolName, toolUrl, outputPath, options) {
  return new Promise((resolve, reject) => {
    fsUtils.makeDirectoryIfNotExists(outputPath)
      .then(() => {
        const proxyAgent = getProxyAgent(options);
        getLatestGitHubReleaseObject(toolName, toolUrl, proxyAgent)
          .then(latestReleaseObj => {
            const archiveAsset = getGitHubAssetObjFromRelease(latestReleaseObj);
            const archiveAssetUrl = getGitHubAssetUrl(archiveAsset);
            const assetFileName = archiveAsset['name'];
            const archiveFileName = path.join(outputPath, assetFileName);
            const versionNumber = getVersionNumberFromReleaseName(latestReleaseObj['name']);
            downloadArchiveFile(archiveAssetUrl, archiveFileName, proxyAgent)
              .then(() => resolve({ fileName: archiveFileName, version: versionNumber }))
              .catch(err => reject(new Error(`Failed to download installer for ${toolName} from ${archiveAssetUrl}: ${err}`)));
          })
          .catch(err => reject(new Error(`Failed to get latest release for ${toolName}: ${err}`)));
      })
      .catch(err => reject(new Error(`Failed to create/validate the output directory ${outputPath}: ${err}`)));
  });
}

function getProxyAgent(options) {
  const httpsProxyUrl = getHttpsProxyUrl(options);
  let proxyAgent;
  if (httpsProxyUrl) {
    proxyAgent = new HttpsProxyAgent(httpsProxyUrl);
  }
  return proxyAgent;
}

async function getLatestGitHubReleaseObject(name, baseUrl, proxyAgent) {
  return new Promise((resolve, reject) => {
    const latestUrl = baseUrl + '/releases/latest';
    fetch(latestUrl, getFetchOptions(proxyAgent))
      .then(res => resolve(res.json()))
      .catch(err => reject(`Failed to get the latest release of ${name} from ${latestUrl}: ${err}`));
  });
}

function getGitHubAssetObjFromRelease(ghReleaseObj) {
  let archiveAsset;
  if ('assets' in ghReleaseObj) {
    const assets = ghReleaseObj['assets'];
    if (assets.length === 1) {
      archiveAsset = assets[0];
    } else if (assets.length > 1) {
      const desiredExtension = osUtils.isWindows() ? ZIP_EXTENSION : TAR_GZ_EXTENSION;
      for (const asset of assets) {
        if ('name' in asset && asset['name'].endsWith(desiredExtension)) {
          archiveAsset = asset;
          break;
        }
      }
      // Hopefully this should never happen.  Since there were multiple assets
      // and none matched the desired extension for the platform, pick the first
      // one an hope it is ok!
      //
      if (!archiveAsset) {
        console.warn(`${ghReleaseObj['name']} contained ${assets.length} release assets but none ending with ` +
          `${desiredExtension}, so picking the first one: ${assets[0]['name']}`);
        archiveAsset = assets[0];
      }
    } else {
      throw new Error(`${ghReleaseObj['name']} contained 0 release assets`);
    }
  } else {
    throw new Error(`${ghReleaseObj['name']} did not contain any assets`);
  }
  return archiveAsset;
}

function getGitHubAssetUrl(ghAssetObj) {
  let url;
  if ('browser_download_url' in ghAssetObj) {
    url = ghAssetObj['browser_download_url'];
  } else {
    throw new Error(`${ghAssetObj['name']} has no download url`);
  }
  return url;
}

async function installTool(ghReleaseObj, outputPath, directoryToDelete, proxyAgent) {
  return new Promise((resolve, reject) => {
    const archiveAsset = getGitHubAssetObjFromRelease(ghReleaseObj);
    const archiveAssetUrl = getGitHubAssetUrl(archiveAsset);
    const assetFileName = archiveAsset['name'];

    if (!assetFileName.endsWith(ZIP_EXTENSION) && !assetFileName.endsWith(TAR_GZ_EXTENSION)) {
      return reject(`Asset ${archiveAsset['name']} has an unexpected extension so aborting installation`);
    }

    const archiveFileName = path.join(outputPath, assetFileName);
    downloadArchiveFile(archiveAssetUrl, archiveFileName, proxyAgent)
      .then(() => {
        fsUtils.removeDirectoryRecursively(directoryToDelete).then(() => {
          if (assetFileName.endsWith(ZIP_EXTENSION)) {
            openZipFile(archiveFileName, outputPath)
              .then(() => {
                deleteArchiveFile(archiveFileName).then(() => resolve());
              }).catch(err => reject(`Failed to extract ${archiveFileName}: ${err}`));
          } else {
            console.log(`preparing to open .tar.gz file ${archiveFileName} in ${outputPath}`);
            openTarGzFile(archiveFileName, outputPath).then(() => {
              deleteArchiveFile(archiveFileName).then(() => resolve());
            }).catch(err => reject(`Failed to extract ${archiveFileName}: ${err}`));
          }
        }).catch(err => reject(`Failed to remove ${directoryToDelete}: ${err}`));
      }).catch(err => reject(`Failed to download ${archiveAssetUrl} to ${archiveFileName}: ${err}`));
  });
}

async function downloadArchiveFile(fileUrl, outputFile, proxyAgent) {
  return new Promise(resolve => {
    fetch(fileUrl, getFetchOptions(proxyAgent)).then(res => {
      const out = fs.createWriteStream(outputFile);
      out.addListener('close', () => resolve());
      res.body.pipe(out);
    });
  });
}

async function openZipFile(zipFile, outputDir) {
  return new Promise((resolve, reject) => {
    extract(zipFile, {dir: outputDir}).then(() => resolve()).catch(err => reject(err));
  });
}

async function openTarGzFile(tarGzFile, outputDir) {
  return new Promise((resolve, reject) => {
    const tarGzStream = fs.createReadStream(tarGzFile);
    tarGzStream.addListener('close', () => {
      resolve();
    });
    try {
      tarGzStream.pipe(gunzip()).pipe(tar.x({cwd: outputDir}));
    } catch (err) {
      reject(err);
    }
  });
}

function getFetchOptions(proxyAgent) {
  let options = {};
  if (proxyAgent) {
    options = {
      agent: proxyAgent
    };
  }
  return options;
}

function getOptions(options, defaultOptions) {
  if (options === null || options === undefined || typeof options === 'function') {
    return defaultOptions;
  }

  if (typeof options === 'string') {
    defaultOptions = {...defaultOptions};
    defaultOptions.httpsProxy = options;
    options = defaultOptions;
  } else if (typeof options !== 'object') {
    throw new Error(`Invalid options argument type: ${typeof options}`);
  }
  return options;
}

function getHttpsProxyUrl(options) {
  const myOptions = getOptions(options, {httpsProxyUrl: undefined});
  return myOptions.httpsProxyUrl;
}

function getInstallFunction(releaseName) {
  let func;
  if (releaseName.startsWith(wdtToolName)) {
    func = installWdtRelease;
  } else if (releaseName.startsWith(witToolName)) {
    func = installWitRelease;
  } else {
    throw new Error(`Unknown release name ${releaseName}`);
  }
  return func;
}

async function deleteArchiveFile(archiveFileName) {
  return new Promise((resolve) => {
    fsPromises.rm(archiveFileName, {force: true})
      .then(() => resolve())
      .catch(err => {
        console.warn(`Unable to remove ${archiveFileName} after installation: ${err}`);
        resolve();
      });
  });
}

function getVersionNumberFromReleaseName(releaseName) {
  return releaseName.match(/.*(\d+\.\d+\.\d+).*/)[1];
}

module.exports = {
  downloadWdtRelease,
  updateTools,
  installWdtRelease,
  installWitRelease,
  getWdtLatestReleaseName,
  getWitLatestReleaseName,
  getWkoLatestReleaseImageName
};
