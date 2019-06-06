#!/usr/bin/env node

const git = require('simple-git');
const chalk = require('chalk');
const { promisify } = require('util');
const { exec } = require('child_process');
const execute = promisify(exec);

const logger = {
  error: err => {
    console.error(`[ ${chalk.red('✗')} ]`, chalk.red('ERROR: '), err);
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

const handleError = (action = 'building') => err => {
  console.error(`🙈 There was an error ${action} -----------------> ${err}`);
  process.exit(1);
};

const bumpForRelease = () =>
  execute(`cd ./packages/projectA && npm version major`)
    .then(() => logger.success('Bumped project version'))
    .catch(handleError('bumping project versions'));

(async () => {
  await bumpForRelease();
})();
