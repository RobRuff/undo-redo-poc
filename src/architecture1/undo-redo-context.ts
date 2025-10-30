
import { Command } from '../command';

export class UndoRedoContext {
  private undoStack: (Command | Command[])[] = [];
  private redoStack: (Command | Command[])[] = [];
  private isMultiEvent = false;
  private multiEventCommands: Command[] = [];

  register(command: Command) {
    if (this.isMultiEvent) {
      this.multiEventCommands.push(command);
    } else {
      this.undoStack.push(command);
      this.redoStack = [];
    }
    command.execute();
  }

  undo() {
    const commandOrCommands = this.undoStack.pop();
    if (commandOrCommands) {
      if (Array.isArray(commandOrCommands)) {
        for (let i = commandOrCommands.length - 1; i >= 0; i--) {
          commandOrCommands[i].undo();
        }
      } else {
        commandOrCommands.undo();
      }
      this.redoStack.push(commandOrCommands);
    }
  }

  redo() {
    const commandOrCommands = this.redoStack.pop();
    if (commandOrCommands) {
      if (Array.isArray(commandOrCommands)) {
        commandOrCommands.forEach(command => command.execute());
      } else {
        commandOrCommands.execute();
      }
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
}
