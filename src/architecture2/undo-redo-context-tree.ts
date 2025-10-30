
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
    const root = this.getRoot();
    const allNodes = root.getAllNodes();
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

    if (latestNode && latestCommand) {
      const commandToUndo = latestNode.undoStack.pop();
      if (commandToUndo) {
        if (Array.isArray(commandToUndo.command)) {
          for (let i = commandToUndo.command.length - 1; i >= 0; i--) {
            commandToUndo.command[i].undo();
          }
        } else {
          commandToUndo.command.undo();
        }
        latestNode.redoStack.push(commandToUndo);
      }
    }
  }

  redo() {
    const root = this.getRoot();
    const allNodes = root.getAllNodes();
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

    if (latestNode && latestCommand) {
      const commandToRedo = latestNode.redoStack.pop();
      if (commandToRedo) {
        if (Array.isArray(commandToRedo.command)) {
            commandToRedo.command.forEach(c => c.execute());
        } else {
            commandToRedo.command.execute();
        }
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
