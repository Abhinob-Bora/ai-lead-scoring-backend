const DECISION_MAKER_ROLES = [
  'ceo', 'cto', 'cfo', 'coo', 'chief', 'president', 'vp', 'vice president',
  'head of', 'director', 'owner', 'founder', 'partner'
];

const INFLUENCER_ROLES = [
  'manager', 'lead', 'senior', 'principal', 'architect', 'specialist'
];

function calculateRuleScore(lead, offer) {
  let score = 0;
  const breakdown = {
    role: 0,
    industry: 0,
    completeness: 0
  };

  const roleLower = (lead.role || '').toLowerCase();
  const industryLower = (lead.industry || '').toLowerCase();

  if (DECISION_MAKER_ROLES.some(dm => roleLower.includes(dm))) {
    breakdown.role = 20;
  } else if (INFLUENCER_ROLES.some(inf => roleLower.includes(inf))) {
    breakdown.role = 10;
  }

  if (offer.ideal_use_cases && offer.ideal_use_cases.length > 0) {
    const isExactMatch = offer.ideal_use_cases.some(useCase =>
      industryLower.includes(useCase.toLowerCase()) ||
      useCase.toLowerCase().includes(industryLower)
    );

    if (isExactMatch) {
      breakdown.industry = 20;
    } else {
      const isAdjacentMatch = offer.ideal_use_cases.some(useCase => {
        const keywords = useCase.toLowerCase().split(' ');
        return keywords.some(keyword => industryLower.includes(keyword) || keyword.includes(industryLower));
      });
      if (isAdjacentMatch) {
        breakdown.industry = 10;
      }
    }
  }

  const hasAllFields = lead.name && lead.role && lead.company &&
                       lead.industry && lead.location && lead.linkedin_bio;
  if (hasAllFields) {
    breakdown.completeness = 10;
  }

  score = breakdown.role + breakdown.industry + breakdown.completeness;

  return { score, breakdown };
}

function getIntentFromScore(totalScore) {
  if (totalScore >= 70) return 'High';
  if (totalScore >= 40) return 'Medium';
  return 'Low';
}

module.exports = {
  calculateRuleScore,
  getIntentFromScore
};
