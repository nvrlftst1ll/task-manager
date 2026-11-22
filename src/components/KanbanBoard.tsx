// ============================================================
// [START: Канбан-доска (DndContext + DragOverlay)]
// Перетаскивание Pointer-сенсором (порог 6px отделяет клик от
// drag) и с клавиатуры (Space — старт, стрелки — перемещение,
// Enter — бросить). Drop в колонку = смена статуса через стор.
// ============================================================
import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { STATUSES, type Task, type TaskStatus } from '../types';
import { useTasksStore } from '../store/tasksStore';
import { TaskColumn } from './TaskColumn';
import { TaskCardView } from './TaskCard';

// Space стартует и завершает клавиатурное перетаскивание; Enter
// оставлен карточке (открыть детали), Esc — отмена drag
const KEYBOARD_CODES = {
  start: ['Space'],
  cancel: ['Escape'],
  end: ['Space'],
  up: ['ArrowUp'],
  down: ['ArrowDown'],
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
};

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const moveTask = useTasksStore((s) => s.moveTask);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { keyboardCodes: KEYBOARD_CODES })
  );

  const activeTask = activeTaskId ? (tasks.find((t) => t.id === activeTaskId) ?? null) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const over = event.over;
    if (!over) return;

    const taskId = String(event.active.id);
    const targetStatus = String(over.id) as TaskStatus;
    if (!STATUSES.includes(targetStatus)) return;

    // no-op, если карточку бросили в её же колонку
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      void moveTask(taskId, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTaskId(null)}
    >
      <div className="board">
        {STATUSES.map((status) => (
          <TaskColumn key={status} status={status} tasks={tasks.filter((t) => t.status === status)} />
        ))}
      </div>

      {/* Полупрозрачная копия карточки «в руке» */}
      <DragOverlay>
        {activeTask ? <TaskCardView task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
// ============================================================
// [END: Канбан-доска]
// ============================================================
