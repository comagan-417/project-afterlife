import http from 'node:http';
import { apiMiddleware } from './server/apiMiddleware.js';

// Setup local test server
const server = http.createServer(async (req, res) => {
  await apiMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

async function runGuidanceTests() {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Guidance Interaction Test Server running at ${baseUrl}\n`);

  const runId = Date.now();
  const emailS1 = `student1_${runId}@student.dev`;
  const emailS2 = `student2_${runId}@student.dev`;
  const emailM1 = `mentor1_${runId}@mentor.dev`;
  const emailM2 = `mentor2_${runId}@mentor.dev`;

  async function api(path, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status, data };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('--- TEST 1: Register Student 1 and upload Project Alpha ---');
  const regS1 = await api('/api/auth/register', 'POST', {
    name: 'Student Alice',
    email: emailS1,
    password: 'passwordAlice123',
    role: 'student',
    institution: 'MIT Innovations Lab'
  });
  assert(regS1.status === 201, 'Student 1 registered');
  const tokenS1 = regS1.data.token;
  const idS1 = regS1.data.user.id;

  const projAlphaRes = await api('/api/projects', 'POST', {
    title: 'ChargeWise – Adaptive EV Charging System',
    description: 'Smart bidirectional EV charging algorithm for peak shaving',
    domain: 'CleanTech / EV',
    problemStatement: 'Grid overloads during fast charging',
    proposedSolution: 'AI load balancing and adaptive current throttling',
    technologies: ['C++', 'Python', 'React', 'MQTT'],
    lifecycleStage: 'Working Prototype',
    supportRequired: ['Technical Guidance', 'Funding']
  }, tokenS1);
  assert(projAlphaRes.status === 201, 'Project Alpha uploaded');
  const projAlphaId = projAlphaRes.data.id;
  assert(projAlphaRes.data.userId === idS1, 'Project Alpha belongs to Student 1');

  console.log('\n--- TEST 2: Register Student 2 and upload Project Beta ---');
  const regS2 = await api('/api/auth/register', 'POST', {
    name: 'Student Bob',
    email: emailS2,
    password: 'passwordBob123',
    role: 'student',
    institution: 'Stanford Robotics'
  });
  assert(regS2.status === 201, 'Student 2 registered');
  const tokenS2 = regS2.data.token;
  const idS2 = regS2.data.user.id;

  const projBetaRes = await api('/api/projects', 'POST', {
    title: 'SolarMesh – Distributed Solar Router',
    description: 'P2P solar energy router',
    domain: 'Energy',
    lifecycleStage: 'Prototype'
  }, tokenS2);
  assert(projBetaRes.status === 201, 'Project Beta uploaded');
  const projBetaId = projBetaRes.data.id;

  console.log('\n--- TEST 3: Register Mentor 1 (Dr. Arun Kumar) ---');
  const regM1 = await api('/api/auth/register', 'POST', {
    name: 'Dr. Arun Kumar',
    email: emailM1,
    password: 'passwordMentor123',
    role: 'mentor',
    domain: 'Embedded Systems',
    domains: ['Embedded Systems', 'CleanTech / EV'],
    skills: ['IoT & EV Technology', 'Firmware', 'Power Electronics'],
    organization: 'Tata Motors R&D',
    bio: 'Lead architect in EV powertrains.'
  });
  assert(regM1.status === 201, 'Mentor 1 registered');
  const tokenM1 = regM1.data.token;
  const idM1 = regM1.data.user.id;

  console.log('\n--- TEST 4: Mentor 1 submits "Request to Guide" for Project Alpha ---');
  const req1 = await api('/api/mentorship-requests', 'POST', {
    projectId: projAlphaId,
    supportType: 'Technical Guidance',
    message: 'I would love to help optimize your firmware and BMS architecture.'
  }, tokenM1);
  assert(req1.status === 201, 'Guidance request created with 201 Created');
  assert(req1.data.mentorId === idM1, 'Request mentorId matches Mentor 1');
  assert(req1.data.studentId === idS1, 'Request studentId accurately resolved to Student 1 (Project Alpha owner)');
  assert(req1.data.projectId === projAlphaId, 'Request references Project Alpha');
  assert(req1.data.status === 'pending', 'Initial status is pending');
  const requestId1 = req1.data.id || req1.data.requestId;

  console.log('\n--- TEST 5: Prevent Duplicate Requests (Mentor 1 re-requests Project Alpha) ---');
  const duplicateReq = await api('/api/mentorship-requests', 'POST', {
    projectId: projAlphaId,
    supportType: 'Technical Guidance',
    message: 'Duplicate attempt'
  }, tokenM1);
  assert(duplicateReq.status === 409, 'Duplicate request rejected with 409 Conflict');
  assert(duplicateReq.data.error.includes('Request already exists'), 'Descriptive duplicate error message returned');

  console.log('\n--- TEST 6: Student 2 isolation check (cannot see Student 1 requests) ---');
  const s2Reqs = await api('/api/mentorship-requests/student', 'GET', null, tokenS2);
  assert(s2Reqs.status === 200, 'Student 2 fetched requests');
  assert(s2Reqs.data.length === 0, 'Student 2 sees 0 requests (Student 1 request isolated)');

  console.log('\n--- TEST 7: Security check - Student 2 cannot accept Student 1 request ---');
  const s2AcceptAttempt = await api(`/api/mentorship-requests/${requestId1}/accept`, 'PATCH', {}, tokenS2);
  assert(s2AcceptAttempt.status === 403, 'Cross-student accept rejected with 403 Forbidden');

  console.log('\n--- TEST 8: Student 1 sees incoming guidance request with full Mentor details ---');
  const s1Reqs = await api('/api/mentorship-requests/student', 'GET', null, tokenS1);
  assert(s1Reqs.status === 200, 'Student 1 fetched requests');
  assert(s1Reqs.data.length === 1, 'Student 1 sees exactly 1 incoming request');
  const incomingReq = s1Reqs.data[0];
  assert(incomingReq.mentorName === 'Dr. Arun Kumar', 'Displays mentor name');
  assert(incomingReq.mentorOrganization === 'Tata Motors R&D', 'Displays mentor organization');
  assert(incomingReq.mentorDomain === 'Embedded Systems', 'Displays mentor domain');
  assert(incomingReq.projectTitle === 'ChargeWise – Adaptive EV Charging System', 'Displays project title');
  assert(incomingReq.status === 'pending', 'Status is pending');

  console.log('\n--- TEST 9: Student 1 accepts Mentor 1 guidance request ---');
  const s1Accept = await api(`/api/mentorship-requests/${requestId1}/accept`, 'PATCH', {}, tokenS1);
  assert(s1Accept.status === 200, 'Student 1 accepted request successfully');
  assert(s1Accept.data.status === 'accepted', 'Request status updated to accepted');

  console.log('\n--- TEST 10: Project Alpha has Mentor 1 assigned at project level ---');
  const getProj = await api(`/api/projects/${projAlphaId}`, 'GET', null, tokenS1);
  assert(getProj.status === 200, 'Fetched Project Alpha');
  assert(getProj.data.assignedMentorId === idM1, 'Project assignedMentorId matches Mentor 1');
  assert(getProj.data.assignedMentor !== null, 'Project assignedMentor object exists');
  assert(getProj.data.assignedMentor.name === 'Dr. Arun Kumar', 'Project assignedMentor name matches');
  assert(getProj.data.assignedMentor.domain === 'Embedded Systems', 'Project assignedMentor domain matches');

  console.log('\n--- TEST 11: Mentor 1 sees request status is Accepted ---');
  const m1Reqs = await api('/api/mentorship-requests/mentor', 'GET', null, tokenM1);
  assert(m1Reqs.status === 200, 'Mentor 1 fetched their guidance requests');
  assert(m1Reqs.data.length === 1, 'Mentor 1 sees 1 request');
  assert(m1Reqs.data[0].status === 'accepted', 'Mentor 1 sees status is accepted');

  console.log('\n--- TEST 12 & 13: Mentor 2 submits guidance request, Student 1 declines ---');
  const regM2 = await api('/api/auth/register', 'POST', {
    name: 'Prof. Sarah Jenkins',
    email: emailM2,
    password: 'passwordMentor456',
    role: 'mentor',
    domain: 'CleanTech',
    organization: 'CleanTech Ventures'
  });
  const tokenM2 = regM2.data.token;
  const idM2 = regM2.data.user.id;

  const req2 = await api('/api/mentorship-requests', 'POST', {
    projectId: projAlphaId,
    supportType: 'Industry Validation',
    message: 'Can help validate market fit.'
  }, tokenM2);
  assert(req2.status === 201, 'Mentor 2 created guidance request');
  const requestId2 = req2.data.id || req2.data.requestId;

  const s1Decline = await api(`/api/mentorship-requests/${requestId2}/decline`, 'PATCH', {}, tokenS1);
  assert(s1Decline.status === 200, 'Student 1 declined request');
  assert(s1Decline.data.status === 'declined', 'Request status is declined');

  // Verify project Alpha still assigned to Mentor 1
  const getProjAfterDecline = await api(`/api/projects/${projAlphaId}`, 'GET', null, tokenS1);
  assert(getProjAfterDecline.data.assignedMentorId === idM1, 'Project Alpha assigned mentor remains Mentor 1');

  // Verify Mentor 2 sees status is declined
  const m2Reqs = await api('/api/mentorship-requests/mentor', 'GET', null, tokenM2);
  assert(m2Reqs.data[0].status === 'declined', 'Mentor 2 sees status is declined');

  console.log('\n========================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');

  server.close();
  if (failed > 0) process.exit(1);
}

runGuidanceTests().catch(err => {
  console.error('Test execution error:', err);
  server.close();
  process.exit(1);
});
