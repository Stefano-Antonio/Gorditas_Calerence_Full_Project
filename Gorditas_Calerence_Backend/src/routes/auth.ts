import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../models';
import { validate, loginSchema } from '../middleware/validation';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createResponse } from '../utils/helpers';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), asyncHandler(async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await Usuario.findOne({ email, activo: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(createResponse(false, null, 'Credenciales inválidas'));
    }
    const payload = { id: user._id, email: user.email, nombre: user.nombre };
    const JWT_SECRET = process.env.JWT_SECRET || 'StAn121120360ne';
    // Token sin expiración (solo se invalida al cerrar sesión manualmente)
    const token = jwt.sign(payload, JWT_SECRET);

    res.json(createResponse(true, {
      token,
      user: user.toJSON()
    }, 'Inicio de sesión exitoso'));
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createResponse(false, null, 'Error interno en el servidor'));
  }
}));


// GET /api/auth/profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: any) => {
  res.json(createResponse(true, req.user.toJSON(), 'Perfil obtenido exitosamente'));
}));

export default router;