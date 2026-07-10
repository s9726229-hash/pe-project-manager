import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { useTasks } from '../hooks/useTasks';
import type { useProjects } from '../hooks/useProjects';
import { DEFAULT_PROJECT_ID } from '../hooks/useProjects';
import { flattenTaskLeaves } from '../services/taskUtils';
import { flattenLeaves } from '../services/milestoneUtils';

interface CalendarProps {
  tasksApi: ReturnType<typeof useTasks>;
  projectsApi: ReturnType<typeof useProjects>;
}

interface CalendarEntry {
  kind: 'task' | 'milestone';
  label: string;
  projectName?: string;
  done: boolean;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar({ tasksApi, projectsApi }: CalendarProps) {
  const { tasks } = tasksApi;
  const { projects } = projectsApi;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11

  const todayStr = now.toISOString().slice(0, 10);

  // 收集這個月每一天的項目：Task 用預計完成日、Milestone 用預計完成日（葉節點）。
  const entriesByDate = new Map<string, CalendarEntry[]>();

  function push(date: string, entry: CalendarEntry) {
    if (!entriesByDate.has(date)) entriesByDate.set(date, []);
    entriesByDate.get(date)!.push(entry);
  }

  for (const t of flattenTaskLeaves(tasks)) {
    if (t.dueDate) {
      push(t.dueDate, { kind: 'task', label: t.title, done: t.status === '已完成' });
    }
  }

  for (const p of projects) {
    if (p.id === DEFAULT_PROJECT_ID) continue;
    if (p.status === '取消') continue;
    for (const leaf of flattenLeaves(p.milestones)) {
      if (leaf.plannedDate) {
        push(leaf.plannedDate, { kind: 'milestone', label: leaf.name, projectName: p.name, done: leaf.status === '已完成' });
      }
    }
  }

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">行事曆</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="text-slate-400 hover:text-slate-200 p-1">
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-medium w-32 text-center">
            {year} 年 {month + 1} 月
          </span>
          <button onClick={nextMonth} className="text-slate-400 hover:text-slate-200 p-1">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary-400 inline-block" /> 待辦事項
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 專案里程碑
        </span>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-800 border border-slate-800 rounded-xl overflow-hidden">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="bg-slate-900 text-center text-xs text-slate-400 py-2">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="bg-slate-950 min-h-[7rem]" />;
          const dateStr = toDateStr(year, month, day);
          const entries = entriesByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          return (
            <div key={dateStr} className={`bg-slate-950 min-h-[7rem] p-1.5 ${isToday ? 'ring-1 ring-inset ring-primary-500' : ''}`}>
              <div className={`text-xs mb-1 ${isToday ? 'text-primary-400 font-semibold' : 'text-slate-500'}`}>{day}</div>
              <div className="space-y-0.5">
                {entries.slice(0, 4).map((e, j) => (
                  <div
                    key={j}
                    className={`text-[11px] leading-tight px-1 py-0.5 rounded truncate ${
                      e.done
                        ? 'text-slate-600 line-through'
                        : e.kind === 'task'
                          ? 'bg-primary-500/15 text-primary-300'
                          : 'bg-amber-500/15 text-amber-300'
                    }`}
                    title={e.projectName ? `${e.projectName}：${e.label}` : e.label}
                  >
                    {e.label}
                  </div>
                ))}
                {entries.length > 4 && <div className="text-[10px] text-slate-500 px-1">+{entries.length - 4} 更多</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
