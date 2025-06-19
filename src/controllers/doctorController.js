const { Doctor } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { generateSlug } = require('../utils/helpers');
const seoService = require('../services/seoService');
const logger = require('../utils/logger');

class DoctorController {
  // Get all doctors with SEO optimization
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 12,
        specialty,
        active,
        search,
        sortBy = 'name',
        sortOrder = 'ASC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by active status
      if (active !== undefined) {
        whereClause.is_active = active === 'true';
      }

      // Filter by specialty
      if (specialty) {
        whereClause.specialty = { [Op.iLike]: `%${specialty}%` };
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { specialty: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const doctors = await Doctor.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]]
      });

      // Generate SEO meta for doctors listing
      const seoMeta = {
        title: specialty ? `${specialty} Specialists` : 'Our Medical Team',
        description: specialty 
          ? `Meet our experienced ${specialty} specialists and doctors`
          : 'Meet our experienced medical team and healthcare professionals',
        canonical: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        structuredData: seoService.generateDoctorListStructuredData(doctors.rows)
      };

      res.json({
        success: true,
        data: {
          doctors: doctors.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(doctors.count / limit),
            totalItems: doctors.count,
            hasNext: page < Math.ceil(doctors.count / limit),
            hasPrev: page > 1
          },
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching doctors',
        error: error.message
      });
    }
  }

  // Get doctor by ID with SEO
  async getById(req, res) {
    try {
      const { id } = req.params;

      const doctor = await Doctor.findOne({
        where: { id, is_active: true }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Generate structured data for SEO
      const structuredData = seoService.generateDoctorStructuredData(doctor);

      // Generate SEO meta tags
      const seoMeta = {
        title: `Dr. ${doctor.name} - ${doctor.specialty || 'Medical Specialist'}`,
        description: doctor.description || `Meet Dr. ${doctor.name}, our experienced ${doctor.specialty || 'medical specialist'}`,
        canonical: `${req.protocol}://${req.get('host')}/doctors/${id}`,
        structuredData,
        openGraph: {
          title: `Dr. ${doctor.name}`,
          description: doctor.description,
          image: doctor.image,
          url: `${req.protocol}://${req.get('host')}/doctors/${id}`,
          type: 'profile'
        }
      };

      res.json({
        success: true,
        data: {
          doctor,
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error fetching doctor:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching doctor',
        error: error.message
      });
    }
  }

  // Get specialties list
  async getSpecialties(req, res) {
    try {
      const specialties = await Doctor.findAll({
        attributes: [
          'specialty',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          is_active: true,
          specialty: { [Op.ne]: null }
        },
        group: ['specialty'],
        order: [['specialty', 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: specialties.filter(spec => spec.specialty)
      });
    } catch (error) {
      logger.error('Error fetching specialties:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching specialties',
        error: error.message
      });
    }
  }

  // Create new doctor
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        name,
        specialty,
        description,
        image,
        facebook_url,
        instagram_url,
        twitter_url,
        linkedin_url,
        is_active = true
      } = req.body;

      const doctor = await Doctor.create({
        name,
        specialty,
        description,
        image,
        facebook_url,
        instagram_url,
        twitter_url,
        linkedin_url,
        is_active
      });

      logger.info(`Doctor created: ${doctor.id} by user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: doctor
      });
    } catch (error) {
      logger.error('Error creating doctor:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating doctor',
        error: error.message
      });
    }
  }

  // Update doctor
  async update(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const doctor = await Doctor.findByPk(id);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      const {
        name,
        specialty,
        description,
        image,
        facebook_url,
        instagram_url,
        twitter_url,
        linkedin_url,
        is_active
      } = req.body;

      const updateData = {};

      // Only update provided fields
      if (name !== undefined) updateData.name = name;
      if (specialty !== undefined) updateData.specialty = specialty;
      if (description !== undefined) updateData.description = description;
      if (image !== undefined) updateData.image = image;
      if (facebook_url !== undefined) updateData.facebook_url = facebook_url;
      if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
      if (twitter_url !== undefined) updateData.twitter_url = twitter_url;
      if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
      if (is_active !== undefined) updateData.is_active = is_active;

      updateData.updated_at = new Date();

      await doctor.update(updateData);

      logger.info(`Doctor updated: ${id} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Doctor updated successfully',
        data: doctor
      });
    } catch (error) {
      logger.error('Error updating doctor:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating doctor',
        error: error.message
      });
    }
  }

  // Delete doctor
  async delete(req, res) {
    try {
      const { id } = req.params;
      const doctor = await Doctor.findByPk(id);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      await doctor.destroy();

      logger.info(`Doctor deleted: ${id} by user ${req.user.id}`);

      res.json({
        success: true,
        message: 'Doctor deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting doctor:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting doctor',
        error: error.message
      });
    }
  }

  // Get featured doctors
  async getFeatured(req, res) {
    try {
      const { limit = 6 } = req.query;

      // For now, we'll get the most recently added active doctors
      // You can modify this logic based on your business needs
      const featuredDoctors = await Doctor.findAll({
        where: { is_active: true },
        limit: parseInt(limit),
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: featuredDoctors
      });
    } catch (error) {
      logger.error('Error fetching featured doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching featured doctors',
        error: error.message
      });
    }
  }

  // Bulk update status
  async bulkUpdateStatus(req, res) {
    try {
      const { ids, is_active } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs array is required'
        });
      }

      if (typeof is_active !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_active must be a boolean'
        });
      }

      const [updatedCount] = await Doctor.update(
        { is_active, updated_at: new Date() },
        { where: { id: { [Op.in]: ids } } }
      );

      logger.info(`Bulk doctor status update: ${updatedCount} doctors updated by user ${req.user.id}`);

      res.json({
        success: true,
        message: `${updatedCount} doctors updated successfully`,
        data: { updatedCount, is_active }
      });
    } catch (error) {
      logger.error('Error bulk updating doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk updating doctors',
        error: error.message
      });
    }
  }

  // Search doctors with advanced filters
  async search(req, res) {
    try {
      const {
        q, // search query
        specialty,
        page = 1,
        limit = 10,
        sortBy = 'name',
        sortOrder = 'ASC'
      } = req.query;

      if (!q && !specialty) {
        return res.status(400).json({
          success: false,
          message: 'Search query or specialty is required'
        });
      }

      const offset = (page - 1) * limit;
      const whereClause = { is_active: true };

      if (q) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${q}%` } },
          { specialty: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ];
      }

      if (specialty) {
        whereClause.specialty = { [Op.iLike]: `%${specialty}%` };
      }

      const doctors = await Doctor.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder]]
      });

      // Generate SEO meta for search results
      const seoMeta = {
        title: `Search Results: ${q || specialty}`,
        description: `Find doctors and specialists matching "${q || specialty}"`,
        canonical: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      };

      res.json({
        success: true,
        data: {
          doctors: doctors.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(doctors.count / limit),
            totalItems: doctors.count,
            hasNext: page < Math.ceil(doctors.count / limit),
            hasPrev: page > 1
          },
          seo: seoMeta
        }
      });
    } catch (error) {
      logger.error('Error searching doctors:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching doctors',
        error: error.message
      });
    }
  }
}

module.exports = new DoctorController();