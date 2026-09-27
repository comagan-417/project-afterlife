import crypto from 'node:crypto';
import { getDb } from './database.js';
import { hashPassword, verifyPassword, createSession, destroySession, getSessionUser } from './auth.js';

// Parse JSON body helper
async function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

// Extract bearer token
function extractToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// Authentication middleware helper
function authenticateRequest(req) {
  const token = extractToken(req);
  if (!token) return null;
  return getSessionUser(token);
}

export async function apiMiddleware(req, res, next) {
  // Only handle /api/ routes
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (!pathname.startsWith('/api')) {
    return next ? next() : null;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const db = getDb();

  try {
    // -------------------------------------------------------------
    // AUTH ROUTES
    // -------------------------------------------------------------

    // POST /api/auth/register
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password, name, displayName, role = 'student', ...extra } = body;
      const finalName = displayName || name || email?.split('@')[0] || 'User';

      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
      }

      if (password.length < 6) {
        return sendError(res, 400, 'Password must be at least 6 characters');
      }

      // Check unique email
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (existing) {
        return sendError(res, 409, 'An account with this email already exists');
      }

      const validRoles = ['student', 'mentor', 'investor', 'industrialist', 'admin'];
      const finalRole = validRoles.includes(role) ? role : 'student';

      const userId = `${finalRole}_${crypto.randomBytes(8).toString('hex')}`;
      const { hash, salt } = hashPassword(password);

      const stmt = db.prepare(`
        INSERT INTO users (
          id, name, email, password_hash, salt, role,
          institution, department, organization, domain,
          domains_json, skills_json, support_types_json, bio, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        userId,
        finalName,
        email.toLowerCase().trim(),
        hash,
        salt,
        finalRole,
        extra.institution || null,
        extra.department || null,
        extra.organization || null,
        extra.domain || null,
        JSON.stringify(extra.domains || []),
        JSON.stringify(extra.skills || []),
        JSON.stringify(extra.supportTypes || []),
        extra.bio || null
      );

      // Create session
      const { token } = createSession(userId);
      const user = getSessionUser(token);

      return sendJson(res, 201, {
        success: true,
        token,
        user,
        role: user.role
      });
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendError(res, 400, 'Email and password are required');
      }

      const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
      if (!userRow) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const isValid = verifyPassword(password, userRow.password_hash, userRow.salt);
      if (!isValid) {
        return sendError(res, 401, 'Invalid email or password');
      }

      const { token } = createSession(userRow.id);
      const user = getSessionUser(token);

      return sendJson(res, 200, {
        success: true,
        token,
        user,
        role: user.role
      });
    }

    // POST /api/auth/logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      const token = extractToken(req);
      if (token) {
        destroySession(token);
      }
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    }

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized: Please log in');
      }
      return sendJson(res, 200, { success: true, user });
    }

    // PUT /api/auth/profile
    if (pathname === '/api/auth/profile' && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized: Please log in');
      }

      const body = await parseJsonBody(req);
      const { name, displayName, institution, department, organization, domain, domains, skills, supportTypes, bio } = body;
      const finalName = displayName || name || user.name;

      const stmt = db.prepare(`
        UPDATE users SET
          name = COALESCE(?, name),
          institution = COALESCE(?, institution),
          department = COALESCE(?, department),
          organization = COALESCE(?, organization),
          domain = COALESCE(?, domain),
          domains_json = COALESCE(?, domains_json),
          skills_json = COALESCE(?, skills_json),
          support_types_json = COALESCE(?, support_types_json),
          bio = COALESCE(?, bio),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run(
        finalName,
        institution !== undefined ? institution : null,
        department !== undefined ? department : null,
        organization !== undefined ? organization : null,
        domain !== undefined ? domain : null,
        domains ? JSON.stringify(domains) : null,
        skills ? JSON.stringify(skills) : null,
        supportTypes ? JSON.stringify(supportTypes) : null,
        bio !== undefined ? bio : null,
        user.id
      );

      const token = extractToken(req);
      const updatedUser = getSessionUser(token);
      return sendJson(res, 200, { success: true, user: updatedUser });
    }

    // -------------------------------------------------------------
    // PRIVATE PROJECT ROUTES (Account-Based Data Ownership)
    // -------------------------------------------------------------

    // GET /api/my-projects
    if (pathname === '/api/my-projects' && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized: Access restricted to authenticated users');
      }

      // STRICT BACKEND AUTHORIZATION: Only query projects belonging to authenticated_user_id
      const stmt = db.prepare(`
        SELECT p.*,
               u.name as author_name, u.institution as author_institution, u.email as author_email,
               u_mentor.id as assigned_mentor_user_id, u_mentor.name as assigned_mentor_name,
               u_mentor.organization as assigned_mentor_organization, u_mentor.domain as assigned_mentor_domain,
               u_mentor.skills_json as assigned_mentor_skills_json, u_mentor.bio as assigned_mentor_bio
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users u_mentor ON p.assigned_mentor_id = u_mentor.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `);
      const rows = stmt.all(user.id);

      const projects = rows.map(formatProjectRow);
      return sendJson(res, 200, projects);
    }

    // POST /api/projects - Upload/Create project
    if (pathname === '/api/projects' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized: Access restricted to authenticated users');
      }

      const body = await parseJsonBody(req);
      const {
        title,
        description = '',
        domain = 'General',
        problemStatement = '',
        proposedSolution = '',
        technologies = [],
        lifecycleStage = 'Submitted',
        accessStatus = 'RESTRICTED',
        teamMembers = [],
        supportRequired = [],
        sha256Fingerprint = '',
        fileData = null,
        isPublished = true
      } = body;

      if (!title) {
        return sendError(res, 400, 'Project title is required');
      }

      const projectId = `proj_${crypto.randomBytes(8).toString('hex')}`;
      
      // CRITICAL: Force user_id = user.id from token, ignoring any client spoofing
      const stmt = db.prepare(`
        INSERT INTO projects (
          id, user_id, title, description, domain, problem_statement, proposed_solution,
          technologies_json, lifecycle_stage, score, is_published, access_status,
          team_members_json, support_required_json, sha256_fingerprint, file_data_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      stmt.run(
        projectId,
        user.id, // Assigned automatically by backend
        title,
        description,
        domain,
        problemStatement,
        proposedSolution,
        JSON.stringify(technologies),
        lifecycleStage,
        body.score || 0,
        isPublished ? 1 : 0,
        accessStatus,
        JSON.stringify(teamMembers),
        JSON.stringify(supportRequired),
        sha256Fingerprint,
        fileData ? JSON.stringify(fileData) : null
      );

      // Create initial notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif_${crypto.randomBytes(6).toString('hex')}`,
        user.id,
        'Project Submitted',
        `Your project "${title}" was successfully submitted and stored.`,
        'project_submitted',
        `/student/projects`
      );

      const created = db.prepare(`
        SELECT p.*,
               u.name as author_name, u.institution as author_institution, u.email as author_email,
               u_mentor.id as assigned_mentor_user_id, u_mentor.name as assigned_mentor_name,
               u_mentor.organization as assigned_mentor_organization, u_mentor.domain as assigned_mentor_domain,
               u_mentor.skills_json as assigned_mentor_skills_json, u_mentor.bio as assigned_mentor_bio
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users u_mentor ON p.assigned_mentor_id = u_mentor.id
        WHERE p.id = ?
      `).get(projectId);
      return sendJson(res, 201, formatProjectRow(created));
    }

    // -------------------------------------------------------------
    // SHARED / DISCOVERY PROJECT ROUTES
    // -------------------------------------------------------------

    // GET /api/projects - Shared global feed
    if (pathname === '/api/projects' && req.method === 'GET') {
      const domainFilter = parsedUrl.searchParams.get('domain');

      let query = `
        SELECT p.*,
               u.name as author_name, u.institution as author_institution,
               u_mentor.id as assigned_mentor_user_id, u_mentor.name as assigned_mentor_name,
               u_mentor.organization as assigned_mentor_organization, u_mentor.domain as assigned_mentor_domain,
               u_mentor.skills_json as assigned_mentor_skills_json, u_mentor.bio as assigned_mentor_bio
        FROM projects p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users u_mentor ON p.assigned_mentor_id = u_mentor.id
        WHERE p.is_published = 1
      `;
      const params = [];

      if (domainFilter) {
        query += ` AND LOWER(p.domain) LIKE LOWER(?)`;
        params.push(`%${domainFilter}%`);
      }

      query += ` ORDER BY p.created_at DESC`;

      const rows = db.prepare(query).all(...params);
      return sendJson(res, 200, rows.map(formatProjectRow));
    }

    // Specific Project: /api/projects/:id
    const projectMatch = pathname.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)$/);
    if (projectMatch) {
      const projectId = projectMatch[1];

      // GET /api/projects/:id
      if (req.method === 'GET') {
        const row = db.prepare(`
          SELECT p.*,
                 u.name as author_name, u.institution as author_institution, u.email as author_email,
                 u_mentor.id as assigned_mentor_user_id, u_mentor.name as assigned_mentor_name,
                 u_mentor.organization as assigned_mentor_organization, u_mentor.domain as assigned_mentor_domain,
                 u_mentor.skills_json as assigned_mentor_skills_json, u_mentor.bio as assigned_mentor_bio
          FROM projects p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN users u_mentor ON p.assigned_mentor_id = u_mentor.id
          WHERE p.id = ?
        `).get(projectId);

        if (!row) {
          return sendError(res, 404, 'Project not found');
        }

        return sendJson(res, 200, formatProjectRow(row));
      }

      // PUT /api/projects/:id - UPDATE WITH STRICT OWNERSHIP CHECK
      if (req.method === 'PUT') {
        const user = authenticateRequest(req);
        if (!user) {
          return sendError(res, 401, 'Unauthorized: Access restricted to authenticated users');
        }

        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!project) {
          return sendError(res, 404, 'Project not found');
        }

        // AUTHORIZATION CHECK: User must be owner
        if (project.user_id !== user.id && user.role !== 'admin') {
          return sendError(res, 403, 'Forbidden: You do not have permission to modify this project');
        }

        const body = await parseJsonBody(req);
        const {
          title,
          description,
          domain,
          problemStatement,
          proposedSolution,
          technologies,
          lifecycleStage,
          score,
          isPublished,
          supportRequired
        } = body;

        const updateStmt = db.prepare(`
          UPDATE projects SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            domain = COALESCE(?, domain),
            problem_statement = COALESCE(?, problem_statement),
            proposed_solution = COALESCE(?, proposed_solution),
            technologies_json = COALESCE(?, technologies_json),
            lifecycle_stage = COALESCE(?, lifecycle_stage),
            score = COALESCE(?, score),
            is_published = COALESCE(?, is_published),
            support_required_json = COALESCE(?, support_required_json),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        updateStmt.run(
          title !== undefined ? title : null,
          description !== undefined ? description : null,
          domain !== undefined ? domain : null,
          problemStatement !== undefined ? problemStatement : null,
          proposedSolution !== undefined ? proposedSolution : null,
          technologies ? JSON.stringify(technologies) : null,
          lifecycleStage !== undefined ? lifecycleStage : null,
          score !== undefined ? score : null,
          isPublished !== undefined ? (isPublished ? 1 : 0) : null,
          supportRequired ? JSON.stringify(supportRequired) : null,
          projectId
        );

        const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        return sendJson(res, 200, formatProjectRow(updated));
      }

      // DELETE /api/projects/:id - DELETE WITH STRICT OWNERSHIP CHECK
      if (req.method === 'DELETE') {
        const user = authenticateRequest(req);
        if (!user) {
          return sendError(res, 401, 'Unauthorized');
        }

        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
        if (!project) {
          return sendError(res, 404, 'Project not found');
        }

        // AUTHORIZATION CHECK
        if (project.user_id !== user.id && user.role !== 'admin') {
          return sendError(res, 403, 'Forbidden: You do not have permission to delete this project');
        }

        db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
        return sendJson(res, 200, { success: true, message: 'Project deleted successfully' });
      }
    }

    // POST /api/projects/:id/analyze
    const analyzeMatch = pathname.match(/^\/api\/projects\/([a-zA-Z0-9_-]+)\/analyze$/);
    if (analyzeMatch && req.method === 'POST') {
      const projectId = analyzeMatch[1];
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
      if (!project) {
        return sendError(res, 404, 'Project not found');
      }

      // Generate realistic deterministic score based on project content
      const baseScore = Math.min(96, Math.max(78, (project.title.length * 3 + (project.description || '').length) % 18 + 80));
      db.prepare('UPDATE projects SET score = ?, lifecycle_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(baseScore, 'Working Prototype', projectId);

      return sendJson(res, 200, {
        success: true,
        final_score: baseScore,
        display_score: baseScore,
        lifecycle_stage: 'Working Prototype'
      });
    }

    // -------------------------------------------------------------
    // MENTORSHIPS / GUIDANCE REQUESTS ROUTES
    // -------------------------------------------------------------

    // GET /api/my-mentorships & GET /api/mentorship-requests (and /student /mentor variants)
    if ((pathname === '/api/my-mentorships' || pathname === '/api/mentorship-requests' || pathname === '/api/mentorship-requests/student' || pathname === '/api/mentorship-requests/mentor') && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized: Access restricted to authenticated users');
      }

      let whereClause = 'm.user_id = ? OR m.student_id = ?';
      let params = [user.id, user.id];

      if (pathname === '/api/mentorship-requests/student') {
        whereClause = 'm.student_id = ?';
        params = [user.id];
      } else if (pathname === '/api/mentorship-requests/mentor') {
        whereClause = 'm.user_id = ?';
        params = [user.id];
      }

      const stmt = db.prepare(`
        SELECT m.*, 
               p.title as project_title, p.domain as project_domain,
               u_mentor.name as mentor_name, u_mentor.organization as mentor_organization,
               u_mentor.domain as mentor_domain, u_mentor.domains_json as mentor_domains_json,
               u_mentor.skills_json as mentor_skills_json, u_mentor.support_types_json as mentor_support_types_json,
               u_mentor.bio as mentor_bio,
               u_student.name as student_name, u_student.institution as student_institution
        FROM mentorships m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u_mentor ON m.user_id = u_mentor.id
        LEFT JOIN users u_student ON m.student_id = u_student.id
        WHERE ${whereClause}
        ORDER BY m.created_at DESC
      `);
      const rows = stmt.all(...params);

      return sendJson(res, 200, rows.map(formatMentorshipRow));
    }

    // POST /api/mentorships & POST /api/mentorship-requests
    if ((pathname === '/api/mentorships' || pathname === '/api/mentorship-requests') && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized: Access restricted to authenticated users');
      }

      const body = await parseJsonBody(req);
      const { projectId, supportType = 'Technical Guidance', message = '' } = body;

      if (!projectId) {
        return sendError(res, 400, 'Project ID is required');
      }

      // Verify project exists in database
      const project = db.prepare('SELECT id, user_id, title FROM projects WHERE id = ?').get(projectId);
      if (!project) {
        return sendError(res, 404, 'Project not found');
      }

      // Disallow requesting guidance on own project
      if (project.user_id === user.id) {
        return sendError(res, 400, 'You cannot request mentorship on your own project');
      }

      // STRICT DUPLICATE PREVENTION:
      // Check if a request already exists for this mentor + project with status pending, accepted, or active
      const existing = db.prepare(`
        SELECT id, status FROM mentorships 
        WHERE user_id = ? AND project_id = ? AND status IN ('pending', 'accepted', 'active')
      `).get(user.id, projectId);

      if (existing) {
        return sendError(res, 409, 'Request already exists: You already have a pending or accepted guidance request for this project');
      }

      const targetStudentId = project.user_id;
      const mentorshipId = `mentorship_${crypto.randomBytes(8).toString('hex')}`;

      // Insert persistent record (forcing mentorId = authenticated user id)
      db.prepare(`
        INSERT INTO mentorships (id, user_id, student_id, project_id, support_type, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(mentorshipId, user.id, targetStudentId, projectId, supportType, message);

      // Create notification for student
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif_${crypto.randomBytes(6).toString('hex')}`,
        targetStudentId,
        'New Guidance Request',
        `${user.name} offered ${supportType} for "${project.title}".`,
        'mentorship_request',
        '/student/mentorships'
      );

      const created = db.prepare(`
        SELECT m.*, 
               p.title as project_title, p.domain as project_domain,
               u_mentor.name as mentor_name, u_mentor.organization as mentor_organization,
               u_mentor.domain as mentor_domain, u_mentor.domains_json as mentor_domains_json,
               u_mentor.skills_json as mentor_skills_json, u_mentor.support_types_json as mentor_support_types_json,
               u_mentor.bio as mentor_bio,
               u_student.name as student_name, u_student.institution as student_institution
        FROM mentorships m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u_mentor ON m.user_id = u_mentor.id
        LEFT JOIN users u_student ON m.student_id = u_student.id
        WHERE m.id = ?
      `).get(mentorshipId);

      return sendJson(res, 201, formatMentorshipRow(created));
    }

    // PATCH /api/mentorship-requests/:id/accept
    const acceptReqMatch = pathname.match(/^\/api\/mentorship-requests\/([a-zA-Z0-9_-]+)\/accept$/);
    if (acceptReqMatch && (req.method === 'PATCH' || req.method === 'POST')) {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const mId = acceptReqMatch[1];
      const record = db.prepare('SELECT * FROM mentorships WHERE id = ?').get(mId);
      if (!record) {
        return sendError(res, 404, 'Mentorship request not found');
      }

      // Security check: Only the student who owns the project can accept
      if (record.student_id !== user.id && user.role !== 'admin') {
        return sendError(res, 403, 'Forbidden: You do not have permission to accept this mentorship request');
      }

      // Update mentorship status to accepted
      db.prepare('UPDATE mentorships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('accepted', mId);

      // Link mentor to the project persistently
      db.prepare('UPDATE projects SET assigned_mentor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(record.user_id, record.project_id);

      // Notify mentor
      const project = db.prepare('SELECT title FROM projects WHERE id = ?').get(record.project_id);
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif_${crypto.randomBytes(6).toString('hex')}`,
        record.user_id,
        'Guidance Request Accepted!',
        `Your guidance request for "${project ? project.title : 'the project'}" was accepted! You are now assigned as a mentor.`,
        'mentorship_accepted',
        '/mentor/mentorships'
      );

      const updated = db.prepare(`
        SELECT m.*, 
               p.title as project_title, p.domain as project_domain,
               u_mentor.name as mentor_name, u_mentor.organization as mentor_organization,
               u_mentor.domain as mentor_domain, u_mentor.domains_json as mentor_domains_json,
               u_mentor.skills_json as mentor_skills_json, u_mentor.support_types_json as mentor_support_types_json,
               u_mentor.bio as mentor_bio,
               u_student.name as student_name, u_student.institution as student_institution
        FROM mentorships m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u_mentor ON m.user_id = u_mentor.id
        LEFT JOIN users u_student ON m.student_id = u_student.id
        WHERE m.id = ?
      `).get(mId);

      return sendJson(res, 200, formatMentorshipRow(updated));
    }

    // PATCH /api/mentorship-requests/:id/decline
    const declineReqMatch = pathname.match(/^\/api\/mentorship-requests\/([a-zA-Z0-9_-]+)\/decline$/);
    if (declineReqMatch && (req.method === 'PATCH' || req.method === 'POST')) {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const mId = declineReqMatch[1];
      const record = db.prepare('SELECT * FROM mentorships WHERE id = ?').get(mId);
      if (!record) {
        return sendError(res, 404, 'Mentorship request not found');
      }

      // Security check: Only the student who owns the project can decline
      if (record.student_id !== user.id && user.role !== 'admin') {
        return sendError(res, 403, 'Forbidden: You do not have permission to decline this mentorship request');
      }

      // Update mentorship status to declined
      db.prepare('UPDATE mentorships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('declined', mId);

      // If mentor was assigned, remove assignment
      db.prepare('UPDATE projects SET assigned_mentor_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND assigned_mentor_id = ?')
        .run(record.project_id, record.user_id);

      // Notify mentor
      const project = db.prepare('SELECT title FROM projects WHERE id = ?').get(record.project_id);
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `notif_${crypto.randomBytes(6).toString('hex')}`,
        record.user_id,
        'Guidance Request Declined',
        `Your guidance request for "${project ? project.title : 'the project'}" was declined.`,
        'mentorship_declined',
        '/mentor/mentorships'
      );

      const updated = db.prepare(`
        SELECT m.*, 
               p.title as project_title, p.domain as project_domain,
               u_mentor.name as mentor_name, u_mentor.organization as mentor_organization,
               u_mentor.domain as mentor_domain, u_mentor.domains_json as mentor_domains_json,
               u_mentor.skills_json as mentor_skills_json, u_mentor.support_types_json as mentor_support_types_json,
               u_mentor.bio as mentor_bio,
               u_student.name as student_name, u_student.institution as student_institution
        FROM mentorships m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u_mentor ON m.user_id = u_mentor.id
        LEFT JOIN users u_student ON m.student_id = u_student.id
        WHERE m.id = ?
      `).get(mId);

      return sendJson(res, 200, formatMentorshipRow(updated));
    }

    // PUT /api/mentorships/:id (Legacy & general status updates)
    const mentorshipMatch = pathname.match(/^\/api\/mentorships\/([a-zA-Z0-9_-]+)$/);
    if (mentorshipMatch && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const mId = mentorshipMatch[1];
      const record = db.prepare('SELECT * FROM mentorships WHERE id = ?').get(mId);
      if (!record) {
        return sendError(res, 404, 'Mentorship record not found');
      }

      // Ownership/Participation check: user must be the mentor or the student
      if (record.user_id !== user.id && record.student_id !== user.id && user.role !== 'admin') {
        return sendError(res, 403, 'Forbidden: You are not a participant in this mentorship');
      }

      const body = await parseJsonBody(req);
      const rawStatus = (body.status || '').toLowerCase();
      const status = rawStatus === 'active' ? 'accepted' : (rawStatus === 'rejected' ? 'declined' : rawStatus);

      if (status) {
        // If student is accepting
        if (status === 'accepted') {
          if (record.student_id !== user.id && user.role !== 'admin') {
            return sendError(res, 403, 'Forbidden: Only the student can accept mentorship requests');
          }
          db.prepare('UPDATE projects SET assigned_mentor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(record.user_id, record.project_id);
        } else if (status === 'declined') {
          db.prepare('UPDATE projects SET assigned_mentor_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND assigned_mentor_id = ?')
            .run(record.project_id, record.user_id);
        }

        db.prepare('UPDATE mentorships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(status, mId);

        // Notify other party
        const notifyTarget = record.user_id === user.id ? record.student_id : record.user_id;
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `notif_${crypto.randomBytes(6).toString('hex')}`,
          notifyTarget,
          `Mentorship Status: ${status.toUpperCase()}`,
          `The mentorship status was updated to ${status}.`,
          'mentorship_update',
          user.role === 'student' ? '/mentor/mentorships' : '/student/mentorships'
        );
      }

      const updated = db.prepare(`
        SELECT m.*, 
               p.title as project_title, p.domain as project_domain,
               u_mentor.name as mentor_name, u_mentor.organization as mentor_organization,
               u_mentor.domain as mentor_domain, u_mentor.domains_json as mentor_domains_json,
               u_mentor.skills_json as mentor_skills_json, u_mentor.support_types_json as mentor_support_types_json,
               u_mentor.bio as mentor_bio,
               u_student.name as student_name, u_student.institution as student_institution
        FROM mentorships m
        LEFT JOIN projects p ON m.project_id = p.id
        LEFT JOIN users u_mentor ON m.user_id = u_mentor.id
        LEFT JOIN users u_student ON m.student_id = u_student.id
        WHERE m.id = ?
      `).get(mId);

      return sendJson(res, 200, formatMentorshipRow(updated));
    }

    // -------------------------------------------------------------
    // SAVED PROJECTS ROUTES
    // -------------------------------------------------------------

    // GET /api/my-saved-projects
    if (pathname === '/api/my-saved-projects' && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const rows = db.prepare(`
        SELECT sp.saved_at, p.*
        FROM saved_projects sp
        JOIN projects p ON sp.project_id = p.id
        WHERE sp.user_id = ?
        ORDER BY sp.saved_at DESC
      `).all(user.id);

      return sendJson(res, 200, rows.map(formatProjectRow));
    }

    // POST /api/saved-projects
    if (pathname === '/api/saved-projects' && req.method === 'POST') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const body = await parseJsonBody(req);
      const { projectId } = body;
      if (!projectId) {
        return sendError(res, 400, 'Project ID is required');
      }

      const id = `saved_${crypto.randomBytes(8).toString('hex')}`;
      try {
        db.prepare(`
          INSERT INTO saved_projects (id, user_id, project_id, saved_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(id, user.id, projectId);
      } catch (e) {
        // Ignore duplicate insert
      }

      return sendJson(res, 201, { success: true, message: 'Project saved' });
    }

    // DELETE /api/saved-projects/:projectId
    const unsaveMatch = pathname.match(/^\/api\/saved-projects\/([a-zA-Z0-9_-]+)$/);
    if (unsaveMatch && req.method === 'DELETE') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const projectId = unsaveMatch[1];
      db.prepare('DELETE FROM saved_projects WHERE user_id = ? AND project_id = ?').run(user.id, projectId);
      return sendJson(res, 200, { success: true, message: 'Project removed from saved list' });
    }

    // -------------------------------------------------------------
    // NOTIFICATIONS ROUTES
    // -------------------------------------------------------------

    // GET /api/my-notifications
    if (pathname === '/api/my-notifications' && req.method === 'GET') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const rows = db.prepare(`
        SELECT * FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(user.id);

      return sendJson(res, 200, rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        user_id: r.user_id,
        title: r.title,
        message: r.message,
        type: r.type,
        link: r.link,
        read: Boolean(r.is_read),
        is_read: Boolean(r.is_read),
        createdAt: r.created_at
      })));
    }

    // PUT /api/notifications/:id/read
    const notifReadMatch = pathname.match(/^\/api\/notifications\/([a-zA-Z0-9_-]+)\/read$/);
    if (notifReadMatch && req.method === 'PUT') {
      const user = authenticateRequest(req);
      if (!user) {
        return sendError(res, 401, 'Unauthorized');
      }

      const notifId = notifReadMatch[1];
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
        .run(notifId, user.id);

      return sendJson(res, 200, { success: true });
    }

    // If no /api route matched:
    return sendError(res, 404, `API route not found: ${req.method} ${pathname}`);

  } catch (err) {
    console.error('API Middleware Internal Error:', err);
    return sendError(res, 500, `Internal Server Error: ${err.message}`);
  }
}

