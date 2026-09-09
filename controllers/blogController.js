const BlogPost = require('../models/BlogPost');

const slugify = (value) => value
  .toString()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const normalizePost = (body) => ({
  title: body.title,
  slug: slugify(body.slug || body.title || ''),
  excerpt: body.excerpt || '',
  content: body.content || '',
  coverImage: body.coverImage || { url: '', alt: '' },
  category: body.category || 'Style Guide',
  tags: Array.isArray(body.tags) ? body.tags : [],
  authorName: body.authorName || 'Nicky Collections',
  seoTitle: body.seoTitle || '',
  seoDescription: body.seoDescription || '',
  published: Boolean(body.published)
});

exports.getPosts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const posts = await BlogPost.find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .select('-content')
      .lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, published: true }).lean();
    if (!post) return res.status(404).json({ message: 'Article not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminGetPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ updatedAt: -1 }).lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminCreatePost = async (req, res) => {
  try {
    const data = normalizePost(req.body);
    if (!data.title || !data.content || !data.slug) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const existing = await BlogPost.findOne({ slug: data.slug });
    if (existing) return res.status(409).json({ message: 'An article with this slug already exists' });

    if (data.published) data.publishedAt = new Date();
    const post = await BlogPost.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.adminUpdatePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Article not found' });

    const data = normalizePost(req.body);
    const duplicate = await BlogPost.findOne({ slug: data.slug, _id: { $ne: post._id } });
    if (duplicate) return res.status(409).json({ message: 'An article with this slug already exists' });

    const wasPublished = post.published;
    Object.assign(post, data, { updatedBy: req.user._id });
    if (data.published && !wasPublished) post.publishedAt = new Date();
    if (!data.published) post.publishedAt = undefined;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.adminDeletePost = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Article not found' });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
