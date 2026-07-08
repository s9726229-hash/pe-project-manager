import type { Milestone } from '../../types';
import { flattenLeaves, getMilestoneDateRange, isGroupMilestone } from '../../services/milestoneUtils';

interface GanttViewProps {
  milestones: Milestone[];
}

function parseDate(s: string): number {
  return new Date(s).getTime();
}

interface Row {
  label: string;
  depth: number;
  start?: string;
  end?: string;
  done: boolean;
}

function buildRows(milestones: Milestone[], depth = 0): Row[] {
  const rows: Row[] = [];
  for (const m of milestones) {
    const range = getMilestoneDateRange(m);
    rows.push({ label: m.name, depth, start: range.start, end: range.end, done: m.status === '已完成' });
    if (isGroupMilestone(m)) rows.push(...buildRows(m.subMilestones!, depth + 1));
  }
  return rows;
}

export default function GanttView({ milestones }: GanttViewProps) {
  const leaves = flattenLeaves(milestones);
  const starts = leaves.map((l) => l.plannedStartDate).filter((d): d is string => !!d).map(parseDate);
  const ends = leaves.map((l) => l.plannedDate).filter((d): d is string => !!d).map(parseDate);

  if (starts.length === 0 || ends.length === 0) {
    return <p className="text-slate-500 text-sm">尚無排程資料。</p>;
  }

  const rangeStart = Math.min(...starts);
  const rangeEnd = Math.max(...ends);
  const totalMs = Math.max(rangeEnd - rangeStart, 1);
  const rows = buildRows(milestones);

  return (
    <div className="space-y-1">
      {rows.map((row, i) => {
        if (!row.start || !row.end) {
          return (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ marginLeft: row.depth * 20 }}>
              <span className={row.depth === 0 ? 'font-medium' : 'text-slate-400'}>{row.label}</span>
            </div>
          );
        }
        const left = ((parseDate(row.start) - rangeStart) / totalMs) * 100;
        const width = Math.max(((parseDate(row.end) - parseDate(row.start)) / totalMs) * 100, 0.5);
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`text-xs w-40 shrink-0 truncate ${row.depth === 0 ? 'font-medium text-slate-200' : 'text-slate-400 pl-4'}`}
              title={row.label}
            >
              {row.label}
            </span>
            <div className="flex-1 relative h-5 bg-slate-900 rounded">
              <div
                className={`absolute h-full rounded ${row.done ? 'bg-emerald-500/70' : 'bg-primary-500/70'}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${row.start} ~ ${row.end}`}
              />
            </div>
            <span className="text-xs text-slate-500 w-24 shrink-0">{row.end}</span>
          </div>
        );
      })}
    </div>
  );
}
