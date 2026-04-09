import { Router } from 'express';
import { getComplaints, createComplaint, updateComplaint, deleteComplaint } from '../controllers/complaint.controller';

const router = Router();

router.get('/', getComplaints);
router.post('/', createComplaint);
router.put('/:id', updateComplaint);
router.delete('/:id', deleteComplaint);

export default router;