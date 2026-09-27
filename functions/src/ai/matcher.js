const functions = require('firebase-functions');
const admin = require('firebase-admin');

function calculateMatchScore(mentor, project) {
  let score = 0;
  const breakdown = { domain: 0, tech: 0, skill: 0, industry: 0, support: 0, stage: 0 };

  // Domain match (30%)
  const mentorDomains = mentor.domains || [];
  if (mentorDomains.includes(project.domain)) {
    score += 30;
    breakdown.domain = 30;
  }

  // Technology match (20%)
  const mentorTech = mentor.skills || [];
  const projectTech = project.technologies || [];
  let techMatchCount = 0;
  for (const pt of projectTech) {
    if (mentorTech.includes(pt)) techMatchCount++;
  }
  if (projectTech.length > 0) {
    const techScore = Math.min((techMatchCount / projectTech.length) * 20, 20);
    score += techScore;
    breakdown.tech = techScore;
  }

  // Skill match (20%)
  const projectSupport = project.support_required || [];
  let skillMatchCount = 0;
  for (const ps of projectSupport) {
     if (mentorTech.includes(ps)) skillMatchCount++;
  }
  if (projectSupport.length > 0) {
    const skillScore = Math.min((skillMatchCount / projectSupport.length) * 20, 20);
    score += skillScore;
    breakdown.skill = skillScore;
  }

  // Industry match (15%)
  if (mentor.industry && project.sub_domain && mentor.industry === project.sub_domain) {
    score += 15;
    breakdown.industry = 15;
  }

  // Support match (10%)
  const mentorSupportTypes = mentor.supportTypes || [];
  let supportMatchCount = 0;
  for (const ps of projectSupport) {
     if (mentorSupportTypes.includes(ps)) supportMatchCount++;
  }
  if (projectSupport.length > 0) {
    const supportScore = Math.min((supportMatchCount / projectSupport.length) * 10, 10);
    score += supportScore;
    breakdown.support = supportScore;
  }

  // Dev stage match (5%)
  // Simple heuristic for now
  score += 5;
  breakdown.stage = 5;

  return { total: Math.round(score), breakdown };
}

const matchProjectsForMentor = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const db = admin.firestore();
  try {
    const userSnap = await db.collection('users').doc(context.auth.uid).get();
    if (!userSnap.exists || userSnap.data().role !== 'mentor') {
      throw new functions.https.HttpsError('permission-denied', 'Must be a mentor');
    }

    const mentorSnap = await db.collection('mentors').doc(context.auth.uid).get();
    const mentor = mentorSnap.exists ? mentorSnap.data() : { skills: [], domains: [], supportTypes: [] };

    const projectsSnap = await db.collection('projects').where('status', '==', 'published').get();
    const projects = [];

    projectsSnap.forEach(doc => {
      const proj = doc.data();
      const match = calculateMatchScore(mentor, proj);
      projects.push({
        projectId: doc.id,
        project_summary: proj.title || 'Untitled Project',
        match_score: match.total,
        match_breakdown: match.breakdown,
        explanation: `Matches well on ${match.breakdown.domain > 0 ? 'domain' : ''} and ${match.breakdown.tech > 0 ? 'technologies' : 'skills'}`
      });
    });

    projects.sort((a, b) => b.match_score - a.match_score);
    return projects.slice(0, 20);

  } catch (error) {
    console.error('Error matching projects:', error);
    throw new functions.https.HttpsError('internal', 'Error computing matches');
  }
});

const matchMentorsForProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { projectId } = data;
  if (!projectId) {
     throw new functions.https.HttpsError('invalid-argument', 'projectId is required');
  }

  const db = admin.firestore();
  try {
    const projectSnap = await db.collection('projects').doc(projectId).get();
    if (!projectSnap.exists) {
       throw new functions.https.HttpsError('not-found', 'Project not found');
    }
    const project = projectSnap.data();

    const mentorsSnap = await db.collection('mentors').get();
    const mentorsList = [];

    mentorsSnap.forEach(doc => {
      const mentor = doc.data();
      const match = calculateMatchScore(mentor, project);
      mentorsList.push({
        expertise_category: mentor.expertise_category || 'Industry Mentor',
        domain: mentor.domains && mentor.domains.length > 0 ? mentor.domains[0] : 'General',
        skills: mentor.skills || [],
        support_types: mentor.supportTypes || [],
        experience_level: mentor.experience_level || 'Senior',
        match_percentage: match.total
      });
    });

    mentorsList.sort((a, b) => b.match_percentage - a.match_percentage);
    
    // Grouping by expertise_category to anonymize further
    const grouped = {};
    for (const m of mentorsList) {
       if (!grouped[m.expertise_category]) {
           grouped[m.expertise_category] = m;
       } else if (m.match_percentage > grouped[m.expertise_category].match_percentage) {
           grouped[m.expertise_category] = m;
       }
    }

    const result = Object.values(grouped).sort((a, b) => b.match_percentage - a.match_percentage).slice(0, 10);
    return result;

  } catch (error) {
    console.error('Error matching mentors:', error);
    throw new functions.https.HttpsError('internal', 'Error computing matches');
  }
});

module.exports = { matchProjectsForMentor, matchMentorsForProject };
