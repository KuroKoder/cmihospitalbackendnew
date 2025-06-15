const express = require("express");
const router = express.Router();

// Kosong dulu, nanti kamu tambahkan route lain di sini
router.get("/", (req, res) => {
  res.send("API root route aktif");
});

module.exports = router;
