// =========================================================
// 1. CẤU HÌNH FIREBASE
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyDpennm-iaNTxwBMl4GddoC5HCK0QwCPVM",
  authDomain: "library-4e0a6.firebaseapp.com",
  projectId: "library-4e0a6",
  storageBucket: "library-4e0a6.firebasestorage.app",
  messagingSenderId: "458430092408",
  appId: "1:458430092408:web:9c236f76a6a297dbcfc98d",
  measurementId: "G-C2YEC09HLD"
};

// Khởi tạo các biến toàn cục
let db, auth, storage;

function initApp() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    
    if(typeof firebase.auth === 'function') {
        auth = firebase.auth();
    }
    if(typeof firebase.storage === 'function') {
        storage = firebase.storage();
    }
}

// =========================================================
// 2. UI UTILS: TOAST NOTIFICATION
// =========================================================
function showToast(message, type = 'success') {
    const toast = document.getElementById("toast");
    if(!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// =========================================================
// 3. TÍNH NĂNG TRANG NGƯỜI DÙNG (index.html)
// =========================================================
async function loadVideosForUser() {
    const skeleton = document.getElementById('skeletonContainer');
    const grid = document.getElementById('videoGrid');
    
    if(!skeleton || !grid) return;

    try {
        const querySnapshot = await db.collection("videos").orderBy("createdAt", "desc").get();
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
        });
        
        renderVideoGrid(videos);
        
        skeleton.style.display = 'none';
        grid.style.display = 'grid';
        setupSearchAndFilter(videos);

    } catch (error) {
        console.error("Lỗi khi tải video: ", error);
        showToast("Không thể tải danh sách video", "error");
    }
}

function renderVideoGrid(videos) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = ''; 

    if(videos.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Không tìm thấy video nào.</p>';
        return;
    }

    videos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openVideoModal(video);
        
        card.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}" class="card-thumb" onerror="this.src='https://via.placeholder.com/640x360?text=No+Thumbnail'">
            <div class="card-body">
                <h3 class="card-title">${video.title}</h3>
                <div class="card-meta">
                    <span class="badge">${getCategoryName(video.category)}</span>
                    <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupSearchAndFilter(allVideos) {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if(!searchInput || !categoryFilter) return;

    const filterVideos = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filtered = allVideos.filter(video => {
            const matchSearch = video.title.toLowerCase().includes(searchTerm);
            const matchCategory = category === 'all' || video.category === category;
            return matchSearch && matchCategory;
        });

        renderVideoGrid(filtered);
    };

    searchInput.addEventListener('input', filterVideos);
    categoryFilter.addEventListener('change', filterVideos);
}

function getCategoryName(key) {
    const categories = {
        'music': 'Âm nhạc', 'education': 'Giáo dục',
        'entertainment': 'Giải trí', 'news': 'Tin tức'
    };
    return categories[key] || 'Khác';
}

function openVideoModal(video) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');
    
    document.getElementById('modalTitle').textContent = video.title;
    document.getElementById('modalCategory').textContent = getCategoryName(video.category);
    
    let currentViews = video.views || 0;
    document.getElementById('modalViews').textContent = currentViews + 1; 
    document.getElementById('modalDescription').textContent = video.description || 'Không có mô tả.';
    
    player.src = video.videoUrl;
    modal.style.display = 'flex';
    player.play().catch(e => console.log("Trình duyệt chặn autoplay"));

    incrementViewCount(video.id);
}

function closeModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('modalVideoPlayer');
    if(modal) {
        modal.style.display = 'none';
        player.pause();
        player.src = ''; 
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('videoModal');
    if (event.target == modal) {
        closeModal();
    }
}

function incrementViewCount(videoId) {
    const videoRef = db.collection("videos").doc(videoId);
    videoRef.update({
        views: firebase.firestore.FieldValue.increment(1)
    }).catch(error => {
        console.error("Lỗi cập nhật lượt xem: ", error);
    });
}

// =========================================================
// 4. XỬ LÝ TRANG ĐĂNG NHẬP (login.html)
// =========================================================
function setupLoginPage() {
    if(!auth) return;
    
    auth.onAuthStateChanged((user) => {
        if (user) window.location.href = 'admin.html';
    });

    const loginForm = document.getElementById('loginForm');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const pass = document.getElementById('adminPassword').value;
            const errBox = document.getElementById('loginError');
            
            errBox.textContent = 'Đang xử lý...'; 
            
            auth.signInWithEmailAndPassword(email, pass)
                .then(() => { window.location.href = 'admin.html'; })
                .catch((error) => {
    // Hiển thị lỗi gốc của Firebase ra màn hình
    alert("LỖI TỪ FIREBASE: " + error.code + "\nChi tiết: " + error.message); 
    
    errBox.style.color = '#ef4444';
    errBox.textContent = "Hệ thống từ chối đăng nhập!";
    submitBtn.disabled = false;
});
        });
    }
}

