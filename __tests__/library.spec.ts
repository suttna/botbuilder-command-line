import "jest"
import { expect } from "chai"

import { BotTester } from "bot-tester"
import { UniversalBot, ConsoleConnector, IIdentity } from 'botbuilder'
import { CommandLineLibrary } from '../src/library'

describe("CommandLineLibrary", () => {
  let bot: UniversalBot
  let connector: ConsoleConnector
  let library: CommandLineLibrary

  beforeEach(() => {
    library = new CommandLineLibrary('test-cmd', {
      isAuthorized: async (user: IIdentity) => user.name == 'user1'
    })

    connector = new ConsoleConnector()
    bot = new UniversalBot(connector)

    bot.recognizer({
      recognize: (context, done) => {
        done(null, { score: 1.0, intent: 'test-cmd' })
      }
    })

    bot.library(library)
  })

  describe("when a required option is missing", () => {
    beforeEach(() => {
      library.command('subcmd', {
        options: [
          {
            name: 'foo_required',
            required: true
          }
        ],
        handler: (session, context) => {
          session.endDialog(context.options.foo + context.options.foo_required)
        }
      })
    })

    it("responds with a syntax error", () => {
      new BotTester(bot)
        .sendMessageToBot('test-cmd subcmd', /.*Syntax error.*/)
        .runTest()
    })
  })

  describe("when all required option are present", () => {
    beforeEach(() => {
      library.command('subcmd', {
        options: [
          {
            name: 'foo_required',
            required: true
          }
        ],
        handler: (session, context) => {
          session.send(context.options.foo_required)
        }
      })
    })

    it("responds executes the handler", () => {
      return new BotTester(bot)
        .sendMessageToBot('test-cmd subcmd --foo_required bar', 'bar')
        .runTest()
    })
  })
})
