import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
// import { PdfLoader } from 'langchain/document_loaders/fs/pdf';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';
import openai from './openai.js';

const question = process.argv[2];
if (!question) {
  console.error('Please provide a question');
  process.exit(1);
}

const t3VideoUrl = 'https://www.youtube.com/watch?v=YkOSUVzOAA4';

/**
 * @param {Document[]} docs
 * @returns {Promise<MemoryVectorStore>}
 */
const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

/**
 * @param {string} videoUrl
 * @returns {Promise<Document[]>}
 */
const docsFromYoutubeVideo = (videoUrl) => {
  const loader = YoutubeLoader.createFromUrl(videoUrl, {
    langauge: 'en',
    addVideoInfo: true,
  });

  return loader.loadAndSplit(
    new CharacterTextSplitter({
      // We separare by space since a transcript doesn't have punctuation
      separator: ' ',
      // This is how many characters we want to send to OpenAI at once.
      chunkSize: 2500,
      // We want each chunk to overlap by 100 characters to make sure we don't break context
      chunkOverlap: 100,
    }),
  );
};

/**
 * @param {string} filePath
 * @returns {Promise<Document[]>}
 */
// const docsFromPdf = (filePath) => {
//   const loader = new PdfLoader(filePath);
//
//   return loader.loadAndSplit(
//     new CharacterTextSplitter({
//       // Since this is a pdf, this is structured text so we are sure we have '. '
//       separator: '. ',
//       // This is how many characters we want to send to OpenAI at once.
//       chunkSize: 2500,
//       // We want each chunk to overlap by 100 characters to make sure we don't break context
//       chunkOverlap: 200,
//     }),
//   );
// };

/**
 * @returns {Promise<MemoryVectorStore>}
 */
const loadStore = async () => {
  const docs = await docsFromYoutubeVideo(t3VideoUrl);
  return createStore(docs);
};

const query = async () => {
  const store = await loadStore();
  // This transforms the query into an embedding and will see what are closest to it.
  const results = await store.similaritySearch(question, 2);

  // You use the question again: first we retrieved the chunks that were related to our question;
  // now we need it again to let ChatGPT know what we are talking about and answer the question.
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-16k-0613',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI assistant, answer any question to the best of your ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided context. If you cannot answer the question with the context, don't lie and make up stuff, just say you need more context.
Question: ${question}

Context: ${results.map((r) => r.pageContent).join('\n')}`,
      },
    ],
  });

  console.log(
    `Answer: ${response.choices[0].message.content}\nSources: ${results
      .map((r) => r.metadata.source)
      .join(', ')}`,
  );
};

query();
