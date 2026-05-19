const express = require("express");
const router  = express.Router();
const {
  getPillars,
  getDivisions,
  renameDivision,
  createPillar,
  updatePillar,
  deletePillar,createDivision
} = require("../controllers/pillarController");
const authMiddleware  = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// All routes require auth
router.use(authMiddleware);

// GET /api/pillars/divisions  ← must be BEFORE /:id to avoid conflict
router.get("/divisions", getDivisions);

// PATCH /api/pillars/division-rename  ← must be BEFORE /:id too
router.patch("/division-rename", adminMiddleware, renameDivision);

// GET /api/pillars?division=Legal
router.get("/", getPillars);

// Admin only below
router.post("/",    adminMiddleware, createPillar);
router.put("/:id",  adminMiddleware, updatePillar);
router.delete("/:id", adminMiddleware, deletePillar);
router.post('/divisions', adminMiddleware, createDivision)

module.exports = router;