// Helpers to format rows to frontend-friendly structures
function formatProjectRow(row) {
  if (!row) return null;
  let technologies = [];
  let teamMembers = [];
  let supportRequired = [];
  let fileData = null;

  try { technologies = JSON.parse(row.technologies_json || '[]'); } catch (e) {}
  try { teamMembers = JSON.parse(row.team_members_json || '[]'); } catch (e) {}
  try { supportRequired = JSON.parse(row.support_required_json || '[]'); } catch (e) {}
  try { fileData = JSON.parse(row.file_data_json || 'null'); } catch (e) {}

  let assignedMentor = null;
  if (row.assigned_mentor_id || row.assigned_mentor_user_id) {
    let mentorSkills = [];
    try { mentorSkills = JSON.parse(row.assigned_mentor_skills_json || '[]'); } catch (e) {}
    assignedMentor = {
      id: row.assigned_mentor_id || row.assigned_mentor_user_id,
      name: row.assigned_mentor_name || 'Assigned Mentor',
      domain: row.assigned_mentor_domain || '',
      organization: row.assigned_mentor_organization || '',
      skills: mentorSkills,
      bio: row.assigned_mentor_bio || ''
    };
  }

  return {
    id: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    author_name: row.author_name || 'Innovator',
    author_institution: row.author_institution || '',
    title: row.title,
    description: row.description || '',
    domain: row.domain || 'General',
    problemStatement: row.problem_statement || '',
    proposedSolution: row.proposed_solution || '',
    technologies,
    lifecycleStage: row.lifecycle_stage || 'Submitted',
    lifecycle_stage: row.lifecycle_stage || 'Submitted',
    stage: row.lifecycle_stage || 'Submitted',
    score: row.score || 0,
    overallScore: row.score || 0,
    completionPercentage: row.score || 0,
    isPublished: Boolean(row.is_published),
    is_published: Boolean(row.is_published),
    accessStatus: row.access_status || 'RESTRICTED',
    teamMembers,
    team_members: teamMembers,
    supportRequired,
    support_required: supportRequired,
    sha256Fingerprint: row.sha256_fingerprint,
    fileData,
    assignedMentorId: row.assigned_mentor_id || null,
    assigned_mentor_id: row.assigned_mentor_id || null,
    assignedMentor,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at
  };
}

