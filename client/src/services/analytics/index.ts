import { getDatabase } from '../database';
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  parseISO,
} from 'date-fns';

export interface VolumeDataPoint {
  date: string;
  label: string;
  value: number;
}

export interface CompletionDataPoint {
  date: string;
  label: string;
  completed: number;
  total: number;
  rate: number;
}

export interface PerformanceDataPoint {
  date: string;
  label: string;
  average: number;
  target: number | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
  totalSessions: number;
}

export type TimeRange = '7days' | '30days' | 'thisMonth' | '3months';
export type GroupBy = 'day' | 'week';

// Get date range based on selection
function getDateRange(range: TimeRange): { startDate: Date; endDate: Date } {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  switch (range) {
    case '7days':
      return { startDate: subDays(today, 6), endDate: today };
    case '30days':
      return { startDate: subDays(today, 29), endDate: today };
    case 'thisMonth':
      return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
    case '3months':
      return { startDate: subDays(today, 89), endDate: today };
    default:
      return { startDate: subDays(today, 6), endDate: today };
  }
}

// Get volume over time (total results per day/week)
export async function getVolumeOverTime(
  activityLocalId: string | null,
  range: TimeRange,
  groupBy: GroupBy = 'day'
): Promise<VolumeDataPoint[]> {
  const db = getDatabase();
  const { startDate, endDate } = getDateRange(range);
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  let query = `
    SELECT date, SUM(actual_result) as total
    FROM sessions
    WHERE date >= ? AND date <= ? AND deleted_at IS NULL AND actual_result IS NOT NULL
  `;
  const params: string[] = [startStr, endStr];

  if (activityLocalId) {
    query += ' AND activity_local_id = ?';
    params.push(activityLocalId);
  }

  query += ' GROUP BY date ORDER BY date';

  const rows = await db.getAllAsync<{ date: string; total: number }>(query, params);

  // Create a map of date to value
  const dataMap: Record<string, number> = {};
  rows.forEach(row => {
    dataMap[row.date] = row.total;
  });

  // Generate all dates/weeks in range
  const result: VolumeDataPoint[] = [];

  if (groupBy === 'day') {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      result.push({
        date: dateStr,
        label: format(day, 'MMM d'),
        value: dataMap[dateStr] || 0,
      });
    });
  } else {
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    weeks.forEach(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      let total = 0;

      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      daysInWeek.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        total += dataMap[dateStr] || 0;
      });

      result.push({
        date: format(weekStart, 'yyyy-MM-dd'),
        label: `Week of ${format(weekStart, 'MMM d')}`,
        value: total,
      });
    });
  }

  return result;
}

// Get completion rate over time
export async function getCompletionRate(
  activityLocalId: string | null,
  range: TimeRange,
  groupBy: GroupBy = 'day'
): Promise<CompletionDataPoint[]> {
  const db = getDatabase();
  const { startDate, endDate } = getDateRange(range);
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Get completed sessions
  let completedQuery = `
    SELECT date, COUNT(*) as count
    FROM sessions
    WHERE date >= ? AND date <= ? AND deleted_at IS NULL AND is_completed = 1
  `;
  const completedParams: string[] = [startStr, endStr];

  if (activityLocalId) {
    completedQuery += ' AND activity_local_id = ?';
    completedParams.push(activityLocalId);
  }
  completedQuery += ' GROUP BY date';

  const completedRows = await db.getAllAsync<{ date: string; count: number }>(
    completedQuery,
    completedParams
  );

  // Create map of completed by date
  const completedMap: Record<string, number> = {};
  completedRows.forEach(row => {
    completedMap[row.date] = row.count;
  });

  // Get scheduled activities count per day of week
  let activitiesQuery = `
    SELECT schedule_days FROM activities WHERE deleted_at IS NULL
  `;
  const activitiesParams: string[] = [];

  if (activityLocalId) {
    activitiesQuery = `
      SELECT schedule_days FROM activities WHERE deleted_at IS NULL AND local_id = ?
    `;
    activitiesParams.push(activityLocalId);
  }

  const activities = await db.getAllAsync<{ schedule_days: string }>(
    activitiesQuery,
    activitiesParams
  );

  // Count activities scheduled for each day of week
  const scheduledByDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  activities.forEach(activity => {
    const days = JSON.parse(activity.schedule_days) as number[];
    days.forEach(day => {
      scheduledByDayOfWeek[day]++;
    });
  });

  // Generate results
  const result: CompletionDataPoint[] = [];

  if (groupBy === 'day') {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay();
      const total = scheduledByDayOfWeek[dayOfWeek];
      const completed = completedMap[dateStr] || 0;

      result.push({
        date: dateStr,
        label: format(day, 'MMM d'),
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    });
  } else {
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    weeks.forEach(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      let totalCompleted = 0;
      let totalScheduled = 0;

      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      daysInWeek.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = day.getDay();
        totalScheduled += scheduledByDayOfWeek[dayOfWeek];
        totalCompleted += completedMap[dateStr] || 0;
      });

      result.push({
        date: format(weekStart, 'yyyy-MM-dd'),
        label: `Week of ${format(weekStart, 'MMM d')}`,
        completed: totalCompleted,
        total: totalScheduled,
        rate: totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0,
      });
    });
  }

  return result;
}

