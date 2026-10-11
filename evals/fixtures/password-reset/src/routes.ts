import express from 'express';
import { forgot, reset } from './auth/reset';

export const auth = express.Router();
auth.post('/api/auth/forgot', forgot);
auth.post('/api/auth/reset', reset);
