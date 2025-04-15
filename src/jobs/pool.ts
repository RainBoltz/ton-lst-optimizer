import cron from 'node-cron';

export function scheduleMyJob() {
  cron.schedule('*/5 * * * * *', () => {
    console.log(`[${new Date().toISOString()}] 🔁 Running my scheduled task...`);
    // You can put any job logic here (e.g., DB update, API call)
  });
}
