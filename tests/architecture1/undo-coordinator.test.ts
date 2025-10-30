
import { UndoCoordinator } from '../../src/architecture1/undo-coordinator';
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

describe('UndoCoordinator', () => {
  let coordinator: UndoCoordinator;
  const contextId1 = 'context1';
  const contextId2 = 'context2';

  beforeEach(() => {
    coordinator = new UndoCoordinator();
    coordinator.createContext(contextId1);
    coordinator.createContext(contextId2);
  });

  it('should register and execute a command', () => {
    const command = new MockCommand();
    coordinator.register(contextId1, command);
    expect(command.executed).toBe(true);
  });

  it('should undo a command', () => {
    const command = new MockCommand();
    coordinator.register(contextId1, command);
    coordinator.undo();
    expect(command.undone).toBe(true);
  });

  it('should redo a command', () => {
    const command = new MockCommand();
    coordinator.register(contextId1, command);
    coordinator.undo();
    coordinator.redo();
    expect(command.executed).toBe(true);
  });

  it('should handle commands from multiple contexts', () => {
    const command1 = new MockCommand();
    coordinator.register(contextId1, command1);

    const command2 = new MockCommand();
    coordinator.register(contextId2, command2);

    coordinator.undo(); // should undo command2
    expect(command2.undone).toBe(true);
    expect(command1.undone).toBe(false);

    coordinator.undo(); // should undo command1
    expect(command1.undone).toBe(true);
  });

  it('should group commands in a multi-event', () => {
    const command1 = new MockCommand();
    const command2 = new MockCommand();

    coordinator.startMultiEvent(contextId1);
    coordinator.register(contextId1, command1);
    coordinator.register(contextId1, command2);
    coordinator.endMultiEvent(contextId1);

    coordinator.undo();

    expect(command1.undone).toBe(true);
    expect(command2.undone).toBe(true);

    coordinator.redo();

    expect(command1.executed).toBe(true);
    expect(command2.executed).toBe(true);
  });
});
