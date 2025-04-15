export function retryUntilSuccess<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delay: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attempt = () => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (attempts < maxRetries) {
            attempts++;
            setTimeout(attempt, delay);
          } else {
            reject(error);
          }
        });
    };

    attempt();
  });
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
export function getRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
