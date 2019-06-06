#!/usr/bin/env node

const git = require('simple-git');
const chalk = require('chalk');
const { promisify } = require('util');
const { exec } = require('child_process');
const execute = promisify(exec);

const logger = {
  error: (action = '') => err => {
    console.error(
      `[ ${chalk.red('✗')} ]`,
      chalk.red(`ERROR(${action}): `),
      err
    );
  },

  warn: (...messages) => {
    console.log(
      `[ ${chalk.yellow('!')} ]`,
      chalk.yellow('WARNING: '),
      ...messages
    );
  },

  success: (...messages) => {
    console.log(`[ ${chalk.green('✓')} ]`, ...messages);
  },

  info: (...messages) => {
    console.log(`[ ${chalk.blueBright('-')} ]`, ...messages);
  },
};

const simpleGitLogger = (action = 'git things') => (err, _) => {
  if (err) {
    logger.error(action);
  }

  logger.success(action);
};

const projectName = 'projectA';
const releaseNumber = '2.0';

// cd path will be location from lerna
const bumpForRelease = () =>
  execute(`cd ./packages/projectA && npm version major`)
    .then(() => logger.success('Bumped project version'))
    .catch(logger.error('bumping project versions'));

const commitBumpForRelease = () => {
  return git()
    .add('./*')
    .commit(`Publish ${projectName} for release ${releaseNumber}`)
    .exec(simpleGitLogger('Committed bump to project version'));
};

const lernaVersion = () => {
  return execute(`yarn lerna version minor --yes`)
    .then(() => logger.success('Bumped project version'))
    .catch(logger.error('bumping project versions'));
};

const gitPush = (remote, branch, options) => {
  // const pushCommand = options ? git().push(remote, branch) : git().push(remote, branch, options)

  return git()
    .push(remote, branch, options)
    .exec(simpleGitLogger(`Pushed to ${remote} ${branch}`));
};

const getCommitHashAtHead = () => {
  const action = 'Getting commit hash';
  return new Promise(resolve => {
    git().revparse(['HEAD'], (err, res) => {
      if (err) {
        logger.error(action)(err);
      }

      logger.success(action);
      resolve(res);
    });
  });
};

const getTagAtHead = () => {
  return execute('git describe --tags')
    .then(({ stdout }) => stdout)
    .catch(logger.error('getting the git tag at head'));
};

const cutReleaseBranch = startPoint => {
  return git()
    .checkoutBranch(`release/${projectName}/${releaseNumber}`, startPoint)
    .exec(simpleGitLogger('Cut release branch'));
};

(async () => {
  try {
    await bumpForRelease();
    await commitBumpForRelease();
    const releaseBumpCommitHash = await getCommitHashAtHead();
    logger.info(`Release bump commit hash: ${releaseBumpCommitHash}`);
    await lernaVersion();
    const lernaVersionCommitHash = await getCommitHashAtHead();
    const gitTag = await getTagAtHead();
    logger.info(`Lerna version commit hash: ${lernaVersionCommitHash}`);
    logger.info(`Created and pushed git tag: ${gitTag}`);
    await gitPush('origin', 'master');
    await cutReleaseBranch(releaseBumpCommitHash);
    await gitPush('origin', `release/${projectName}/${releaseNumber}`, ['-u']);
  } catch (error) {
    logger.error()(error);
  }
})();
