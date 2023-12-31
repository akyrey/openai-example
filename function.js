import openai from './openai.js';
import math from 'advanced-calculator';

const question = process.argv[2];
if (!question) {
  console.error('Please provide a question');
  process.exit(1);
}

/** @type {ChatCompletionMessageParam[]} */
const history = [
  {
    role: 'system',
    content:
      'You are an AI assistant, answer any question to the best of your ability.',
  },
  {
    role: 'user',
    content: question,
  },
];

// We can have as many functions as we want here
const functions = {
  // This function will only be called if we ask something related to math expression calculation
  calculate({ expression }) {
    return math.evaluate(expression);
  },
  async generateImage({ prompt }) {
    const result = await openai.images.generate({ prompt });
    console.log(result);
    return result.data[0].url;
  },
};

const getCompletion = async (messages) => {
  return openai.chat.completions.create({
    model: 'gpt-3.5-turbo-1106',
    temperature: 0,
    messages,
    // This function_call forces ChatGPT to call this function no matter what prompt we give it
    // It is useful to get structured output
    // function_call: { name: 'calculate' },
    // Array of objects that represent a schema that OpenAI can call
    functions: [
      {
        name: 'calculate',
        // This is important, since ChatGPT uses this to know what to call
        description: 'Calculate a math expression',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description:
                'The math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
            },
          },
          required: ['expression'],
        },
      },
      {
        name: 'generateImage',
        // This is important, since ChatGPT uses this to know what to call
        description: 'Create or generate an image based on a description',
        parameters: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The description of the image to generate',
            },
          },
          required: ['prompt'],
        },
      },
    ],
  });
};

const safeParse = (args) => {
  try {
    return JSON.parse(args);
  } catch (err) {
    console.error(err);
    return {};
  }
};

const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (err) {
    console.error(err);
    return '';
  }
};

let response;
while (true) {
  response = await getCompletion(history);
  const res = response.choices[0];

  if (res.finish_reason === 'stop') {
    console.log(res.message.content);
    break;
  }

  if (res.finish_reason === 'function_call') {
    const fnName = res.message.function_call.name;
    const args = res.message.function_call.arguments;

    const funcToCall = await functions[fnName];
    if (!funcToCall) {
      throw new Error(`Function ${fnName} not found`);
    }

    // We add to the history the results the AI responded back with
    history.push({
      role: 'assistant',
      content: null,
      function_call: {
        name: fnName,
        arguments: args,
      },
    });

    const params = safeParse(args);

    // We actually call the function and pass the result to the AI
    const result = funcToCall(params);

    history.push({
      role: 'function',
      name: fnName,
      content: safeStringify({ result }),
    });
  }
}
