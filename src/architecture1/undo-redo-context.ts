import { Command } from '../command';

export class UndoRedoContext {
  private undoStack: (Command | Command[])[] = [];
  private redoStack: (Command | Command[])[] = [];
  private isMultiEvent = false;
  private multiEventCommands: Command[] = [];

  register(command: Command) {
    command.execute();
    if (this.isMultiEvent) {
      this.multiEventCommands.push(command);
    } else {
      this.undoStack.push(command);
      this.redoStack = [];
    }
  }

  undo() {
    const commandOrCommands = this.undoStack.pop();
    if (commandOrCommands) {
      this._undoCommand(commandOrCommands);
      this.redoStack.push(commandOrCommands);
    }
  }

  redo() {
    const commandOrCommands = this.redoStack.pop();
    if (commandOrCommands) {
      this._executeCommand(commandOrCommands);
      this.undoStack.push(commandOrCommands);
    }
  }

  startMultiEvent() {
    this.isMultiEvent = true;
    this.multiEventCommands = [];
  }

  endMultiEvent() {
    if (this.isMultiEvent && this.multiEventCommands.length > 0) {
      this.undoStack.push(this.multiEventCommands);
      this.redoStack = [];
    }
    this.isMultiEvent = false;
    this.multiEventCommands = [];
  }

  private _executeCommand(command: Command | Command[]) {
    if (Array.isArray(command)) {
        command.forEach(c => c.execute());
    } else {
        command.execute();
    }
  }

  private _undoCommand(command: Command | Command[]) {
    if (Array.isArray(command)) {
        for (let i = command.length - 1; i >= 0; i--) {
            command[i].undo();
        }
    } else {
        command.undo();
    }
  }
}