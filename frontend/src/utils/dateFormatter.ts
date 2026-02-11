import { format, parseISO, formatDistance } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'MMM yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    return '';
  }
};

export const formatDateRange = (
  startDate: string | Date,
  endDate?: string | Date,
  currentText: string = 'Present'
): string => {
  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : currentText;
  return `${start} - ${end}`;
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistance(dateObj, new Date(), { addSuffix: true });
  } catch (error) {
    return '';
  }
};

export const getMonthsDifference = (
  startDate: string | Date,
  endDate?: string | Date
): number => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = endDate
    ? typeof endDate === 'string'
      ? parseISO(endDate)
      : endDate
    : new Date();

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  return Math.max(0, months);
};

export const formatDuration = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
};
