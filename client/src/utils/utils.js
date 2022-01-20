import { SECS_IN_DAY, SECS_IN_HOUR, SECS_IN_MINUTE } from "./constants";

export const secondsToTimeUnits = (secondsLeft) => {
  let remainingSeconds = secondsLeft;
  const days = Math.floor(remainingSeconds / SECS_IN_DAY);
  remainingSeconds %= SECS_IN_DAY;

  const hours = Math.floor(remainingSeconds / SECS_IN_HOUR);
  remainingSeconds %= SECS_IN_HOUR;

  const minutes = Math.floor(remainingSeconds / SECS_IN_MINUTE);

  const seconds = remainingSeconds % SECS_IN_MINUTE;

  return { days, hours, minutes, seconds };
};

export const timeUnitsToSeconds = (time) => {
  const daysToSeconds = time.days * SECS_IN_DAY;
  const hoursToSeconds = time.hours * SECS_IN_HOUR;
  const minutesToSeconds = time.hours * SECS_IN_MINUTE;

  return daysToSeconds + hoursToSeconds + minutesToSeconds + time.seconds;
};
