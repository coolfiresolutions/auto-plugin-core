/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { RestEndpointMethodTypes } from '@octokit/rest'

import { Auto, IPlugin, getCurrentBranch, validatePluginConfiguration } from '@auto-it/core'
import marked from 'marked'
import fetch, { HeadersInit } from 'node-fetch'
import * as t from 'io-ts'

type ReleaseResponse = RestEndpointMethodTypes['repos']['createRelease']['response']

const basePluginOptions = t.partial({
  /** URL of the slack to post to */
  workspace: t.string,
  /** Which network should this belong to */
  network: t.string,
  /** What type of session to create */
  sessionType: t.string,
  /** Allow users to opt into having prereleases posted to slack */
  publishPreRelease: t.boolean,
  /** Additional Title to add at the start of the slack message */
  title: t.string,
})

const pluginOptions = basePluginOptions

export type ICorePluginOptions = t.TypeOf<typeof pluginOptions>

/** Post your release notes to a Core session during `auto release` */
export default class CorePlugin implements IPlugin {
  /** The name of the plugin */
  name = 'core'

  /** The options of the plugin */
  readonly options: ICorePluginOptions

  /** Initialize the plugin with it's options */
  constructor(options: ICorePluginOptions = {}) {
    this.options = {
      ...options,
      workspace: process.env.CORE_WORKSPACE || options.workspace || '',
      network: process.env.CORE_NETWORK || options.network || '',
      sessionType: process.env.CORE_SESSIONTYPE || options.sessionType || '',
      publishPreRelease: Boolean(options.publishPreRelease),
    }
  }

  /** Tap into auto plugin points. */
  apply(auto: Auto): void {
    auto.hooks.validateConfig.tapPromise(this.name, async (name, options) => {
      // If it's a string thats valid config
      if (name === this.name && typeof options !== 'string') {
        return validatePluginConfiguration(this.name, pluginOptions, options)
      }
    })

    auto.hooks.afterRelease.tapPromise(this.name, async ({ newVersion, commits, releaseNotes, response }) => {
      // Avoid publishing on prerelease branches by default, but allow folks to opt in if they care to
      const currentBranch = getCurrentBranch()
      if (
        currentBranch &&
        auto.config?.prereleaseBranches?.includes(currentBranch) &&
        !this.options.publishPreRelease
      ) {
        return
      }

      if (!newVersion) {
        return
      }

      const head = commits[0]

      if (!head) {
        return
      }

      const skipReleaseLabels = (auto.config?.labels.filter((l) => l.releaseType === 'skip') || []).map((l) => l.name)
      const isSkipped = head.labels.find((label) => skipReleaseLabels.includes(label))

      if (isSkipped) {
        return
      }

      if (!this.options.workspace) {
        throw new Error(`${this.name} workspace must be set to create a new session in core.`)
      }
      if (!this.options.network) {
        throw new Error(`${this.name} network must be set to create a new session in core.`)
      }
      if (!this.options.sessionType) {
        throw new Error(`${this.name} sessionType must be set to create a new session in core.`)
      }

      const releases = (Array.isArray(response) && response) || (response && [response]) || []
      const header = `${this.options.title || `New Release${releases.length > 1 ? 's' : ''}:`} ${releases
        .map((r) => r.data.tag_name)
        .join(', ')}`

      await this.createSession(auto, header, marked(releaseNotes), releases)
    })
  }

  /** Creating new session in core with release notes */
  // eslint-disable-next-line max-params
  async createSession(auto: Auto, name: string, releaseNotes: string, releases: ReleaseResponse[]): Promise<void> {
    if (!auto.git) {
      return
    }

    auto.logger.verbose.info('Creating new session in core with release notes.')

    const token = process.env.CORE_TOKEN

    if (!token) {
      auto.logger.verbose.warn('Core needs a token to create a new session')
    }

    const urls = releases.map(
      (release) => `*[${release.data.name || release.data.tag_name}](${release.data.html_url})*`,
    )
    const releaseUrl = urls.length > 1 ? urls.join(', ') : `[View Release](${releases[0].data.html_url})`

    const description = [releaseUrl, releaseNotes].join('\n')

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await fetch(`https://${this.options.workspace!}.coolfirecore.io/core/graphql `, {
      method: 'POST',
      body: JSON.stringify({
        query: 'mutation($sessionInput:CreateSessionInput!){createSession(input:$sessionInput){entity{id}}}',
        variables: {
          sessionInput: {
            name,
            description,
            network: this.options.network,
            sessType: this.options.sessionType,
          },
        },
      }),
      headers: {
        ApplicationLink: token,
        'Content-Type': 'application/json',
      } as HeadersInit,
    })

    auto.logger.verbose.info('Created a new session in core.')
  }
}
