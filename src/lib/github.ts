/**
 * GitHub Contributions API Integration
 * 
 * Fetches contribution data from the GitHub contributions API and provides
 * utilities for rendering the data in a grid format similar to GitHub's
 * contribution graph, but with indigo color scale instead of green.
 */

export interface ContributionDay {
  date: string;
  count: number;
  level: number; // 0-4, where 0 is no contributions and 4 is highest
}

export interface ContributionData {
  total: Record<string, number>; // Year totals
  contributions: ContributionDay[];
}

export interface WeekData {
  days: (ContributionDay | null)[]; // Array of 7 days, null for padding
}

/**
 * Fetches GitHub contributions data for a specific user
 */
export async function fetchGitHubContributions(username: string): Promise<ContributionData | null> {
  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ContributionData = await response.json();
    return data;
  } catch (error) {
    console.warn('Failed to fetch GitHub contributions:', error);
    return null;
  }
}

/**
 * Transforms contribution data into a week-by-week grid format
 * Returns the last 52 weeks of data for display
 */
export function transformToWeeklyGrid(contributions: ContributionDay[]): WeekData[] {
  if (!contributions.length) return [];

  // Sort contributions by date (oldest first)
  const sortedContributions = [...contributions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get the last 52 weeks (364 days) or all data if less
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);

  // Filter to get contributions within the date range
  const recentContributions = sortedContributions.filter(contribution => {
    const contributionDate = new Date(contribution.date);
    return contributionDate >= startDate && contributionDate <= today;
  });

  // Create a map for quick lookup
  const contributionMap = new Map<string, ContributionDay>();
  recentContributions.forEach(contribution => {
    contributionMap.set(contribution.date, contribution);
  });

  // Build the weekly grid
  const weeks: WeekData[] = [];
  
  // Find the start of the first week (Sunday before startDate)
  const firstWeekStart = new Date(startDate);
  firstWeekStart.setDate(startDate.getDate() - startDate.getDay());
  
  let currentWeekStart = new Date(firstWeekStart);
  
  // Generate 53 weeks to ensure we cover the full range
  for (let weekIndex = 0; weekIndex < 53; weekIndex++) {
    const week: WeekData = { days: [] };
    
    // Add 7 days to each week
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentWeekStart.getDate() + dayIndex);
      
      // Format date as YYYY-MM-DD
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Check if this date is within our range and has data
      if (currentDate >= startDate && currentDate <= today) {
        const contribution = contributionMap.get(dateString);
        week.days.push(contribution || { 
          date: dateString, 
          count: 0, 
          level: 0 
        });
      } else {
        // Add null for padding (dates outside our range)
        week.days.push(null);
      }
    }
    
    weeks.push(week);
    
    // Move to next week
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    // Stop if we've gone beyond today
    if (currentWeekStart > today) break;
  }
  
  // Remove empty weeks at the end
  while (weeks.length > 0 && weeks[weeks.length - 1].days.every(day => day === null)) {
    weeks.pop();
  }
  
  return weeks;
}

/**
 * Gets color class for contribution level (indigo scale instead of green)
 */
export function getContributionColor(level: number): string {
  const colors = {
    0: 'bg-neutral-100 dark:bg-neutral-800', // No contributions
    1: 'bg-indigo-200 dark:bg-indigo-900',   // Low
    2: 'bg-indigo-400 dark:bg-indigo-700',   // Medium-low  
    3: 'bg-indigo-600 dark:bg-indigo-500',   // Medium-high
    4: 'bg-indigo-800 dark:bg-indigo-300',   // High
  };
  
  return colors[level as keyof typeof colors] || colors[0];
}

/**
 * Formats contribution count for display
 */
export function formatContributionCount(count: number): string {
  if (count === 0) return 'No contributions';
  if (count === 1) return '1 contribution';
  return `${count} contributions`;
}

/**
 * Gets month labels for the grid header
 */
export function getMonthLabels(weeks: WeekData[]): { label: string; weekIndex: number }[] {
  const months: { label: string; weekIndex: number }[] = [];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  let lastMonth = -1;
  
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.days.find(day => day !== null);
    if (firstDay) {
      const date = new Date(firstDay.date);
      const month = date.getMonth();
      
      if (month !== lastMonth && weekIndex > 0) {
        months.push({
          label: monthNames[month],
          weekIndex
        });
        lastMonth = month;
      }
    }
  });
  
  return months;
}

/**
 * Gets day of week labels
 */
export function getDayLabels(): string[] {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}