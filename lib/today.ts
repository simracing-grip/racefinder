// Today as a UTC YYYY-MM-DD — the format calendar dates use, so "upcoming"
// is a plain string comparison. Client components should use useToday()
// (components/Time/TodayProvider.tsx) instead, so hydration stays consistent.
export const todayUtc = () => new Date().toISOString().slice(0, 10);
