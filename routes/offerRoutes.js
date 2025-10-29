const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.post('/offer', async (req, res) => {
  try {
    const { name, value_props, ideal_use_cases } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Offer name is required'
      });
    }

    const { data, error } = await supabase
      .from('offers')
      .insert([
        {
          name,
          value_props: value_props || [],
          ideal_use_cases: ideal_use_cases || []
        }
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to create offer',
        details: error.message
      });
    }

    res.status(201).json({
      success: true,
      offer: data
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.get('/offers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve offers',
        details: error.message
      });
    }

    res.json({
      success: true,
      offers: data
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
