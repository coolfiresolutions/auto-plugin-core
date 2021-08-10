# Core Plugin

Post your release notes to a new Core session.

![Example core release notes]()

## Installation

This plugin is not included with the `auto` CLI installed via NPM. To install:

```bash
npm i --save-dev @coolfiresolutions/auto-plugin-core
# or
yarn add -D @coolfiresolutions/auto-plugin-core
```

## Usage

### Configuration

There are a few options that are required:

```jsonc
{
  "plugins": [
    // Set the `CORE_TOKEN` variable on your environment.
    [
      "core",
      {
        // Set the workspace to your workspace name
        "workspace": "myCompany",
        // Set the network to the network id you want the session created in
        "network": "11111111-1111-1111-1111-111111111111",
        // Set the sessionType to the sessionType id you want to create
        "sessionType": "22222222-2222-2222-2222-222222222222"
      }
    ]
  ]
}
```

## Options

### workspace - **Required**

The name of the Core workspace to post to. (e.g. "myCompany")

```jsonc
{
  "plugins": [
    [
      "core",
      {
        "workspace": "myCompany",
        "network": "11111111-1111-1111-1111-111111111111",
        "sessionType": "22222222-2222-2222-2222-222222222222"
      }
    ]
  ]
}
```

### network - **Required**

The networkId in your Core workspace to post to. (e.g. "11111111-1111-1111-1111-111111111111")

```jsonc
{
  "plugins": [
    [
      "core",
      {
        "workspace": "myCompany",
        "network": "11111111-1111-1111-1111-111111111111",
        "sessionType": "22222222-2222-2222-2222-222222222222"
      }
    ]
  ]
}
```

### sessionType - **Required**

The sessionType in your Core workspace to post to. (e.g. "22222222-2222-2222-2222-222222222222")

```jsonc
{
  "plugins": [
    [
      "core",
      {
        "workspace": "myCompany",
        "network": "11111111-1111-1111-1111-111111111111",
        "sessionType": "22222222-2222-2222-2222-222222222222"
      }
    ]
  ]
}
```

### title

Defaults to `New Release(s):`.

Prefix to be used before the version(s) in the session name. The new version(s) will be appended to the title. (i.e "New Release v1.0.0")

```jsonc
{
  "plugins": [
    [
      "core",
      {
        "workspace": "myCompany",
        "network": "11111111-1111-1111-1111-111111111111",
        "sessionType": "22222222-2222-2222-2222-222222222222",
        // Customize the session name
        "title": "My App:"
      }
    ]
  ]
}
```

### publishPreRelease

Defaults to `false`.

If you are using a `prerelease` branch like `next`, Core will not post a new session by default.
This is done to avoid spamming your consumers every time you make a preview release.
However, if you would like to configure it such that Core _does_ post on prerelease, you can add the `publishPreRelease` to your `.autorc` like so:

```jsonc
{
  "plugins": [
    [
      "core",
      {
        "workspace": "myCompany",
        "network": "11111111-1111-1111-1111-111111111111",
        "sessionType": "22222222-2222-2222-2222-222222222222",
        // Publish Pre-Releases
        "publishPreRelease": true
      }
    ]
  ]
}
```

## Creating a Core workspace

You can easily get started with a Core workspace at [accounts.coolfirecore.io/create](https://accounts.coolfirecore.io/create)
