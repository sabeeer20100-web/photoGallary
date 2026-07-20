// ============================================================
//  script.js — يخدم صفحتي login.html و gallery.html
//  البيانات محفوظة في localStorage حتى تبقى بعد إعادة تحميل الصفحة
// ============================================================

const categories = {
  all:      { label: 'الكل',   color: '#0f3d3e' },
  nature:   { label: 'طبيعة',  color: '#3f7d4f' },
  cities:   { label: 'مدن',    color: '#5b6fa0' },
  seas:     { label: 'بحار',   color: '#1c7f96' },
  historic: { label: 'أثرية',  color: '#c1652f' }
};

// ---------- أدوات مساعدة للتخزين ----------
function getUsers(){
  return JSON.parse(localStorage.getItem('lamma_users') || '{}');
}
function saveUsers(users){
  localStorage.setItem('lamma_users', JSON.stringify(users));
}
function getImages(){
  return JSON.parse(localStorage.getItem('lamma_images') || 'null') || seedDemoImages();
}
function saveImages(images){
  localStorage.setItem('lamma_images', JSON.stringify(images));
}
function getCurrentUser(){
  return localStorage.getItem('lamma_current_user');
}
function setCurrentUser(username){
  localStorage.setItem('lamma_current_user', username);
}
function clearCurrentUser(){
  localStorage.removeItem('lamma_current_user');
}
function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// بيانات تجريبية أولية حتى لا يظهر المعرض فارغاً لأول مرة
function seedDemoImages(){
  const demo = [
    { title:'كثبان الصحراء عند الغروب', category:'nature', src:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=70' },
    { title:'أزقة المدينة القديمة', category:'cities', src:'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=70' },
    { title:'ساحل أزرق هادئ', category:'seas', src:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70' },
    { title:'أعمدة أثرية عتيقة', category:'historic', src:'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=70' },
  ];
  const images = demo.map(d => ({
    id: crypto.randomUUID(),
    src: d.src, title: d.title, category: d.category,
    owner: 'ضيف', comments: []
  }));
  saveImages(images);
  return images;
}

// ============================================================
//  منطق صفحة تسجيل الدخول (login.html)
// ============================================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // إذا كان المستخدم مسجّلاً دخوله بالفعل، انقله مباشرة إلى المعرض
  if (getCurrentUser()) {
    window.location.href = 'gallery.html';
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errorBox = document.getElementById('loginError');

    if (!user || !pass) {
      errorBox.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور';
      errorBox.style.display = 'block';
      return;
    }

    const users = getUsers();
    if (users[user] && users[user] !== pass) {
      errorBox.textContent = 'كلمة المرور غير صحيحة';
      errorBox.style.display = 'block';
      return;
    }

    if (!users[user]) {
      users[user] = pass; // تسجيل تلقائي لمستخدم جديد
      saveUsers(users);
    }

    setCurrentUser(user);
    // الانتقال إلى الصفحة الثانية (المعرض)
    window.location.href = 'gallery.html';
  });
}

