// Hello world
import express from 'express';

import dotenv from 'dotenv';
dotenv.config();

import connectDB from "./src/config/db.js";

const app = express();

connectDB();
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));

