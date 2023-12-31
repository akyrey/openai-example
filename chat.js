import readline from 'node:readline';
import openai from './openai.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * @param {string[]} history
 * @param {ChatCompletionMessageParam} message
 *
 * @returns {Promise<ChatCompletionMessage>}
 */
const newMessage = async (history, message) => {
  const results = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [...history, message],
    // The higher the temperature, the crazier the text can be.
    // temperature: 0,
  });

  return results.choices[0].message;
};

/**
 * @param {string} userInput
 * @returns {ChatCompletionUserMessageParam}
 */
const formatMessage = (userInput) => ({ role: 'user', content: userInput });

const chat = async () => {
  /** @type {ChatCompletionMessageParam[]} */
  const history = [
    {
      role: 'system',
      content:
        'You are an AI assistant, answer any question to the best of your ability.',
    },
  ];

  /**
   * We create a "recursive" function to keep asking for user input.
   */
  const start = () => {
    rl.question('You: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      const message = formatMessage(userInput);
      const response = await newMessage(history, message);

      history.push(message, response);
      console.log(`\nAI: ${response.content}\n\n`);
      start();
    });
  };

  start();
};

console.log('Welcome to the AI assistant. Type "exit" to quit.\n');
chat();
