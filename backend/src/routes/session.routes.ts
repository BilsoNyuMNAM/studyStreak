import { Router } from "express";
import { SessionController } from "../controllers/session.controller.js";

const router = Router();

router.get("/", SessionController.getAll);
router.post("/", SessionController.create);
router.delete("/:id", SessionController.delete);

export default router;
