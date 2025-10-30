import { Command } from '../command';

interface TimedCommand {
  command: Command | Command[];
  timestamp: number;
}

export class UndoRedoContextTree {
  private undoStack: TimedCommand[] = [];
  private redoStack: TimedCommand[] = [];
  private isMultiEvent = false;
  private multiEventCommands: Command[] = [];

  private parent: UndoRedoContextTree | null = null;
  private children: UndoRedoContextTree[] = [];

  constructor(parent: UndoRedoContextTree | null = null) {
    if (parent) {
      this.parent = parent;
      parent.children.push(this);
    }
  }

  register(command: Command) {
    command.execute();
    if (this.isMultiEvent) {
      this.multiEventCommands.push(command);
    } else {
      this.undoStack.push({ command, timestamp: Date.now() });
      this.getRoot().clearRedoStack();
    }
  }

  undo() {
    const latestNode = this.findLatestUndoable();
    if (latestNode) {
      const commandToUndo = latestNode.undoStack.pop();
      if (commandToUndo) {
        this._undoCommand(commandToUndo.command);
        latestNode.redoStack.push(commandToUndo);
      }
    }
  }

  redo() {
    const latestNode = this.findLatestRedoable();
    if (latestNode) {
      const commandToRedo = latestNode.redoStack.pop();
      if (commandToRedo) {
        this._executeCommand(commandToRedo.command);
        latestNode.undoStack.push(commandToRedo);
      }
    }
  }

  startMultiEvent() {
    this.isMultiEvent = true;
    this.multiEventCommands = [];
  }

  endMultiEvent() {
    if (this.isMultiEvent && this.multiEventCommands.length > 0) {
      this.undoStack.push({ command: this.multiEventCommands, timestamp: Date.now() });
      this.getRoot().clearRedoStack();
    }
    this.isMultiEvent = false;
    this.multiEventCommands = [];
  }

  private findLatestUndoable(): UndoRedoContextTree | null {
    const allNodes = this.getRoot().getAllNodes();
    let latestCommand: TimedCommand | null = null;
    let latestNode: UndoRedoContextTree | null = null;

    for (const node of allNodes) {
      if (node.undoStack.length > 0) {
        const lastCommand = node.undoStack[node.undoStack.length - 1];
        if (!latestCommand || lastCommand.timestamp > latestCommand.timestamp) {
          latestCommand = lastCommand;
          latestNode = node;
        }
      }
    }

    return latestNode;
  }

  private findLatestRedoable(): UndoRedoContextTree | null {
    const allNodes = this.getRoot().getAllNodes();
    let latestCommand: TimedCommand | null = null;
    let latestNode: UndoRedoContextTree | null = null;

    for (const node of allNodes) {
      if (node.redoStack.length > 0) {
        const lastCommand = node.redoStack[node.redoStack.length - 1];
        if (!latestCommand || lastCommand.timestamp > latestCommand.timestamp) {
          latestCommand = lastCommand;
          latestNode = node;
        }
      }
    }

    return latestNode;
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

  private getRoot(): UndoRedoContextTree {
    let current: UndoRedoContextTree = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  private getAllNodes(): UndoRedoContextTree[] {
    const nodes: UndoRedoContextTree[] = [this];
    for (const child of this.children) {
      nodes.push(...child.getAllNodes());
    }
    return nodes;
  }

  private clearRedoStack() {
    this.redoStack = [];
    for (const child of this.children) {
      child.clearRedoStack();
    }
  }
}