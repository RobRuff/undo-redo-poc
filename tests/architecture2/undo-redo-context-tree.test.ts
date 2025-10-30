
import { UndoRedoContextTree } from '../../src/architecture2/undo-redo-context-tree';
import { Command } from '../../src/command';

class MockCommand implements Command {
  public executed = false;
  public undone = false;

  execute(): void {
    this.executed = true;
    this.undone = false;
  }

  undo(): void {
    this.executed = false;
    this.undone = true;
  }
}

describe('UndoRedoContextTree', () => {
  let root: UndoRedoContextTree;
  let child1: UndoRedoContextTree;
  let child2: UndoRedoContextTree;
  let grandchild1: UndoRedoContextTree;

  beforeEach(() => {
    root = new UndoRedoContextTree();
    child1 = new UndoRedoContextTree(root);
    child2 = new UndoRedoContextTree(root);
    grandchild1 = new UndoRedoContextTree(child1);
  });

  it('should register and execute a command on a specific node', () => {
    const command = new MockCommand();
    child1.register(command);
    expect(command.executed).toBe(true);
    // @ts-ignore
    expect(child1.undoStack.length).toBe(1);
  });

  it('should undo the last command across all contexts from the root', async () => {
    const command1 = new MockCommand();
    child1.register(command1);
    await new Promise(resolve => setTimeout(resolve, 10)); // ensure different timestamps
    const command2 = new MockCommand();
    grandchild1.register(command2);

    root.undo();

    expect(command2.undone).toBe(true);
    expect(command1.undone).toBe(false);
  });

  it('should redo the last undone command across all contexts from the root', async () => {
    const command1 = new MockCommand();
    child1.register(command1);
    await new Promise(resolve => setTimeout(resolve, 10));
    const command2 = new MockCommand();
    grandchild1.register(command2);

    root.undo();
    root.redo();

    expect(command2.executed).toBe(true);
  });

  it('should handle undo and redo from any context in the tree', async () => {
    const command1 = new MockCommand();
    child1.register(command1);
    await new Promise(resolve => setTimeout(resolve, 10));
    const command2 = new MockCommand();
    grandchild1.register(command2);

    // Undoing from a child context should still undo the last command in the whole tree
    child2.undo();
    expect(command2.undone).toBe(true);

    // Redoing from a grandchild context should still redo the last undone command
    grandchild1.redo();
    expect(command2.executed).toBe(true);
  });

  it('should group commands in a multi-event on a specific node', () => {
    const command1 = new MockCommand();
    const command2 = new MockCommand();

    child1.startMultiEvent();
    child1.register(command1);
    child1.register(command2);
    child1.endMultiEvent();

    // @ts-ignore
    expect(child1.undoStack.length).toBe(1);

    root.undo();

    expect(command1.undone).toBe(true);
    expect(command2.undone).toBe(true);

    root.redo();

    expect(command1.executed).toBe(true);
    expect(command2.executed).toBe(true);
  });
});
