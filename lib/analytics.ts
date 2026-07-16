import {
  CLASSIFICATIONS,
  wbsNeedsAction,
  type Assignment,
  type Classification,
  type WbsState,
} from "./types";

export interface ClassStat {
  classification: Classification;
  count: number;
  estimatedHours: number;
  actualHours: number;
}

export interface MemberStat {
  ownerId: string;
  member: string;
  accent: string;
  role: string | null;
  total: number;
  active: number;
  bd: number;
  plusOne: number;
  estimatedHours: number;
  actualHours: number;
  wbsAction: number;
}

export interface PriorityGroup {
  keyPriority: string;
  count: number;
  assignments: Assignment[];
}

export interface Analytics {
  total: number;
  activeCount: number;
  closedCount: number;
  bdCount: number;
  plusOneCount: number;
  projectCount: number;
  estimatedHours: number;
  actualHours: number;
  wbsCounts: Record<WbsState, number>;
  wbsActionCount: number;
  classStats: ClassStat[];
  members: MemberStat[];
  plusOnes: Assignment[];
  endingSoon: Assignment[];
  priorityGroups: PriorityGroup[];
}

export function computeAnalytics(rows: Assignment[]): Analytics {
  const active = rows.filter((a) => a.status === "active");
  const closed = rows.filter((a) => a.status === "closed");
  const plusOnes = rows.filter((a) => a.classification === "plus_one");

  const classStats: ClassStat[] = CLASSIFICATIONS.map((classification) => {
    const ds = rows.filter((a) => a.classification === classification);
    return {
      classification,
      count: ds.length,
      estimatedHours: ds.reduce((s, a) => s + a.estimatedHours, 0),
      actualHours: ds.reduce((s, a) => s + a.actualHours, 0),
    };
  });

  const wbsCounts: Record<WbsState, number> = { yes: 0, pending: 0, no: 0, na: 0 };
  for (const a of rows) wbsCounts[a.wbsProvided] += 1;

  const memberMap = new Map<string, MemberStat>();
  for (const a of rows) {
    let m = memberMap.get(a.member);
    if (!m) {
      m = {
        ownerId: a.ownerId,
        member: a.member,
        accent: a.ownerAccent,
        role: a.role,
        total: 0,
        active: 0,
        bd: 0,
        plusOne: 0,
        estimatedHours: 0,
        actualHours: 0,
        wbsAction: 0,
      };
      memberMap.set(a.member, m);
    }
    m.total += 1;
    if (a.status === "active") m.active += 1;
    if (a.classification === "bd") m.bd += 1;
    if (a.classification === "plus_one") m.plusOne += 1;
    m.estimatedHours += a.estimatedHours;
    m.actualHours += a.actualHours;
    if (wbsNeedsAction(a)) m.wbsAction += 1;
  }

  const endingSoon = rows
    .filter((a) => a.status === "active" && a.endDate && a.endDate !== "TBD")
    .sort((a, b) => new Date(a.endDate as string).getTime() - new Date(b.endDate as string).getTime());

  const priorityMap = new Map<string, Assignment[]>();
  for (const a of plusOnes) {
    const key = a.keyPriority?.trim() || "Unaligned";
    const list = priorityMap.get(key) ?? [];
    list.push(a);
    priorityMap.set(key, list);
  }
  const priorityGroups: PriorityGroup[] = [...priorityMap.entries()]
    .map(([keyPriority, assignments]) => ({ keyPriority, count: assignments.length, assignments }))
    .sort((a, b) => b.count - a.count);

  return {
    total: rows.length,
    activeCount: active.length,
    closedCount: closed.length,
    bdCount: rows.filter((a) => a.classification === "bd").length,
    plusOneCount: plusOnes.length,
    projectCount: rows.filter((a) => a.classification === "project").length,
    estimatedHours: rows.reduce((s, a) => s + a.estimatedHours, 0),
    actualHours: rows.reduce((s, a) => s + a.actualHours, 0),
    wbsCounts,
    wbsActionCount: rows.filter((a) => wbsNeedsAction(a)).length,
    classStats,
    members: [...memberMap.values()].sort((a, b) => b.total - a.total),
    plusOnes,
    endingSoon,
    priorityGroups,
  };
}
