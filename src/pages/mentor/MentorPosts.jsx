import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase.js';
import { collection, addDoc, getDocs, query, where, serverTimestamp, orderBy } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { MessageSquare, Plus, Send, User, Tag, Calendar } from 'lucide-react';
import { DOMAINS, DEV_STAGES } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';

export default function MentorPosts() {
  const { currentUser, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: DOMAINS[0] || 'Embedded Systems',
    technologies: '',
    projectStage: DEV_STAGES[0] || 'Prototype',
    guidanceRequirements: ''
  });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, 'mentorPosts');
      const snap = await getDocs(postsRef);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPosts(list);
    } catch (err) {
      console.error("Error fetching mentor posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert("Please fill in post title and description.");
      return;
    }
    try {
      setCreating(true);
      const techArray = formData.technologies.split(',').map(t => t.trim()).filter(Boolean);

      const postObj = {
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        technologies: techArray,
        projectStage: formData.projectStage,
        guidanceRequirements: formData.guidanceRequirements,
        mentorId: currentUser.uid,
        mentorName: userProfile?.displayName || currentUser?.email || 'Mentor',
        mentorOrganization: userProfile?.organization || 'Industry Partner',
        createdAt: new Date().toISOString(),
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'mentorPosts'), postObj);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        domain: DOMAINS[0] || 'Embedded Systems',
        technologies: '',
        projectStage: DEV_STAGES[0] || 'Prototype',
        guidanceRequirements: ''
      });
      await fetchPosts();
      alert("Mentorship post published successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to create post.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading mentorship posts..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-purple-500" />
            Mentorship Posts & Guidance Announcements
          </h1>
          <p className="text-gray-400 text-sm">
            Publish announcements about project areas you wish to guide or requirements for student teams.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-500 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Post
        </Button>
      </div>

      {/* Modal for Creating Post */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-navy-800 border-purple-500/40 p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Create Mentorship Post</h2>

            <form onSubmit={handleCreatePost} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-300 font-medium mb-1">Post Title</label>
                <Input
                  required
                  placeholder="e.g. Seeking EV Charging & Power Electronics Prototype Projects"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Domain</label>
                <select
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg p-2 text-white"
                >
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Target Technologies (comma-separated)</label>
                <Input
                  placeholder="ESP32, MATLAB, IoT, Power Electronics"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-300 font-medium mb-1">Description</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Describe what kind of student projects you want to mentor and what guidance you offer..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-500">
                  {creating ? 'Publishing...' : 'Publish Post'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* List of Posts */}
      {posts.length === 0 ? (
        <Card className="text-center py-12 text-gray-400 text-sm">
          No mentorship posts published yet. Be the first to publish a guidance announcement!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                    {post.mentorName?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{post.mentorName}</div>
                    <div className="text-[11px] text-gray-400">{post.mentorOrganization}</div>
                  </div>
                </div>
                <Badge className="bg-purple-900/60 text-purple-300 text-[10px]">{post.domain}</Badge>
              </div>

              <h3 className="font-bold text-white text-base mb-2">{post.title}</h3>
              <p className="text-xs text-gray-300 mb-4 line-clamp-3">{post.description}</p>

              {post.technologies && post.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.technologies.map((tech, i) => (
                    <Badge key={i} className="bg-navy-900 text-gray-300 border border-white/10 text-[10px]">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-white/10 text-[11px] text-gray-500 flex items-center justify-between">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(post.createdAt)}</span>
                <span className="text-purple-400 font-semibold">Active Guidance Post</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
