const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { calculateScore, CRITERIA } = require('./scoringEngine');
const { createNotification } = require('../notifications/notificationService');

function mockGenerateAnalysis(projectData) {
  const isShortDescription = !projectData.description || projectData.description.length < 100;
  const hasGithub = !!projectData.github_url;
  const hasDemo = !!projectData.demo_url;
  const techCount = (projectData.technologies || []).length;
  
  const scoreBase = isShortDescription ? 1 : 3;
  const maxScore = isShortDescription ? 3 : 5;

  function randomScore(base, max) {
    return Math.floor(Math.random() * (max - base + 1)) + base;
  }

  const rubricScores = {};
  
  for (const crit of CRITERIA) {
    let score = randomScore(scoreBase, maxScore - 1);
    
    if (crit.id === 'technical_implementation' && hasGithub) {
      score = randomScore(Math.max(score, 3), maxScore);
    }
    if (crit.id === 'documentation' && hasGithub) {
      score = randomScore(Math.max(score, 2), maxScore);
    }
    if (crit.id === 'prototype_completeness' && hasDemo) {
      score = randomScore(Math.max(score, 3), maxScore);
    }
    
    let confidence = 'Medium';
    if (score >= 4) confidence = 'High';
    if (score <= 2) confidence = 'Low';

    rubricScores[crit.id] = {
      rubric_score: score,
      evidence: `Based on provided project description and metadata. ${hasGithub ? 'GitHub repository provided.' : ''} ${hasDemo ? 'Demo URL provided.' : ''}`,
      evidence_source: 'Project metadata',
      evidence_level: score >= 4 ? 'A' : (score === 3 ? 'B' : 'C'),
      strength: 'Identified relevant aspects from description.',
      weakness: isShortDescription ? 'Lacks detailed description.' : 'Requires more technical validation.',
      recommendation: 'Provide more detailed documentation and implementation specifics.',
      confidence: confidence
    };
  }

  const domain = projectData.domain || 'Software';

  const evidenceItems = [
    { field: 'description', value: projectData.description || '', source: 'User Input', level: 'B', verified: true }
  ];
  if (hasGithub) {
    evidenceItems.push({ field: 'github_url', value: projectData.github_url, source: 'User Input', level: 'A', verified: true });
  }
  
  if (techCount > 0) {
     evidenceItems.push({ field: 'technologies', value: projectData.technologies.join(', '), source: 'User Input', level: 'B', verified: true });
  }

  return {
    extracted_fields: {
      title: projectData.title || null,
      domain: domain,
      sub_domain: 'Web Development',
      technologies: projectData.technologies || [],
      components: [],
      status: projectData.status || 'idea',
      problem: 'Identified problem from context',
      solution: 'Proposed solution',
      target_users: [],
      support_required: projectData.support_required || ['Technical Guidance'],
      tags: ['hackathon']
    },
    project_type: domain,
    evidence_items: evidenceItems,
    criteria_rubric_scores: rubricScores
  };
}

const analyzeProject = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { projectId, isReanalysis = false } = data;
  if (!projectId) {
    throw new functions.https.HttpsError('invalid-argument', 'projectId is required');
  }

  const db = admin.firestore();

  try {
    const projectSnap = await db.collection('projects').doc(projectId).get();
    if (!projectSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Project not found');
    }
    const projectData = projectSnap.data();

    // In a real implementation, we would check process.env.GEMINI_API_KEY
    // and make an API call. Here we use the mock.
    const analysisResult = mockGenerateAnalysis(projectData);

    const scoreResult = calculateScore(analysisResult.criteria_rubric_scores);

    await db.collection('projectAnalysis').doc(projectId).set({
      ...analysisResult.extracted_fields,
      project_type: analysisResult.project_type,
      evidence_items: analysisResult.evidence_items,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      isReanalysis: isReanalysis
    });

    await db.collection('projectScores').doc(projectId).set({
      final_score: scoreResult.final_score,
      display_score: scoreResult.display_score,
      score_band: scoreResult.score_band,
      breakdown: scoreResult.breakdown,
      evidence_coverage: scoreResult.evidence_coverage,
      confidence: scoreResult.confidence,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('projectEvidence').doc(projectId).set({
      items: analysisResult.evidence_items,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await db.collection('projectTechnologies').doc(projectId).set({
      technologies: analysisResult.extracted_fields.technologies,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('supportRequirements').doc(projectId).set({
      requirements: analysisResult.extracted_fields.support_required,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('projects').doc(projectId).update({
      analysis_status: 'complete',
      lifecycle_stage: 'AI Analyzed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('projectLifecycle').doc().set({
      projectId: projectId,
      event: 'AI Analysis Complete',
      description: 'The project has been successfully analyzed by AI.',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await createNotification(
      admin,
      projectData.userId,
      'analysis_complete',
      'Analysis Complete',
      `Your project ${projectData.title} has been analyzed.`,
      { projectId }
    );

    return {
      success: true,
      projectId: projectId,
      score: scoreResult.final_score
    };

  } catch (error) {
    console.error('Error analyzing project:', error);
    throw new functions.https.HttpsError('internal', 'Analysis failed');
  }
});

module.exports = { analyzeProject };
