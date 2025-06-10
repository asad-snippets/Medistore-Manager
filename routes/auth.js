import express from 'express';
import { redirectIfAuthenticated } from '../middleware/authMiddleware.js';
import {
  getSignup,
  postSignup,
  getLogin,
  postLogin,
  logout,
  getAccount,
  postAccount
} from '../controllers/authController.js';


const router = express.Router();

router.get('/signup', redirectIfAuthenticated, getSignup);
router.post('/signup', redirectIfAuthenticated, postSignup);

router.get('/login', redirectIfAuthenticated, getLogin);
router.post('/login', redirectIfAuthenticated, postLogin);

router.post('/logout', logout);
router.get('/account', getAccount);
router.post('/account', postAccount);
export default router;