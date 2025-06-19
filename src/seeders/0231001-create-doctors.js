const { Doctor } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Doctor.bulkCreate([
      {
        name: 'Dr. John Doe',
        specialty: 'Cardiology',
        description: 'Experienced cardiologist with over 10 years of experience.',
        image: 'https://example.com/doctor1.jpg',
        is_active: true,
      },
      // Tambahkan lebih banyak dokter sesuai kebutuhan
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Doctor.destroy({ where: {}, truncate: true });
  }
};
