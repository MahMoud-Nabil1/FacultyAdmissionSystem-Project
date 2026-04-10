import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { requireRole } from "../controllers/auth.controller";
import * as placeCtrl from "../controllers/place.controller";

const router = Router();

// Public read (for dropdown in group form)
router.get("/", placeCtrl.getAllPlaces);
router.get("/:id", placeCtrl.getPlaceById);

// Admin-only CRUD
router.post("/", authenticate, requireRole("admin"), placeCtrl.createPlace);
router.put("/:id", authenticate, requireRole("admin"), placeCtrl.updatePlace);
router.delete("/:id", authenticate, requireRole("admin"), placeCtrl.deletePlace);

export default router;
