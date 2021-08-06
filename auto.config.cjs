// @ts-check
const { SEMVER } = require('@auto-it/core')

/**
 * @type {import('@auto-it/npm').INpmConfig} INpmConfig
 */
const npmOptions = {}

/**
 * Auto Configuration
 * @type {import('auto').AutoRc} AutoRC
 */
const config = {
  plugins: [['npm', npmOptions], 'released'],
  onlyPublishWithReleaseLabel: true,
  labels: [
    {
      name: 'major',
      changelogTitle: '💥 Breaking Change',
      description: 'Increment the major version when merged',
      releaseType: SEMVER.major,
      color: '#C5000B',
    },
    {
      name: 'minor',
      changelogTitle: '🚀 Enhancement',
      description: 'Increment the minor version when merged',
      releaseType: SEMVER.minor,
      color: '#F1A60E',
    },
    {
      name: 'patch',
      changelogTitle: '🐛 Bug Fix',
      description: 'Increment the patch version when merged',
      releaseType: SEMVER.patch,
      color: '#870048',
    },
    {
      name: 'skip-release',
      description: 'Preserve the current version when merged',
      releaseType: 'skip',
      color: '#bf5416',
    },
    {
      name: 'release',
      description: 'Create a release when this pr is merged',
      releaseType: 'release',
      color: '#007f70',
    },
    {
      name: 'internal',
      changelogTitle: '🏠 Internal',
      description: 'Changes only affect the internal code',
      releaseType: 'none',
      color: '#696969',
    },
    {
      name: 'documentation',
      changelogTitle: '📚 Documentation',
      description: 'Changes only affect the documentation',
      releaseType: 'none',
      color: '#cfd3d7',
    },
    {
      name: 'tests',
      changelogTitle: '🚨 Tests',
      description: 'Add or improve existing tests',
      releaseType: 'none',
      color: '#ffd3cc',
    },
    {
      name: 'dependencies',
      changelogTitle: '📌 Dependency Updates',
      description: 'Update one or more dependencies version',
      releaseType: 'none',
      color: '#8732bc',
    },
    {
      name: 'performance',
      changelogTitle: '🏎 Performance',
      description: 'Improve performance of an existing feature',
      releaseType: SEMVER.patch,
      color: '#f4b2d8',
    },
  ],
}

module.exports = config
