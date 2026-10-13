import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { checkAdminCredentials, signToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!checkAdminCredentials(username, password)) {
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  res.json({ token: signToken() });
});

// Lets the admin page check that a saved token still works.
router.get('/me', requireAdmin, (req, res) => res.json({ ok: true }));

export default router;
