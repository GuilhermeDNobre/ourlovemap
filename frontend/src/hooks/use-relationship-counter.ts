import { useState, useEffect } from 'react';

interface RelationshipDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateDuration(startDate: string): RelationshipDuration {
  const start = new Date(startDate);
  const now = new Date();
  if (isNaN(start.getTime()) || start > now) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  return { years, months, days, hours, minutes, seconds };
}

export function useRelationshipCounter(startDate: string): RelationshipDuration {
  const [duration, setDuration] = useState<RelationshipDuration>(() =>
    calculateDuration(startDate),
  );
  useEffect(() => {
    if (!startDate) return;
    setDuration(calculateDuration(startDate));
    const interval = setInterval(() => {
      setDuration(calculateDuration(startDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [startDate]);
  return duration;
}
