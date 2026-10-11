type Message = { to: string; subject: string; text: string };

// EMAIL_MODE=log swaps the provider for a logger that takes as long as a real send.
export const email = {
  async send(message: Message) {
    if (process.env.EMAIL_MODE === 'log') {
      await new Promise((resolve) => setTimeout(resolve, 120));
      console.log('email', message.to, message.subject);
      return;
    }
    await fetch('https://api.email-provider.example/send', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.EMAIL_API_KEY}` },
      body: JSON.stringify(message),
    });
  },
};
