
import { Command } from '../command';
import { UndoRedoContext } from './undo-redo-context';

export class UndoCoordinator {
  private contexts: Map<string, UndoRedoContext> = new Map();
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  createContext(contextId: string) {
    if (!this.contexts.has(contextId)) {
      this.contexts.set(contextId, new UndoRedoContext());
    }
  }

  getContext(contextId: string): UndoRedoContext | undefined {
    return this.contexts.get(contextId);
  }

  register(contextId: string, command: Command) {
    const context = this.getContext(contextId);
    if (context) {
      context.register(command);
      this.undoStack.push(contextId);
      this.redoStack = [];
    }
  }

  undo() {
    const contextId = this.undoStack.pop();
    if (contextId) {
      const context = this.getContext(contextId);
      if (context) {
        context.undo();
        this.redoStack.push(contextId);
      }
    }
  }

  redo() {
    const contextId = this.redoStack.pop();
    if (contextId) {
      const context = this.getContext(contextId);
      if (context) {
        context.redo();
        this.undoStack.push(contextId);
      }
    }
  }

  startMultiEvent(contextId: string) {
    const context = this.getContext(contextId);
    if (context) {
      context.startMultiEvent();
    }
  }

  endMultiEvent(contextId: string) {
    const context = this.getContext(contextId);
    if (context) {
      context.endMultiEvent();
      this.undoStack.push(contextId);
      this.redoStack = [];
    }
  }
}
