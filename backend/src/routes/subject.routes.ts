import { Router } from "express";
import { SubjectController } from "../controllers/subject.controller.js";

const router = Router();

router.get("/", SubjectController.getAll);
router.post("/", SubjectController.create);
router.delete("/:id", SubjectController.delete);

export default router;
