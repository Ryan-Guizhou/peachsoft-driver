import { createApp } from './app.js';
import { store } from './data/store.js';

const port = Number(process.env.PORT ?? 3000);
const server = createApp(store);

server.listen(port, () => {
  console.log(`Peachsoft Drive is running at http://localhost:${port}`);
});
