const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const {
  calculateRuleScore,
  getIntentFromScore,
} = require("../services/scoringService");
const { analyzeIntent } = require("../services/aiService");

router.post("/score", async (req, res) => {
  try {
    const { offer_id } = req.body;

    if (!offer_id) {
      return res.status(400).json({
        error: "offer_id is required",
      });
    }

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offer_id)
      .maybeSingle();

    if (offerError || !offer) {
      return res.status(404).json({
        error: "Offer not found",
      });
    }

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*");

    if (leadsError) {
      return res.status(500).json({
        error: "Failed to retrieve leads",
        details: leadsError.message,
      });
    }

    if (!leads || leads.length === 0) {
      return res.status(400).json({
        error: "No leads found to score",
      });
    }

    const scoringResults = [];

    for (const lead of leads) {
      const { score: ruleScore, breakdown } = calculateRuleScore(lead, offer);

      const aiResult = await analyzeIntent(lead, offer);
      const aiReasoning = aiResult.reasoning;

      // Map AI intent to a score
      let aiScore = 0;
      switch (aiResult.intent?.toLowerCase()) {
        case "high":
          aiScore = 50;
          break;
        case "medium":
          aiScore = 30;
          break;
        case "low":
          aiScore = 10;
          break;
      }

      const totalScore = ruleScore + aiScore;
      const intent = getIntentFromScore(totalScore);

      const reasoning = `Rule Score: ${ruleScore}/50 (Role: ${breakdown.role}, Industry: ${breakdown.industry}, Completeness: ${breakdown.completeness}). AI Score: ${aiScore}/50. ${aiReasoning}`;

      scoringResults.push({
        lead_id: lead.id,
        offer_id: offer.id,
        rule_score: ruleScore,
        ai_score: aiScore,
        total_score: totalScore,
        intent,
        reasoning,
      });
    }

    const { data: insertedResults, error: insertError } = await supabase
      .from("scoring_results")
      .insert(scoringResults)
      .select();

    if (insertError) {
      console.error("Database error:", insertError);
      return res.status(500).json({
        error: "Failed to save scoring results",
        details: insertError.message,
      });
    }

    res.json({
      success: true,
      message: `Successfully scored ${insertedResults.length} leads`,
      results_count: insertedResults.length,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/results", async (req, res) => {
  try {
    const { offer_id, intent, min_score } = req.query;

    let query = supabase
      .from("scoring_results")
      .select(
        `
        *,
        leads (name, role, company, industry, location),
        offers (name)
      `
      )
      .order("total_score", { ascending: false });

    if (offer_id) {
      query = query.eq("offer_id", offer_id);
    }

    if (intent) {
      query = query.eq("intent", intent);
    }

    if (min_score) {
      query = query.gte("total_score", parseInt(min_score));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Failed to retrieve results",
        details: error.message,
      });
    }

    const formattedResults = data.map((result) => ({
      name: result.leads?.name,
      role: result.leads?.role,
      company: result.leads?.company,
      industry: result.leads?.industry,
      location: result.leads?.location,
      intent: result.intent,
      score: result.total_score,
      reasoning: result.reasoning,
      offer_name: result.offers?.name,
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

router.get("/results/export", async (req, res) => {
  try {
    const { offer_id, intent, min_score } = req.query;

    let query = supabase
      .from("scoring_results")
      .select(
        `
        *,
        leads (name, role, company, industry, location),
        offers (name)
      `
      )
      .order("total_score", { ascending: false });

    if (offer_id) {
      query = query.eq("offer_id", offer_id);
    }

    if (intent) {
      query = query.eq("intent", intent);
    }

    if (min_score) {
      query = query.gte("total_score", parseInt(min_score));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return res.status(500).json({
        error: "Failed to retrieve results",
        details: error.message,
      });
    }

    const csvHeader =
      "Name,Role,Company,Industry,Location,Intent,Score,Reasoning\n";
    const csvRows = data
      .map((result) => {
        const name = (result.leads?.name || "").replace(/"/g, '""');
        const role = (result.leads?.role || "").replace(/"/g, '""');
        const company = (result.leads?.company || "").replace(/"/g, '""');
        const industry = (result.leads?.industry || "").replace(/"/g, '""');
        const location = (result.leads?.location || "").replace(/"/g, '""');
        const reasoning = (result.reasoning || "").replace(/"/g, '""');

        return `"${name}","${role}","${company}","${industry}","${location}","${result.intent}",${result.total_score},"${reasoning}"`;
      })
      .join("\n");

    const csv = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=lead_scores.csv"
    );
    res.send(csv);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

module.exports = router;
