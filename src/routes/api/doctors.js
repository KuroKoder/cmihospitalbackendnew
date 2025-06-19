const express = require('express');
const router = express.Router();
const DoctorController = require('../../controllers/doctorController');
const { validateDoctor } = require('../../validators/doctorValidator'); // Pastikan Anda memiliki validator

// Routes untuk dokter
router.get('/', DoctorController.getAll);
router.get('/:id', DoctorController.getById);
router.get('/specialties', DoctorController.getSpecialties);
router.post('/', validateDoctor, DoctorController.create);
router.put('/:id', validateDoctor, DoctorController.update);
router.delete('/:id', DoctorController.delete);
router.get('/featured', DoctorController.getFeatured);
router.put('/bulk-status', DoctorController.bulkUpdateStatus);
router.get('/search', DoctorController.search);


module.exports = router;
