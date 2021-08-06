import Auto from '@auto-it/core'
import makeCommitFromMsg from '@auto-it/core/dist/__tests__/make-commit-from-msg'
import { dummyLog } from '@auto-it/core/dist/utils/logger'
import { makeHooks } from '@auto-it/core/dist/utils/make-hooks'
import { defaultLabels } from '@auto-it/core/dist/semver'
import { RestEndpointMethodTypes } from '@octokit/rest'
import { execSync } from 'child_process'

import CorePlugin from '../src'
import marked from 'marked'

const fetchSpy = jest.fn()
jest.mock('node-fetch', () => (...args: any[]) => {
  fetchSpy(...args)
})

beforeEach(() => {
  fetchSpy.mockClear()
})

type ReleaseResponse = RestEndpointMethodTypes['repos']['createRelease']['response']

const mockResponse: ReleaseResponse[] = [
  {
    data: {
      html_url: 'https://git.hub/some/project/releases/v1.0.0',
      name: 'v1.0.0',
      tag_name: 'v1.0.0',
    },
  } as unknown as ReleaseResponse,
]

const defaultPluginOptions = {
  workspace: 'foo',
  network: '1-1-1-1',
  sessionType: '1234',
}

// For the purpose of this test, we use the current branch as the "prerelease" branch to fake being on a "next" branch
const nextBranch = execSync('git rev-parse --abbrev-ref HEAD', {
  encoding: 'utf8',
}).trim()

const mockAuto = {
  git: {},
  logger: dummyLog(),
} as any

