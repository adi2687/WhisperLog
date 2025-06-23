import express from 'express';

const router = express.Router();

router.post('/logout', (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true, 
      sameSite: 'Strict', 
      path: '/', 
    });

    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
