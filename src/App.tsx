// ============================================================
// [START: Корневой компонент приложения]
// При монтировании загружает настройки и задачи, применяет тему,
// регистрирует горячие клавиши. Поверх основного экрана живут
// модальные слои: онбординг, форма, детали, подтверждение.
// ============================================================
import { useEffect } from 'react';
import { useTasksStore } from './store/tasksStore';
import { useSettingsStore } from './store/settingsStore';
import { useUiStore } from './store/uiStore';
import { useTheme } from './hooks/useTheme';
import { useHotkeys } from './hooks/useHotkeys';
import { TitleBar } from './components/TitleBar';
import { ToastStack } from './components/Toast';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { OnboardingModal } from './components/OnboardingModal';
import { BoardPage } from './pages/BoardPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const loadTasks = useTasksStore((s) => s.load);
  const loadSettings = useSettingsStore((s) => s.load);
  const settingsOpen = useUiStore((s) => s.settingsOpen);

  useEffect(() => {
    void loadSettings();
    void loadTasks();
  }, [loadSettings, loadTasks]);

  useTheme();
  useHotkeys();

  return (
    <div className="app-shell">
      <TitleBar />
      <main className="app-body">{settingsOpen ? <SettingsPage /> : <BoardPage />}</main>

      {/* Слои поверх интерфейса */}
      <ToastStack />
      <OnboardingModal />
      <TaskFormModal />
      <TaskDetailModal />
      <ConfirmDialog />
    </div>
  );
}
// ============================================================
// [END: Корневой компонент приложения]
// ============================================================
