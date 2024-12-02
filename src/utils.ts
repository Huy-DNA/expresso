// Calling multiple times = calling `fn` just one time
export function once<T extends (...args: unknown[]) => void> (fn: T): T {
  let done = false;

  function wrapper (...args: unknown[]): void {
    if (done) return;
    fn(...args);
    done = true;
  }
  return wrapper as T;
}
