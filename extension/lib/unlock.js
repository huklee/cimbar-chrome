const UNLOCK_SEQUENCE = 'cimbar';

export function createUnlockDetector(onUnlock) {
  let buffer = '';
  let unlocked = false;

  return (event) => {
    if (unlocked || event.ctrlKey || event.metaKey || event.altKey || event.key?.length !== 1) return false;
    buffer = `${buffer}${event.key.toLowerCase()}`.slice(-UNLOCK_SEQUENCE.length);
    if (buffer !== UNLOCK_SEQUENCE) return false;
    unlocked = true;
    onUnlock();
    return true;
  };
}