describe('postToCore', () => {
  test("doesn't post without a new version", async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({ hooks } as Auto)

    await hooks.afterRelease.promise({
      lastRelease: '0.1.0',
      commits: [],
      releaseNotes: '# My Notes',
    })

    expect(plugin.createSession).not.toHaveBeenCalled()
  })

  test("doesn't post without commits", async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({ hooks, options: {} } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [],
      releaseNotes: '# My Notes',
    })

    expect(plugin.createSession).not.toHaveBeenCalled()
  })

  test("doesn't post with skip release label", async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({
      hooks,
      options: {},
      config: { labels: defaultLabels },
    } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('skipped', { labels: ['skip-release'] })],
      releaseNotes: '# My Notes',
    })

    expect(plugin.createSession).not.toHaveBeenCalled()
  })

  test("doesn't post without a workspace", async () => {
    const plugin = new CorePlugin({ workspace: undefined })
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({ hooks, options: {} } as Auto)

    await expect(
      hooks.afterRelease.promise({
        newVersion: '1.0.0',
        lastRelease: '0.1.0',
        commits: [makeCommitFromMsg('a patch')],
        releaseNotes: '# My Notes',
      }),
    ).rejects.toBeInstanceOf(Error)
  })

  test("doesn't post without a network id", async () => {
    const plugin = new CorePlugin({ workspace: defaultPluginOptions.workspace, network: undefined })
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({ hooks, options: {} } as Auto)

    await expect(
      hooks.afterRelease.promise({
        newVersion: '1.0.0',
        lastRelease: '0.1.0',
        commits: [makeCommitFromMsg('a patch')],
        releaseNotes: '# My Notes',
      }),
    ).rejects.toBeInstanceOf(Error)
  })
  test("doesn't post without a sessionType id", async () => {
    const plugin = new CorePlugin({ ...defaultPluginOptions, sessionType: undefined })
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({ hooks, options: {} } as Auto)

    await expect(
      hooks.afterRelease.promise({
        newVersion: '1.0.0',
        lastRelease: '0.1.0',
        commits: [makeCommitFromMsg('a patch')],
        releaseNotes: '# My Notes',
      }),
    ).rejects.toBeInstanceOf(Error)
  })

  test("doesn't post when prerelease branch and using default prereleasePublish setting", async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({
      ...mockAuto,
      hooks,
      options: {},
      config: {
        prereleaseBranches: [nextBranch],
        labels: defaultLabels,
      },
    } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test("doesn't post when prerelease branch setting is false", async () => {
    const plugin = new CorePlugin({
      ...defaultPluginOptions,
      publishPreRelease: false,
    })
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({
      ...mockAuto,
      hooks,
      options: {},
      config: {
        prereleaseBranches: [nextBranch],
        labels: defaultLabels,
      },
    } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes',
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('posts when prerelease branch setting is true', async () => {
    const plugin = new CorePlugin({
      ...defaultPluginOptions,
      publishPreRelease: true,
    })
    const hooks = makeHooks()

    jest.spyOn(plugin, 'createSession').mockImplementation()
    plugin.apply({
      ...mockAuto,
      hooks,
      options: {},
      config: { prereleaseBranches: ['next'], labels: defaultLabels },
    } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes',
      response: mockResponse,
    })
    expect(plugin.createSession).toHaveBeenCalledTimes(1)
  })

  test('should warn when no token', async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    const logger = dummyLog()
    jest.spyOn(logger.verbose, 'warn').mockImplementation()
    process.env.CORE_TOKEN = ''

    await plugin.createSession(
      { ...mockAuto, logger } as Auto,
      'New Releases: 1.0.0',
      marked('# My Notes\n- PR [some link](google.com)'),
      [{ data: { tag_name: '1.0.0', html_url: 'https://google.com' } }] as ReleaseResponse[],
    )

    expect(logger.verbose.warn).toHaveBeenCalled()
  })

  test('should call core api with minimal config', async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    process.env.CORE_TOKEN = 'MY_TOKEN'

    await plugin.createSession(mockAuto, 'New Releases: 1.0.0', marked('# My Notes\n- PR [some link](google.com)'), [
      { data: { tag_name: '1.0.0', html_url: 'https://google.com' } },
    ] as ReleaseResponse[])

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://foo.coolfirecore.io/core/graphql')
    expect(options.headers.ApplicationLink).toEqual(process.env.CORE_TOKEN)
    expect(JSON.parse(options.body)).toMatchSnapshot()
  })

  test('should call core api', async () => {
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()
    process.env.SLACK_TOKEN = 'MY_TOKEN'
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)',
      response: mockResponse,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://foo.coolfirecore.io/core/graphql')
    expect(options.headers.ApplicationLink).toEqual(process.env.CORE_TOKEN)
    expect(JSON.parse(options.body)).toMatchSnapshot()
  })

  test('should call core api with custom title', async () => {
    const plugin = new CorePlugin({ ...defaultPluginOptions, title: 'Web' })
    const hooks = makeHooks()
    process.env.SLACK_TOKEN = 'MY_TOKEN'
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)',
      response: mockResponse,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://foo.coolfirecore.io/core/graphql')
    expect(options.headers.ApplicationLink).toEqual(process.env.CORE_TOKEN)
    expect(JSON.parse(options.body)).toMatchSnapshot()
  })

  test('should call core api in workspace env var', async () => {
    process.env.CORE_WORKSPACE = 'bar'
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()
    process.env.SLACK_TOKEN = 'MY_TOKEN'
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)',
      response: mockResponse,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://bar.coolfirecore.io/core/graphql')
    expect(options.headers.ApplicationLink).toEqual(process.env.CORE_TOKEN)
    expect(JSON.parse(options.body)).toMatchSnapshot()
  })

  test('should call core api in network env var', async () => {
    process.env.CORE_NETWORK = '2-2-2-2'
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()
    process.env.SLACK_TOKEN = 'MY_TOKEN'
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)',
      response: mockResponse,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://bar.coolfirecore.io/core/graphql')
    expect(options.headers.ApplicationLink).toEqual(process.env.CORE_TOKEN)
    expect(JSON.parse(options.body)).toMatchSnapshot()
  })

  test('should call core api in sessionType env var', async () => {
    process.env.CORE_SESSIONTYPE = 'baz'
    const plugin = new CorePlugin(defaultPluginOptions)
    const hooks = makeHooks()
    process.env.SLACK_TOKEN = 'MY_TOKEN'
    plugin.apply({ hooks, options: {}, ...mockAuto } as Auto)

    await hooks.afterRelease.promise({
      newVersion: '1.0.0',
      lastRelease: '0.1.0',
      commits: [makeCommitFromMsg('a patch')],
      releaseNotes: '# My Notes\n- PR [some link](google.com)',
      response: mockResponse,
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, options] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://bar.coolfirecore.io/core/graphql')
    expect(options.headers.ApplicationLink).toEqual(process.env.CORE_TOKEN)
    expect(JSON.parse(options.body)).toMatchSnapshot()
  })
})
