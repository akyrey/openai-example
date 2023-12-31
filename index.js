import openai from './openai.js';

const result = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'system',
      content:
        'You are an AI assistant, answer any question to the best of your ability.',
    },
    {
      role: 'user',
      content:
        'Hi! Could you explain my what is a Transformer and hos is it used inside LLM and ChatGPT itself?',
    },
  ],
});

console.log(result.choices[0]);
