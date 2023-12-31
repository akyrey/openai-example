import 'dotenv/config';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

/**
 * @typedef {Object} Movie
 *
 * @property {number} id
 * @property {string} title
 * @property {string} description
 */

/** @type {Movie[]} */
const movies = [
  {
    id: 1,
    title: 'Stepbrother',
    description: `Comedic journey full of adult humor and awkwardness.`,
  },
  {
    id: 2,
    title: 'The Matrix',
    description: `Deals with alternate realities and questioning what's real.`,
  },
  {
    id: 3,
    title: 'Shutter Island',
    description: `A mind-bending plot with twists and turns.`,
  },
  {
    id: 4,
    title: 'Memento',
    description: `A non-linear narrative that challenges the viewer's perception.`,
  },
  {
    id: 5,
    title: 'Doctor Strange',
    description: `Features alternate dimensions and reality manipulation.`,
  },
  {
    id: 6,
    title: 'Paw Patrol',
    description: `Children's animated movie where a group of adorable puppies save people from all sorts of emergencies.`,
  },
  {
    id: 7,
    title: 'Interstellar',
    description: `Features futuristic space travel with high stakes`,
  },
];

const createStore = () =>
  MemoryVectorStore.fromDocuments(
    movies.map(
      (movie) =>
        new Document({
          pageContent: `Title ${movie.title}\n${movie.description}`,
          metadata: {
            id: movie.id,
            title: movie.title,
          },
        }),
    ),
    new OpenAIEmbeddings(),
  );

const search = async (query, count = 1) => {
  const store = await createStore();
  // This transforms the query into an embedding and will see what are closest to it.
  return store.similaritySearch(query, count);
};

console.log(await search(`A movie that will make me feel like I'm crazy`));
