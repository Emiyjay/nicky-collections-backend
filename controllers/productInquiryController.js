const Product = require('../models/Product');

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'nickycollection01@gmail.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAX_IMAGE_ATTACHMENTS = 4;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);
const escapeHtml = (value) => clean(value, 5000).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
const normaliseImages = (images) => (Array.isArray(images) ? images : []).map((image) => clean(image, 2000)).filter((url) => /^https?:\/\//i.test(url)).slice(0, 8);

const extensionForType = (contentType = '') => ({
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif'
})[contentType.split(';')[0].trim().toLowerCase()] || 'jpg';

const fetchImageAttachments = async (images) => {
  const attachments = [];
  for (let index = 0; index < Math.min(images.length, MAX_IMAGE_ATTACHMENTS); index += 1) {
    try {
      const response = await fetch(images[index], { redirect: 'follow' });
      if (!response.ok) continue;
      const contentLength = Number(response.headers.get('content-length') || 0);
      if (contentLength > MAX_IMAGE_BYTES) continue;
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      if (!/^image\/(jpeg|png|webp|gif)(?:;|$)/i.test(contentType)) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) continue;
      attachments.push({ filename: `product-image-${index + 1}.${extensionForType(contentType)}`, content: buffer.toString('base64') });
    } catch (error) {
      console.warn(`Product image attachment ${index + 1} could not be fetched:`, error.message);
    }
  }
  return attachments;
};

