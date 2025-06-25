//routes/api/user.js
const express = require('express');
const router = express.Router();
const { models } = require('../../models'); // Sesuaikan path relatif
const UserControllerClass = require('../../controllers/userController');

const userController = new UserControllerClass(models);

// CREATE user
router.post('/', async (req, res) => {
  const result = await userController.createUser(req.body);
  res.status(result.success ? 201 : 400).json(result);
});

// READ all users with filter/pagination
router.get('/', async (req, res) => {
  const result = await userController.getAllUsers(req.query);
  res.status(result.success ? 200 : 400).json(result);
});

// READ single user by ID
router.get('/:id', async (req, res) => {
  const result = await userController.getUserById(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

// READ user by email
router.get('/by/email', async (req, res) => {
  const result = await userController.getUserByEmail(req.query.email);
  res.status(result.success ? 200 : 404).json(result);
});

// UPDATE user
router.put('/:id', async (req, res) => {
  const result = await userController.updateUser(req.params.id, req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// PATCH user
router.patch('/:id', async (req, res) => {
  const result = await userController.patchUser(req.params.id, req.body);
  res.status(result.success ? 200 : 400).json(result);
});

// SOFT DELETE (deactivate)
router.patch('/:id/deactivate', async (req, res) => {
  const result = await userController.deactivateUser(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
});

// DELETE permanently
router.delete('/:id', async (req, res) => {
  const result = await userController.deleteUser(req.params.id);
  res.status(result.success ? 200 : 400).json(result);
});

// DELETE multiple
router.post('/delete-multiple', async (req, res) => {
  const result = await userController.deleteMultipleUsers(req.body.userIds);
  res.status(result.success ? 200 : 400).json(result);
});

// VERIFY password
router.post('/verify-password', async (req, res) => {
  const { email, password } = req.body;
  const result = await userController.verifyPassword(email, password);
  res.status(result.success ? 200 : 401).json(result);
});

// UPDATE password
router.put('/:id/update-password', async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = await userController.updatePassword(req.params.id, oldPassword, newPassword);
  res.status(result.success ? 200 : 400).json(result);
});

// USER statistics
router.get('/stats/all', async (req, res) => {
  const result = await userController.getUserStats();
  res.status(result.success ? 200 : 400).json(result);
});

module.exports = router;
