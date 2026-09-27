import http from 'node:http';
import { apiMiddleware } from './server/apiMiddleware.js';

// Setup local test server
const server = http.createServer(async (req, res) => {
  await apiMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

async function runTests() {
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}\n`);

  const runId = Date.now();
  const emailA = `alice_${runId}@student.dev`;
  const emailB = `bob_${runId}@student.dev`;
  const emailM = `marcus_${runId}@mentor.dev`;

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

  console.log('--- TEST 1 & 2: Student A registers and uploads Project A ---');
  const regA = await api('/api/auth/register', 'POST', {
    name: 'Student Alice',
    email: emailA,
    password: 'passwordAlice123',
    role: 'student',
    institution: 'Stanford University'
  });
  assert(regA.status === 201 && regA.data?.token, 'Student A registered successfully');
  const tokenA = regA.data?.token;
  const userA = regA.data?.user;
  assert(userA?.id?.startsWith('student_'), `Student A received unique ID: ${userA?.id}`);

  const projA = await api('/api/projects', 'POST', {
    title: 'Autonomous Drone Navigation (Project A)',
    description: 'AI vision drone navigation system',
    domain: 'Robotics',
    technologies: ['Python', 'OpenCV', 'ROS2']
  }, tokenA);
  assert(projA.status === 201 && projA.data?.id, 'Project A uploaded successfully');
  const projectAId = projA.data?.id;
  assert(projA.data?.user_id === userA?.id, `Project A user_id (${projA.data?.user_id}) matches Student A ID (${userA?.id})`);

  console.log('\n--- TEST 3: Student A logs out ---');
  const logoutA = await api('/api/auth/logout', 'POST', null, tokenA);
  assert(logoutA.status === 200, 'Student A logged out');
  const testAAfterLogout = await api('/api/auth/me', 'GET', null, tokenA);
  assert(testAAfterLogout.status === 401, 'Student A session invalidated on logout');

  console.log('\n--- TEST 4 & 5: Student B registers and uploads Project B ---');
  const regB = await api('/api/auth/register', 'POST', {
    name: 'Student Bob',
    email: emailB,
    password: 'passwordBob123',
    role: 'student',
    institution: 'MIT'
  });
  assert(regB.status === 201 && regB.data?.token, 'Student B registered successfully');
  const tokenB = regB.data?.token;
  const userB = regB.data?.user;
  assert(userB?.id !== userA?.id, `Student B received independent unique ID: ${userB?.id}`);

  const projB = await api('/api/projects', 'POST', {
    title: 'Bio-Polymer Solar Cells (Project B)',
    description: 'Sustainable organic photovoltaic panels',
    domain: 'CleanTech',
    technologies: ['Nanotech', 'Python', 'MaterialScience']
  }, tokenB);
  assert(projB.status === 201 && projB.data?.id, 'Project B uploaded successfully');
  const projectBId = projB.data?.id;
  assert(projB.data?.user_id === userB?.id, `Project B user_id (${projB.data?.user_id}) matches Student B ID (${userB?.id})`);

  console.log('\n--- TEST 6: Student B profile shows ONLY Project B ---');
  const bProjects = await api('/api/my-projects', 'GET', null, tokenB);
  assert(bProjects.status === 200, 'Student B fetched private projects');
  assert(bProjects.data?.length === 1, `Student B has exactly 1 private project (got ${bProjects.data?.length})`);
  assert(bProjects.data?.[0]?.id === projectBId, 'Student B sees Project B');
  assert(!bProjects.data?.some(p => p.id === projectAId), 'Student B CANNOT see Project A in private projects');

  console.log('\n--- TEST 7, 8, 9, 10: Student A re-logs in and sees ONLY Project A ---');
  const loginA = await api('/api/auth/login', 'POST', {
    email: emailA,
    password: 'passwordAlice123'
  });
  assert(loginA.status === 200 && loginA.data?.token, 'Student A re-logged in successfully');
  const tokenA2 = loginA.data?.token;

  const aProjects = await api('/api/my-projects', 'GET', null, tokenA2);
  assert(aProjects.status === 200, 'Student A fetched private projects');
  assert(aProjects.data?.length === 1, `Student A has exactly 1 private project (got ${aProjects.data?.length})`);
  assert(aProjects.data?.[0]?.id === projectAId, 'Student A sees Project A');
  assert(!aProjects.data?.some(p => p.id === projectBId), 'Student A CANNOT see Project B in private projects');

  console.log('\n--- TEST 11 & 12: Mentor A registers and sees only their own records ---');
  const regM = await api('/api/auth/register', 'POST', {
    name: 'Dr. Marcus Vance',
    email: emailM,
    password: 'passwordMarcus123',
    role: 'mentor',
    organization: 'Quantum Ventures'
  });
  assert(regM.status === 201 && regM.data?.token, 'Mentor A registered successfully');
  const tokenM = regM.data?.token;
  const userM = regM.data?.user;

  // Mentor checks mentorships (initially empty)
  const mMentorshipsEmpty = await api('/api/my-mentorships', 'GET', null, tokenM);
  assert(mMentorshipsEmpty.status === 200 && mMentorshipsEmpty.data?.length === 0, 'Mentor A has 0 mentorships initially');

  // Mentor A creates a mentorship connection for Project A
  const createMentorship = await api('/api/mentorships', 'POST', {
    projectId: projectAId,
    studentId: userA.id,
    supportType: 'Technical Mentorship',
    message: 'Happy to provide architecture guidance on drone vision.'
  }, tokenM);
  assert(createMentorship.status === 201, 'Mentor A sent mentorship offer');

  const mMentorships = await api('/api/my-mentorships', 'GET', null, tokenM);
  assert(mMentorships.data?.length === 1, 'Mentor A sees their 1 mentorship');
  assert(mMentorships.data?.[0]?.project_id === projectAId, 'Mentorship references Project A');

  // Student B checks mentorships -> should have 0
  const bMentorships = await api('/api/my-mentorships', 'GET', null, tokenB);
  assert(bMentorships.data?.length === 0, 'Student B has 0 mentorships (not mixed with Mentor A or Student A)');

  console.log('\n--- TEST 13: Shared discovery feed contains projects from all users ---');
  const publicFeed = await api('/api/projects', 'GET');
  assert(publicFeed.status === 200, 'Public feed accessed');
  const pubIds = publicFeed.data?.map(p => p.id) || [];
  assert(pubIds.includes(projectAId), 'Public feed includes Project A');
  assert(pubIds.includes(projectBId), 'Public feed includes Project B');
  assert(publicFeed.data?.length >= 2, `Public feed contains all published projects (${publicFeed.data?.length} found)`);

  console.log('\n--- TEST 14: Backend Authorization checks reject cross-account modifications ---');
  // Student B tries to modify Student A's project
  const hackAttempt = await api(`/api/projects/${projectAId}`, 'PUT', {
    title: 'HACKED TITLE'
  }, tokenB);
  assert(hackAttempt.status === 403, 'Backend rejected unauthorized modification with 403 Forbidden');

  // Student B tries to delete Student A's project
  const deleteAttempt = await api(`/api/projects/${projectAId}`, 'DELETE', null, tokenB);
  assert(deleteAttempt.status === 403, 'Backend rejected unauthorized deletion with 403 Forbidden');

  // Student A legitimately modifies Project A
  const legitimateUpdate = await api(`/api/projects/${projectAId}`, 'PUT', {
    title: 'Autonomous Drone Navigation System v2'
  }, tokenA2);
  assert(legitimateUpdate.status === 200 && legitimateUpdate.data?.title?.includes('v2'), 'Owner successfully updated their own project');

  console.log('\n--- TEST 15: Session persistence & validation ---');
  const profileA = await api('/api/auth/me', 'GET', null, tokenA2);
  assert(profileA.status === 200 && profileA.data?.user?.id === userA?.id, 'Session correctly returns authenticated user');

  console.log('\n--- TEST 16: Invalid / tampered tokens rejected ---');
  const fakeTokenTest = await api('/api/my-projects', 'GET', null, 'fake_invalid_token_12345');
  assert(fakeTokenTest.status === 401, 'Backend rejected invalid session token with 401 Unauthorized');

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error in tests:', err);
  server.close();
  process.exit(1);
});
