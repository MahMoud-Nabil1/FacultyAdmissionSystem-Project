import { Router } from "express";
import * as subjectCtrl from "../controllers/subject.controller";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../controllers/auth.controller";

const router = Router();

router.post("/", authenticate, requireRole(["admin"]), subjectCtrl.createSubject);
router.get("/", authenticate, subjectCtrl.getAllSubjects);
router.get("/:id", authenticate, subjectCtrl.getSubjectById);
router.put("/:id", authenticate, requireRole(["admin"]), subjectCtrl.updateSubject);
router.delete("/:id", authenticate, requireRole(["admin"]), subjectCtrl.deleteSubject);

export default router;