// Get performance trend (average result per session)
export async function getPerformanceTrend(
  activityLocalId: string,
  range: TimeRange
): Promise<PerformanceDataPoint[]> {
  const db = getDatabase();
  const { startDate, endDate } = getDateRange(range);
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  // Get the activity's target goal
  const activity = await db.getFirstAsync<{ target_goal: number | null }>(
    'SELECT target_goal FROM activities WHERE local_id = ?',
    [activityLocalId]
  );

  const targetGoal = activity?.target_goal || null;

  // Get sessions with results
  const rows = await db.getAllAsync<{ date: string; actual_result: number }>(
    `SELECT date, actual_result
     FROM sessions
     WHERE activity_local_id = ? AND date >= ? AND date <= ?
       AND deleted_at IS NULL AND actual_result IS NOT NULL
     ORDER BY date`,
    [activityLocalId, startStr, endStr]
  );

  // Create map of results by date
  const resultMap: Record<string, number[]> = {};
  rows.forEach(row => {
    if (!resultMap[row.date]) {
      resultMap[row.date] = [];
    }
    resultMap[row.date].push(row.actual_result);
  });

  // Generate results
  const result: PerformanceDataPoint[] = [];
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const results = resultMap[dateStr] || [];
    const average = results.length > 0
      ? results.reduce((a, b) => a + b, 0) / results.length
      : 0;

    if (results.length > 0) {
      result.push({
        date: dateStr,
        label: format(day, 'MMM d'),
        average: Math.round(average * 10) / 10,
        target: targetGoal,
      });
    }
  });

  return result;
}

// Get comprehensive streak information
export async function getStreakInfo(): Promise<StreakInfo> {
  const db = getDatabase();

  // Get all dates with completed sessions
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM sessions
     WHERE is_completed = 1 AND deleted_at IS NULL
     ORDER BY date DESC`
  );

  if (rows.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedDays: 0,
      totalSessions: 0,
    };
  }

  const dates = rows.map(r => r.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  const todayStr = format(checkDate, 'yyyy-MM-dd');

  // If no session today, start from yesterday
  if (!dates.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (dates.includes(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  // Sort dates ascending for longest streak calculation
  const sortedDates = [...dates].sort();

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = parseISO(sortedDates[i - 1]);
    const currDate = parseISO(sortedDates[i]);
    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Get total sessions count
  const totalResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sessions WHERE is_completed = 1 AND deleted_at IS NULL'
  );

  return {
    currentStreak,
    longestStreak,
    totalCompletedDays: dates.length,
    totalSessions: totalResult?.count || 0,
  };
}

// Get summary statistics for an activity
export async function getActivitySummary(
  activityLocalId: string
): Promise<{
  totalSessions: number;
  completedSessions: number;
  totalVolume: number;
  averagePerSession: number;
  bestResult: number | null;
}> {
  const db = getDatabase();

  const stats = await db.getFirstAsync<{
    total: number;
    completed: number;
    volume: number;
    avg: number;
    best: number | null;
  }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
       COALESCE(SUM(actual_result), 0) as volume,
       COALESCE(AVG(actual_result), 0) as avg,
       MAX(actual_result) as best
     FROM sessions
     WHERE activity_local_id = ? AND deleted_at IS NULL`,
    [activityLocalId]
  );

  return {
    totalSessions: stats?.total || 0,
    completedSessions: stats?.completed || 0,
    totalVolume: stats?.volume || 0,
    averagePerSession: Math.round((stats?.avg || 0) * 10) / 10,
    bestResult: stats?.best || null,
  };
}
