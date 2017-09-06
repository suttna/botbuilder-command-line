import { Dialog, IDialogWaterfallStep, IIdentity, Library, Session } from "botbuilder"
import * as minimist from "minimist"

export type CommandHandler = (session: Session, context: ICommandExecutionContext) => void
export type AuthorizationLookup = (user: IIdentity) => Promise<boolean>

export interface ICommandExecutionContext {
  commandName: string
  args?: string[]
  options?: { [key: string]: string }
}

export interface ICommand {
  name: string
  description?: string
  handler: CommandHandler
  options?: ICommandOption[]
}

export interface ICommandOption {
  name: string
  description?: string
  required?: boolean
}

export interface ICommandOptions {
  handler: CommandHandler
  options?: ICommandOption[]
  description?: string
}

export interface ICommandLineLibrarySettings {
  alias?: string
  isAuthorized?: AuthorizationLookup
}

export class CommandLineLibrary extends Library {
  private commands: ICommand[] = []
  private alias: string
  private isAuthorized?: AuthorizationLookup

  constructor(public name: string, settings?: ICommandLineLibrarySettings) {
    super(name)

    // Set the alias if provided in settings or fallback to the library name
    if (settings) {
      this.alias = settings.alias || name
      this.isAuthorized = settings.isAuthorized
    }

    this
    .dialog(name, this.defaultDialog())
    .triggerAction({
      matches: this.alias,
    })
  }

  /**
   * Add a new command to the library
   */
  public command(name: string, options?: ICommandOptions) {
    this.commands.push({
      name,
      ...options,
    })

    return this
  }

  private defaultDialog(): IDialogWaterfallStep {
    return async (session: Session) => {
      if (!(await this.canPerformCommand(session))) {
        return session.endDialog()
      }

      const [_, subcommand, ...rest] = session.message.text.split(" ")

      const matchedCommand = this.commands.find((x) => x.name === subcommand)

      if (matchedCommand) {
        this.handleCommand(session, matchedCommand, minimist(rest, {
          string: matchedCommand.options ? matchedCommand.options.map((x) => x.name) : [],
        }))
      } else {
        this.showHelp(session)
      }
    }
  }

  private async canPerformCommand(session: Session) {
    if (this.isAuthorized) {
      return this.isAuthorized(session.message.address.user)
    } else {
      return true
    }
  }

  private handleCommand(session: Session, command: ICommand, parsedArgs: minimist.ParsedArgs) {
    const options: { [key: string]: string } = parsedArgs

    if (command.options) {
      const missingRequiredOptions = command.options.filter((x) => {
        return x.required && (!parsedArgs[x.name] || parsedArgs[x.name] === "")
      })

      if (missingRequiredOptions.length > 0) {
        return this.handleMissingOptions(session, command, missingRequiredOptions)
      }
    }

    command.handler(session, {
      commandName: command.name,
      args: parsedArgs._,
      options,
    })
  }

  private showHelp(session: Session) {
    const title = `**@${session.message.address.bot.name} ${this.alias}** [subcommand]\n\n`

    const message = this.commands.reduce((text, command) => {
      const description = command.description || ""

      return text + `> __${command.name}__ - ${description}\n\n`
    }, title)

    session.endDialog(message)
  }

  private handleMissingOptions(session: Session, command: ICommand, missingOptions: ICommandOption[]) {
    const title = `**Syntax error for command \`${command.name}\`**\n\n`

    const message = missingOptions.reduce((text, option) => {
      return text + `- Missing required option: ${option.name}`
    }, title)

    session.endDialog(message)
  }
}
