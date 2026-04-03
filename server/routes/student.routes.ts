import { Router } from "express";
import * as studentCtrl from "../controllers/student.controller";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../controllers/auth.controller";

const router = Router();

router.post("/", authenticate, requireRole(["admin"]), studentCtrl.createStudent);

router.get(
    "/",
    authenticate,
    requireRole(["admin", "academic_guide", "academic_guide_coordinator", "reporter"]),
    studentCtrl.getAllStudents
);

router.get(
    "/my-academic-history",
    authenticate,
    requireRole(["student"]),
    studentCtrl.getMyAcademicHistory
);


router.get(
    "/:id",
    authenticate,
    requireRole(["admin", "academic_guide", "academic_guide_coordinator", "reporter"]),
    studentCtrl.getStudentById
);

router.put(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    studentCtrl.updateStudent
);

router.delete(
    "/:id",
    authenticate,
    requireRole(["admin"]),
    studentCtrl.deleteStudent
);

router.post("/contact-it", studentCtrl.contactIT);
router.post("/contact-admin", studentCtrl.contactAdmin);

export default router;