// =========================================================
// 5. XỬ LÝ BẢO VỆ TRANG QUẢN TRỊ & ADMIN DASHBOARD (admin.html)
// =========================================================
function checkAdminAuthOnly() {
    if(!auth) return;
    
    const adminContent = document.getElementById('adminContent');

    auth.onAuthStateChanged((user) => {
        if (user) {
            adminContent.style.display = 'block';
            loadVideosForAdmin(); 
            setupAdminForm();     
        } else {
            window.location.href = 'login.html';
        }
    });
}

window.logoutAdmin = function() {
    if(auth) {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        });
    }
}

function loadVideosForAdmin() {
    const tbody = document.getElementById('adminVideoList');
    if(!tbody) return;

    db.collection("videos").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        tbody.innerHTML = '';
        snapshot.forEach((doc) => {
            const video = doc.data();
            const id = doc.id;
            const date = video.createdAt ? video.createdAt.toDate().toLocaleDateString('vi-VN') : 'N/A';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${video.thumbnail}" alt="thumb"></td>
                <td><strong>${video.title}</strong></td>
                <td>${getCategoryName(video.category)}</td>
                <td>${video.views || 0}</td>
                <td>${date}</td>
                <td class="action-btns">
                    <button onclick="editVideo('${id}')" class="btn btn-secondary btn-sm"><i class="fas fa-edit"></i> Sửa</button>
                    <button onclick="deleteVideo('${id}')" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }, (error) => {
        showToast("Không có quyền đọc dữ liệu hoặc lỗi mạng", "error");
    });
}

// HÀM QUAN TRỌNG ĐỂ LƯU VIDEO BỊ THIẾU Ở CODE CỦA BẠN
function setupAdminForm() {
    const form = document.getElementById('videoForm');
    if (!form) return;
    
    handleFileUpload('videoFileUpload', 'videoUrl', 'videoProgress', 'videos/');
    handleFileUpload('thumbnailFileUpload', 'thumbnailUrl', 'thumbProgress', 'thumbnails/');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSave = document.getElementById('btnSave');
        const originalText = btnSave.textContent;
        btnSave.textContent = 'Đang lưu...';
        btnSave.disabled = true;

        const videoId = document.getElementById('videoId').value;
        
        const videoData = {
            title: document.getElementById('videoTitle').value.trim(),
            category: document.getElementById('videoCategory').value,
            description: document.getElementById('videoDescription').value.trim(),
            videoUrl: document.getElementById('videoUrl').value.trim(),
            thumbnail: document.getElementById('thumbnailUrl').value.trim(),
        };

        try {
            if (videoId) {
                // Sửa video
                await db.collection("videos").doc(videoId).update(videoData);
                showToast("Cập nhật video thành công!");
            } else {
                // Thêm mới video
                videoData.views = 0;
                videoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection("videos").add(videoData);
                showToast("Thêm video mới thành công!");
            }
            resetForm();
        } catch (error) {
            console.error("Lỗi khi lưu: ", error);
            showToast("Lỗi: Không có quyền ghi hoặc sai cấu hình", "error");
        } finally {
            btnSave.textContent = originalText;
            btnSave.disabled = false;
        }
    });
}

function handleFileUpload(inputId, urlInputId, progressId, folderPath) {
    const fileInput = document.getElementById(inputId);
    const urlInput = document.getElementById(urlInputId);
    const progress = document.getElementById(progressId);

    if(!fileInput || !storage) return;

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(!file) return;

        const fileName = new Date().getTime() + '_' + file.name;
        const storageRef = storage.ref(folderPath + fileName);
        
        const uploadTask = storageRef.put(file);
        progress.style.display = 'block';

        uploadTask.on('state_changed', 
            (snapshot) => {
                const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progress.value = percent;
            }, 
            (error) => {
                showToast("Upload thất bại", "error");
                progress.style.display = 'none';
            }, 
            () => {
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    urlInput.value = downloadURL; 
                    progress.style.display = 'none';
                    showToast("Tải lên thành công!");
                });
            }
        );
    });
}

function resetForm() {
    document.getElementById('videoForm').reset();
    document.getElementById('videoId').value = '';
    document.getElementById('formTitle').textContent = 'Thêm Video Mới';
    document.getElementById('btnSave').textContent = 'Lưu Video';
    document.getElementById('btnCancel').style.display = 'none';
    
    document.getElementById('videoFileUpload').value = '';
    document.getElementById('thumbnailFileUpload').value = '';
}

window.editVideo = async function(id) {
    try {
        const doc = await db.collection("videos").doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('videoId').value = id;
            document.getElementById('videoTitle').value = data.title;
            document.getElementById('videoCategory').value = data.category;
            document.getElementById('videoDescription').value = data.description || '';
            document.getElementById('videoUrl').value = data.videoUrl;
            document.getElementById('thumbnailUrl').value = data.thumbnail;

            document.getElementById('formTitle').textContent = 'Chỉnh Sửa Video';
            document.getElementById('btnSave').textContent = 'Cập Nhật';
            document.getElementById('btnCancel').style.display = 'inline-block';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        showToast("Lỗi khi lấy thông tin video", "error");
    }
}

window.deleteVideo = async function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa video này không?")) {
        try {
            await db.collection("videos").doc(id).delete();
            showToast("Đã xóa video thành công!");
        } catch (error) {
            showToast("Lỗi khi xóa video", "error");
        }
    }
}