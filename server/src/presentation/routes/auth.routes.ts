import { Router, type RequestHandler } from "express";
import { type AuthController } from "../controllers/AuthController";
import { validateDto } from "../middlewares/validateDto";
import { RegisterUserRequestDTO } from "@application/dtos/auth/Request/RegisterUserRequestDTO";
import { LoginUserRequestDTO } from "@application/dtos/auth/Request/LoginUserRequestDTO";

export function createAuthRouter(
  authController: AuthController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.post("/register", validateDto(RegisterUserRequestDTO), authController.register);

  router.post("/login", validateDto(LoginUserRequestDTO), authController.login);

  router.post("/refresh", authController.refresh);

  router.post("/logout", authController.logout);

  router.get("/me", authMiddleware, authController.me);

  return router;
}