exports.createProductInquiry = async (req, res) => {
  try {
    if (!RESEND_API_KEY || !FROM_EMAIL) return res.status(503).json({ message: 'Email ordering is not configured yet.' });

    const { productId, productSlug, color, size, quantity = 1, customerName, customerEmail, customerPhone, deliveryLocation, notes, productUrl } = req.body || {};
    const identifier = clean(productSlug || productId, 140);
    if (!identifier) return res.status(400).json({ message: 'Product identifier is required.' });

    const product = /^[a-f0-9]{24}$/i.test(identifier)
      ? await Product.findById(identifier).select('-reviews').lean()
      : await Product.findOne({ slug: identifier }).select('-reviews').lean();
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const requestedQuantity = Math.min(Math.max(Number(quantity) || 1, 1), 99);
    const selectedColor = clean(color, 100);
    const selectedSize = clean(size, 100);
    const name = clean(customerName, 120);
    const email = clean(customerEmail, 254);
    const phone = clean(customerPhone, 50);
    const location = clean(deliveryLocation, 250);
    const customerNotes = clean(notes, 1500);
    const safeProductUrl = /^https?:\/\//i.test(String(productUrl || '')) ? String(productUrl) : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Please provide a valid email address.' });

    const reference = `NC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const images = normaliseImages((product.images || []).map((image) => image?.url));
    const price = Number(product.price || 0).toFixed(2);
    const total = (Number(product.price || 0) * requestedQuantity).toFixed(2);
    const imageGallery = images.length ? images.map((url, index) => `<td style="padding:6px;vertical-align:top"><img src="${escapeHtml(url)}" alt="${escapeHtml(product.name)} image ${index + 1}" width="180" style="display:block;width:180px;max-width:100%;height:auto;border-radius:10px;border:1px solid #e5e7eb" /></td>`).join('') : '<td style="padding:6px;color:#6b7280">No product images available.</td>';

    const html = `<!doctype html><html><body style="margin:0;background:#f5f5f0;font-family:Arial,Helvetica,sans-serif;color:#111827"><div style="max-width:760px;margin:0 auto;padding:32px 18px"><div style="background:#080808;color:#fff;padding:24px 26px;border-radius:16px 16px 0 0"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d4a843">Nicky Collections</div><h1 style="margin:8px 0 0;font-size:26px">New product inquiry</h1><div style="margin-top:8px;color:#c7c7c7;font-size:13px">Reference ${escapeHtml(reference)}</div></div><div style="background:#fff;padding:26px;border-radius:0 0 16px 16px"><h2 style="margin:0 0 8px;font-size:24px">${escapeHtml(product.name)}</h2><p style="margin:0 0 18px;color:#4b5563">${escapeHtml(product.description || 'No description provided.')}</p><table style="width:100%;border-collapse:collapse;margin:0 0 22px"><tr><td style="padding:8px 0;color:#6b7280">Price</td><td style="padding:8px 0;text-align:right;font-weight:700">$${price}</td></tr>${product.comparePrice ? `<tr><td style="padding:8px 0;color:#6b7280">Compare price</td><td style="padding:8px 0;text-align:right">$${Number(product.comparePrice).toFixed(2)}</td></tr>` : ''}<tr><td style="padding:8px 0;color:#6b7280">Quantity</td><td style="padding:8px 0;text-align:right">${requestedQuantity}</td></tr><tr><td style="padding:8px 0;color:#6b7280">Estimated subtotal</td><td style="padding:8px 0;text-align:right;font-weight:700">$${total}</td></tr><tr><td style="padding:8px 0;color:#6b7280">Category</td><td style="padding:8px 0;text-align:right">${escapeHtml(product.category)}</td></tr><tr><td style="padding:8px 0;color:#6b7280">Brand</td><td style="padding:8px 0;text-align:right">${escapeHtml(product.brand || 'N/A')}</td></tr><tr><td style="padding:8px 0;color:#6b7280">Availability</td><td style="padding:8px 0;text-align:right">${product.inStock ? `In stock${product.stockCount ? ` (${product.stockCount})` : ''}` : 'Out of stock'}</td></tr></table><h3 style="margin:22px 0 10px">Selected options</h3><p style="margin:0;color:#374151">Color: <strong>${escapeHtml(selectedColor || 'Not specified')}</strong><br/>Size: <strong>${escapeHtml(selectedSize || 'Not specified')}</strong></p><h3 style="margin:22px 0 10px">Customer details</h3><p style="margin:0;color:#374151">Name: <strong>${escapeHtml(name || 'Not provided')}</strong><br/>Email: <strong>${escapeHtml(email || 'Not provided')}</strong><br/>Phone: <strong>${escapeHtml(phone || 'Not provided')}</strong><br/>Delivery location: <strong>${escapeHtml(location || 'Not provided')}</strong></p>${customerNotes ? `<h3 style="margin:22px 0 10px">Customer notes</h3><p style="margin:0;color:#374151;white-space:pre-wrap">${escapeHtml(customerNotes)}</p>` : ''}<h3 style="margin:22px 0 10px">Product pictures</h3><table style="border-collapse:collapse;width:100%"><tr>${imageGallery}</tr></table>${safeProductUrl ? `<p style="margin:24px 0 0"><a href="${escapeHtml(safeProductUrl)}" style="display:inline-block;padding:12px 18px;background:#ff1f6d;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">View product</a></p>` : ''}<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">This inquiry was submitted from the Nicky Collections product page. Please confirm availability, delivery and payment details with the customer before completing the order.</p></div></div></body></html>`;

    const text = [
      `Nicky Collections product inquiry — ${reference}`, '', `Product: ${product.name}`, `Description: ${product.description || 'N/A'}`, `Price: $${price}`,
      product.comparePrice ? `Compare price: $${Number(product.comparePrice).toFixed(2)}` : null, `Category: ${product.category}`, `Brand: ${product.brand || 'N/A'}`,
      `Availability: ${product.inStock ? 'In stock' : 'Out of stock'}`, `Quantity: ${requestedQuantity}`, `Estimated subtotal: $${total}`, `Color: ${selectedColor || 'Not specified'}`, `Size: ${selectedSize || 'Not specified'}`,
      '', `Customer name: ${name || 'Not provided'}`, `Customer email: ${email || 'Not provided'}`, `Customer phone: ${phone || 'Not provided'}`, `Delivery location: ${location || 'Not provided'}`,
      customerNotes ? `Customer notes: ${customerNotes}` : null, '', 'Product images:', ...images, safeProductUrl ? `Product page: ${safeProductUrl}` : null, '', 'Up to four product pictures are also attached when the image files are available.'
    ].filter(Boolean).join('\n');

    const attachments = await fetchImageAttachments(images);
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [CONTACT_EMAIL], reply_to: email || undefined, subject: `[Nicky Collections] Product inquiry: ${product.name} — ${reference}`, html, text, ...(attachments.length ? { attachments } : {}) })
    });
    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend product inquiry failed:', errorText);
      return res.status(502).json({ message: 'The inquiry email could not be sent. Please try again.' });
    }
    return res.status(201).json({ message: 'Product inquiry sent successfully.', reference, attachments: attachments.length });
  } catch (err) {
    console.error('Product inquiry error:', err);
    return res.status(500).json({ message: 'Unable to send product inquiry.' });
  }
};