function formatMentorshipRow(row) {
  if (!row) return null;
  let mentorDomains = [];
  let mentorSkills = [];
  let mentorSupportTypes = [];
  try { mentorDomains = JSON.parse(row.mentor_domains_json || '[]'); } catch (e) {}
  try { mentorSkills = JSON.parse(row.mentor_skills_json || '[]'); } catch (e) {}
  try { mentorSupportTypes = JSON.parse(row.mentor_support_types_json || '[]'); } catch (e) {}

  return {
    id: row.id,
    requestId: row.id,
    userId: row.user_id,
    user_id: row.user_id,
    mentorId: row.user_id,
    mentor_id: row.user_id,
    studentId: row.student_id,
    student_id: row.student_id,
    projectId: row.project_id,
    project_id: row.project_id,
    projectTitle: row.project_title || '',
    projectDomain: row.project_domain || '',
    mentorName: row.mentor_name || 'Mentor',
    mentorOrganization: row.mentor_organization || '',
    mentorDomain: row.mentor_domain || (mentorDomains[0] || ''),
    mentorDomains,
    mentorSkills,
    mentorSupportTypes,
    mentorBio: row.mentor_bio || '',
    studentName: row.student_name || 'Student',
    studentInstitution: row.student_institution || '',
    supportType: row.support_type || 'Guidance',
    message: row.message || '',
    notes: row.message || '',
    status: row.status || 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
