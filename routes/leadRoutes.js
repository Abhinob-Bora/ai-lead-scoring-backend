const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const supabase = require('../config/supabase');

const upload = multer({ dest: 'uploads/' });

router.post('/leads/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No CSV file uploaded'
      });
    }

    const leads = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        if (row.name) {
          leads.push({
            name: row.name,
            role: row.role || null,
            company: row.company || null,
            industry: row.industry || null,
            location: row.location || null,
            linkedin_bio: row.linkedin_bio || null
          });
        } else {
          errors.push(`Skipped row with missing name: ${JSON.stringify(row)}`);
        }
      })
      .on('end', async () => {
        try {
          fs.unlinkSync(req.file.path);

          if (leads.length === 0) {
            return res.status(400).json({
              error: 'No valid leads found in CSV',
              errors
            });
          }

          const { data, error } = await supabase
            .from('leads')
            .insert(leads)
            .select();

          if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
              error: 'Failed to insert leads',
              details: error.message
            });
          }

          res.json({
            success: true,
            message: `Successfully uploaded ${data.length} leads`,
            leads_uploaded: data.length,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (error) {
          console.error('Processing error:', error);
          res.status(500).json({
            error: 'Failed to process leads',
            details: error.message
          });
        }
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file.path);
        console.error('CSV parsing error:', error);
        res.status(400).json({
          error: 'Failed to parse CSV file',
          details: error.message
        });
      });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.get('/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve leads',
        details: error.message
      });
    }

    res.json({
      success: true,
      leads: data,
      count: data.length
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
