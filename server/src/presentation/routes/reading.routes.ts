import { Router, type RequestHandler } from "express";
import { type ReadingController } from "../controllers/ReadingController";
import { validateDto } from "../middlewares/validateDto";
import { CreateReadingRequestDTO } from "@application/dtos/reading/Request/CreateReadingRequestDTO";
import { UpdateReadingRequestDTO } from "@application/dtos/reading/Request/UpdateReadingRequestDTO";
import { GetReadingsQueryDTO } from "@application/dtos/reading/Request/GetReadingsQueryDTO";

export function createReadingRouter(
  readingController: ReadingController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // All reading routes require authentication
  router.use(authMiddleware);

  router.post("/", validateDto(CreateReadingRequestDTO), readingController.create);

  router.get("/", validateDto(GetReadingsQueryDTO, "query"), readingController.getAll);

  router.get("/:id", readingController.getById);

  router.patch("/:id", validateDto(UpdateReadingRequestDTO), readingController.update);

  router.delete("/:id", readingController.delete);

  return router;
}
