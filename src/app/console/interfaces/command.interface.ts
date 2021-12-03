export interface ICommand {
    run(argv: string[]): Promise<void | void[]>;
}
