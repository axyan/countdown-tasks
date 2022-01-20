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
  const minutesToSeconds = time.minutes * SECS_IN_MINUTE;

  // when adding tasks, input label returns a string type when type
  // attribute is 'number'; +time.seconds converts to number type
  return daysToSeconds + hoursToSeconds + minutesToSeconds + +time.seconds;
};

export const nowEpoch = () => {
  return Math.round(Date.now() / 1000);
};

export const parseJWT = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};