// ============================================================
//  منطق صفحة المعرض (gallery.html)
// ============================================================
const grid = document.getElementById('grid');
if (grid) {
  // حماية الصفحة: إذا لم يكن هناك مستخدم مسجل، أعده لصفحة الدخول
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
  }

  let activeCategory = 'all';
  let images = getImages();

  const tabsEl = document.getElementById('tabs');
  const emptyState = document.getElementById('emptyState');
  const avatarLetter = document.getElementById('avatarLetter');
  const userNameLabel = document.getElementById('userNameLabel');
  const modalOverlay = document.getElementById('modalOverlay');
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const uploadText = document.getElementById('uploadText');
  let pendingImageData = null;

  // -------- إعداد الترويسة --------
  userNameLabel.textContent = currentUser;
  avatarLetter.textContent = currentUser.trim()[0].toUpperCase();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearCurrentUser();
    window.location.href = 'login.html';
  });

  // -------- التبويبات --------
  function renderTabs(){
    tabsEl.innerHTML = '';
    Object.entries(categories).forEach(([key, cat]) => {
      const btn = document.createElement('button');
      btn.className = 'tab' + (activeCategory === key ? ' active' : '');
      btn.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.label}`;
      btn.addEventListener('click', () => {
        activeCategory = key;
        renderTabs();
        renderGrid();
      });
      tabsEl.appendChild(btn);
    });
  }

  // -------- عرض الشبكة --------
  function renderGrid(){
    const list = activeCategory === 'all'
      ? images
      : images.filter(img => img.category === activeCategory);

    grid.innerHTML = '';
    emptyState.style.display = list.length ? 'none' : 'block';

    list.slice().reverse().forEach(img => {
      const cat = categories[img.category];
      const card = document.createElement('div');
      card.className = 'card';
      const canDelete = img.owner === currentUser;

      card.innerHTML = `
        <div class="thumb">
          <img src="${img.src}" alt="${escapeHtml(img.title)}">
          <span class="cat-badge" style="background:${cat.color}">${cat.label}</span>
          ${canDelete ? `<button class="del-btn" data-id="${img.id}" title="حذف الصورة">🗑</button>` : ''}
        </div>
        <div class="card-body">
          <h3>${escapeHtml(img.title)}</h3>
          <div class="meta-row"><span>بواسطة ${escapeHtml(img.owner)}</span><span>${img.comments.length} تعليق</span></div>
          <div class="comments">
            <div class="comment-list">
              ${img.comments.map(c => `<div class="comment-item"><b>${escapeHtml(c.author)}:</b> ${escapeHtml(c.text)}</div>`).join('') || '<div class="comment-item" style="color:#aaa">لا توجد تعليقات بعد</div>'}
            </div>
            <form class="comment-form" data-id="${img.id}">
              <input type="text" placeholder="أضف تعليقاً..." required>
              <button type="submit">إرسال</button>
            </form>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        images = images.filter(i => i.id !== id);
        saveImages(images);
        renderGrid();
      });
    });

    grid.querySelectorAll('.comment-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = form.getAttribute('data-id');
        const input = form.querySelector('input');
        const text = input.value.trim();
        if (!text) return;
        const img = images.find(i => i.id === id);
        img.comments.push({ author: currentUser, text });
        saveImages(images);
        renderGrid();
      });
    });
  }

  // -------- نافذة إضافة صورة --------
  document.getElementById('fabAdd').addEventListener('click', () => {
    modalOverlay.style.display = 'flex';
  });
  document.getElementById('closeModal').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function closeModal(){
    modalOverlay.style.display = 'none';
    document.getElementById('addForm').reset();
    uploadZone.classList.remove('has-img');
    uploadText.style.display = 'block';
    const existingImg = uploadZone.querySelector('img');
    if (existingImg) existingImg.remove();
    pendingImageData = null;
  }

  uploadZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingImageData = e.target.result;
      uploadZone.classList.add('has-img');
      uploadText.style.display = 'none';
      let imgTag = uploadZone.querySelector('img');
      if (!imgTag) {
        imgTag = document.createElement('img');
        uploadZone.appendChild(imgTag);
      }
      imgTag.src = pendingImageData;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('imgTitle').value.trim();
    const category = document.getElementById('imgCategory').value;
    if (!title) { alert('الرجاء إدخال عنوان للصورة'); return; }
    if (!pendingImageData) { alert('الرجاء اختيار صورة'); return; }

    images.push({
      id: crypto.randomUUID(),
      src: pendingImageData,
      title, category,
      owner: currentUser,
      comments: []
    });
    saveImages(images);

    closeModal();
    activeCategory = category;
    renderTabs();
    renderGrid();
  });

  // -------- التشغيل الأولي --------
  renderTabs();
  renderGrid();
}
