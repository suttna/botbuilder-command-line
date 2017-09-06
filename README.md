![https://suttna.com](logo.png)

# botbuilder-command-line [![npm version](https://badge.fury.io/js/botbuilder-command-line.svg)](https://badge.fury.io/js/botbuilder-command-line) [![CircleCI](https://circleci.com/gh/suttna/botbuilder-command-line.svg?style=svg)](https://circleci.com/gh/suttna/botbuilder-command-line)

botbuilder-command-line makes really easy the creation of command line tools for your BotBuilder bot.

Features:

- Nice DSL for creating command line dialogs
- Arguments and options parsing
- Configurable authentication for command

## Install

```
yarn add botbuilder-command-line
```

> This library was only tested in Slack. It should work in other channels too.

## Usage

```javascript
const { UniversalBot } = require('botbuilder')
const { CommandLineLibrary } = require('botbuilder-command-line')

const bot = new UniversalBot(connector)

const lib = new CommandLineLibrary("operations", {
  isAuthorized: async (user) => {
    return user.id === process.env.SUPER_USER_ID
  },
})

lib.command("list-active-dialogs", {
  description: "List the active dialogs",
  handler: async (session, context) => {
    const activeDialogs = await DialogRepository.activeDialog()

    session.endDialog(formatDialogList(activeDialogs))
  },
})

lib.command("destroy-dialog", {
  description: "Destroy the given dialog.",
  options: [
    {
      name: "id",
      description: "The dialog identifier",
      required: true,
    },
  ],
  handler: async (session, context) => {
    await DialogRepository.destroy(context.options.id)

    session.endDialog('I have destroy your dialog')
  }
})

bot.library(lib)
```

We have created a new CommandLineLibrary with the name operations. `operations` will be the name to use when invoking a command. The `operations` CommandLineLibrary will only be triggered if a recognizer emits the `operations` intent. This means you will need to create a custom recognizer in your bot and emit the `operations` intent yourself.

This will look like this probably:

```javascript
bot.recognize({
  recognize: (context, done) => {
    if (context.message.text.startsWith('operations')) {
      done(null, { score: 1.0, intent: 'operations' })
    } else {
      done(null, { score: 0.0 })
    }
  }
})
```

> We are going to move this logic inside the library to make the library experience more friendly.

After adding the previous recognizer you can now invoke the command like this:

```
operations list-active-dialogs

or

operations destroy-dialog --id 10
```
## Todo

- [ ] Implement recognizer inside library
- [ ] Add boolean flags

## Contact

- Martín Ferández <martin@suttna.com>
- Santiago Doldán <santiago@suttna.com>
