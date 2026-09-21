import { Router } from "express";
import { HabitController } from "../controllers/habit.controller.js";

const router = Router();

router.get("/", HabitController.getAll);
router.post("/", HabitController.create);
router.delete("/:id", HabitController.delete);
router.post("/toggle", HabitController.toggle);

export default router;
