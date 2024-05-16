import auth from './.auth.js';
import fetch from 'node-fetch';
import { getUrls } from './login.js';
let TEST = false;
let intervalId;

(async () => {
    try {
      console.log("Logging into Audible...")
      const books = await getUrls();
      console.log(books);
      console.log("Logged into Audible.")
    } catch (error) {
      console.error('Failed to login', error);
    }
  })();