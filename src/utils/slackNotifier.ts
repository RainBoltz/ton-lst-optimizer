export interface SlackMessage {
    text: string;
    blocks?: any[];
    attachments?: any[];
  }
  
  export class SlackNotifier {
    constructor(private webhookUrl: string) {
      if (!webhookUrl.startsWith('https://hooks.slack.com/services/')) {
        throw new Error('Invalid Slack Webhook URL.');
      }
    }
  
    async send(message: SlackMessage): Promise<void> {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack notification failed: ${response.status} - ${errorText}`);
      }
    }
  }
  