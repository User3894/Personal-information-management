document.addEventListener('DOMContentLoaded', () => {
    // --- اختيار عناصر الواجهة ---
    const infoForm = document.getElementById('info-form');
    const nameInput = document.getElementById('name');
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const addressInput = document.getElementById('address');
    const locationInput = document.getElementById('location');
    const getLocationBtn = document.getElementById('getLocationBtn');
    const photoInput = document.getElementById('photo');
    const imagePreview = document.getElementById('image-preview');
    const entryIdInput = document.getElementById('entry-id');
    const submitBtn = document.getElementById('submitBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');

    const searchInput = document.getElementById('searchInput');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const entriesList = document.getElementById('entries-list');

    const STORAGE_KEY = 'personalInfoEntries_v1'; // مفتاح التخزين
    let entries = []; // مصفوفة لتخزين السجلات
    let currentPhotoBase64 = null; // لتخزين الصورة المؤقتة كـ Base64

    // --- وظائف التعامل مع localStorage ---
    const loadEntries = () => {
        const storedEntries = localStorage.getItem(STORAGE_KEY);
        try {
            entries = storedEntries ? JSON.parse(storedEntries) : [];
        } catch (e) {
            console.error("Error parsing localStorage data:", e);
            entries = []; // البدء بمصفوفة فارغة في حال وجود خطأ
            localStorage.removeItem(STORAGE_KEY); // مسح البيانات التالفة
        }
    };

    const saveEntries = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch (e) {
            console.error("Error saving to localStorage:", e);
            alert("حدث خطأ أثناء حفظ البيانات. قد تكون مساحة التخزين ممتلئة.");
        }
    };

    // --- وظيفة عرض السجلات في الواجهة ---
    const renderEntries = (entriesToRender = entries) => {
        entriesList.innerHTML = ''; // مسح القائمة الحالية
        if (entriesToRender.length === 0) {
            entriesList.innerHTML = '<p>لا توجد سجلات لعرضها حاليًا.</p>';
            return;
        }

        entriesToRender.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('entry-item');
            entryDiv.dataset.id = entry.id; // إضافة معرف للوصول إليه بسهولة

            entryDiv.innerHTML = `
                <img src="${entry.photo || 'img/placeholder.png'}" alt="صورة ${entry.name}" onerror="this.onerror=null;this.src='img/placeholder.png';">
                <div class="entry-info">
                    <h3>${entry.name || 'غير متوفر'}</h3>
                    <p><strong>العمر:</strong> ${entry.age || 'غير محدد'}</p>
                    <p><strong>الجنس:</strong> ${entry.gender || 'غير محدد'}</p>
                    <p><strong>السكن:</strong> ${entry.address || 'غير محدد'}</p>
                    <p><strong>الموقع:</strong> ${entry.location || 'غير محدد'}</p>
                </div>
                <div class="entry-actions">
                    <button class="btn btn-edit" data-id="${entry.id}">تعديل</button>
                    <button class="btn btn-delete" data-id="${entry.id}">حذف</button>
                </div>
            `;
            entriesList.appendChild(entryDiv);
        });
    };

    // --- التعامل مع رفع الصورة والمعاينة ---
    photoInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                currentPhotoBase64 = reader.result; // تخزين Base64
                imagePreview.src = reader.result;
                imagePreview.style.display = 'block';
            };
            reader.onerror = () => {
                 console.error("خطأ في قراءة الملف.");
                 alert("حدث خطأ أثناء تحميل الصورة.");
                 currentPhotoBase64 = null;
                 imagePreview.style.display = 'none';
                 imagePreview.src = '#';
            }
            // التحقق من حجم الملف (اختياري - مثال: 5 ميجابايت)
            if (file.size > 5 * 1024 * 1024) {
                 alert("حجم الصورة كبير جدًا (الحد الأقصى 5 ميجابايت). قد لا يتم الحفظ بشكل صحيح.");
            }
            reader.readAsDataURL(file);
        } else {
            currentPhotoBase64 = null;
            imagePreview.style.display = 'none';
            imagePreview.src = '#';
        }
    });

    // --- الحصول على الموقع الجغرافي ---
    getLocationBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            locationInput.value = "جاري التحديد...";
            locationInput.disabled = true; // تعطيل مؤقت
            getLocationBtn.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    locationInput.value = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                    locationInput.disabled = false;
                    getLocationBtn.disabled = false;
                },
                (error) => {
                    let message = "فشل تحديد الموقع: ";
                    switch(error.code) {
                        case error.PERMISSION_DENIED: message += "تم رفض الإذن."; break;
                        case error.POSITION_UNAVAILABLE: message += "المعلومات غير متوفرة."; break;
                        case error.TIMEOUT: message += "انتهت مهلة الطلب."; break;
                        default: message += "خطأ غير معروف."; break;
                    }
                    locationInput.value = ""; // مسح الحقل عند الخطأ
                    alert(message);
                    console.error("Geolocation Error:", error);
                    locationInput.disabled = false;
                    getLocationBtn.disabled = false;
                },
                { // خيارات إضافية (اختياري)
                    enableHighAccuracy: true,
                    timeout: 10000, // 10 ثوانٍ مهلة
                    maximumAge: 0 // طلب قراءة جديدة دائمًا
                }
            );
        } else {
            alert("المتصفح لا يدعم تحديد المواقع الجغرافية.");
            locationInput.value = "غير مدعوم";
        }
    });

    // --- وظيفة مسح النموذج ---
    const clearForm = () => {
        infoForm.reset(); // يمسح الحقول القياسية
        entryIdInput.value = ''; // مسح الحقل المخفي
        locationInput.value = ''; // مسح الموقع
        currentPhotoBase64 = null; // مسح الصورة المؤقتة
        imagePreview.style.display = 'none'; // إخفاء المعاينة
        imagePreview.src = '#';
        submitBtn.textContent = 'إضافة بيانات'; // إعادة نص الزر
        nameInput.focus(); // التركيز على حقل الاسم
    }

    clearFormBtn.addEventListener('click', clearForm);


    // --- إضافة أو تحديث سجل ---
    infoForm.addEventListener('submit', (event) => {
        event.preventDefault(); // منع إرسال النموذج التقليدي

        // التحقق الأساسي من الصحة
        if (!nameInput.value.trim()) {
            alert("الرجاء إدخال الاسم.");
            nameInput.focus();
            return;
        }

        const entryData = {
            id: entryIdInput.value || crypto.randomUUID(), // استخدام ID موجود أو إنشاء جديد
            name: nameInput.value.trim(),
            age: ageInput.value,
            gender: genderSelect.value,
            address: addressInput.value.trim(),
            location: locationInput.value,
            photo: currentPhotoBase64 // استخدام الصورة الحالية المحولة
        };

        const existingIndex = entries.findIndex(e => e.id === entryData.id);

        if (existingIndex > -1 && entryIdInput.value) { // إذا كان ID موجودًا (تحديث)
             // احتفظ بالصورة القديمة إذا لم يتم رفع صورة جديدة أثناء التعديل
             if (!entryData.photo && entries[existingIndex].photo) {
                 entryData.photo = entries[existingIndex].photo;
             }
            entries[existingIndex] = entryData; // تحديث العنصر في المصفوفة
            alert("تم تحديث البيانات بنجاح.");
        } else { // إضافة سجل جديد
            // تأكد من وجود ID جديد دائماً عند الإضافة
            entryData.id = crypto.randomUUID();
            entries.push(entryData); // إضافة العنصر الجديد للمصفوفة
            alert("تمت إضافة البيانات بنجاح.");
        }

        saveEntries(); // حفظ المصفوفة المحدثة في localStorage
        renderEntries(); // إعادة عرض القائمة
        clearForm(); // مسح النموذج بعد الإرسال
    });

    // --- التعامل مع أزرار التعديل والحذف (استخدام تفويض الأحداث) ---
    entriesList.addEventListener('click', (event) => {
        const target = event.target;
        const entryId = target.dataset.id;

        if (!entryId) return; // تجاهل النقرات التي ليست على الأزرار ذات data-id

        // --- التعديل ---
        if (target.classList.contains('btn-edit')) {
            const entryToEdit = entries.find(e => e.id === entryId);
            if (entryToEdit) {
                // ملء النموذج ببيانات السجل المحدد
                entryIdInput.value = entryToEdit.id;
                nameInput.value = entryToEdit.name || '';
                ageInput.value = entryToEdit.age || '';
                genderSelect.value = entryToEdit.gender || '';
                addressInput.value = entryToEdit.address || '';
                locationInput.value = entryToEdit.location || '';
                // لا نعيد ملء حقل الملف، لكن نعرض المعاينة ونحتفظ بالـ Base64
                currentPhotoBase64 = entryToEdit.photo || null;
                if (currentPhotoBase64) {
                    imagePreview.src = currentPhotoBase64;
                    imagePreview.style.display = 'block';
                } else {
                    imagePreview.style.display = 'none';
                    imagePreview.src = '#';
                }
                photoInput.value = ''; // مسح حقل اختيار الملف لمنع إعادة الرفع عن طريق الخطأ

                submitBtn.textContent = 'تحديث البيانات'; // تغيير نص زر الإرسال
                window.scrollTo({ top: 0, behavior: 'smooth' }); // الانتقال لأعلى الصفحة للنموذج
                nameInput.focus();
            }
        }
        // --- الحذف ---
        else if (target.classList.contains('btn-delete')) {
             // طلب تأكيد قبل الحذف
            const entryToDelete = entries.find(e => e.id === entryId);
            const nameToDelete = entryToDelete ? entryToDelete.name : 'هذا السجل';
            if (confirm(`هل أنت متأكد من حذف سجل "${nameToDelete}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                entries = entries.filter(e => e.id !== entryId); // إنشاء مصفوفة جديدة بدون العنصر المحذوف
                saveEntries();
                renderEntries();
                alert(`تم حذف سجل "${nameToDelete}" بنجاح.`);
                // إذا كان النموذج يعرض بيانات العنصر المحذوف، قم بمسحه
                if(entryIdInput.value === entryId) {
                    clearForm();
                }
            }
        }
    });

    // --- البحث ---
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) {
            renderEntries(entries); // عرض الكل إذا كان البحث فارغًا
            return;
        }
        const filteredEntries = entries.filter(entry =>
            entry.name && entry.name.toLowerCase().includes(searchTerm)
            // يمكنك إضافة البحث في حقول أخرى هنا:
            // || (entry.address && entry.address.toLowerCase().includes(searchTerm))
            // || (entry.gender && entry.gender.toLowerCase().includes(searchTerm))
        );
        renderEntries(filteredEntries); // عرض النتائج المصفاة
    });

    // --- حذف الكل ---
    deleteAllBtn.addEventListener('click', () => {
        if (entries.length === 0) {
            alert("لا توجد سجلات لحذفها.");
            return;
        }
        // تأكيد مزدوج للحماية
        if (confirm("تحذير! هل أنت متأكد تمامًا من رغبتك في حذف جميع السجلات؟ لا يمكن التراجع عن هذا الإجراء.")) {
             const confirmationText = "تأكيد الحذف";
             const userInput = prompt(`لحذف جميع السجلات نهائيًا، يرجى كتابة "${confirmationText}" في المربع أدناه:`);
             if (userInput === confirmationText) {
                entries = []; // مسح المصفوفة
                saveEntries(); // حفظ المصفوفة الفارغة
                renderEntries(); // إعادة عرض القائمة (ستكون فارغة)
                clearForm(); // مسح النموذج إذا كان يعرض شيئًا
                alert("تم حذف جميع السجلات بنجاح.");
             } else if (userInput !== null) { // إذا لم يضغط إلغاء
                 alert("النص غير مطابق. لم يتم حذف السجلات.");
             } else {
                  alert("تم إلغاء عملية الحذف الكلي.");
             }
        }
    });


    // --- تهيئة خلفية Three.js ---
    let scene, camera, renderer, particles;

    function initThreeBackground() {
        const container = document.getElementById('three-canvas-container');
        if (!container) return; // تأكد من وجود الحاوية

        // 1. المشهد (Scene)
        scene = new THREE.Scene();

        // 2. الكاميرا (Camera)
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50; // ابعاد الكاميرا قليلاً

        // 3. العارض (Renderer)
        renderer = new THREE.WebGLRenderer({ alpha: true }); // alpha: true للخلفية الشفافة
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio); // لتحسين الدقة على الشاشات عالية الكثافة
        container.appendChild(renderer.domElement);

        // 4. إنشاء الجسيمات (Particles)
        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            // توزيع عشوائي في مكعب حجمه 200
            positions[i] = (Math.random() - 0.5) * 300;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x53bf9d, // لون أخضر مائي (Accent Color 2)
            size: 0.5,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending // تأثير توهج عند التداخل
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // التعامل مع تغيير حجم النافذة
        window.addEventListener('resize', onWindowResize, false);

        // بدء حلقة الرسوم المتحركة
        animate();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // متغيرات للتحريك
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2) / 100;
        mouseY = (event.clientY - window.innerHeight / 2) / 100;
    });

    // 5. حلقة الرسوم المتحركة (Animation Loop)
    function animate() {
        requestAnimationFrame(animate); // طلب الإطار التالي

        // تحريك بسيط للجسيمات وتفاعل مع الماوس
        const time = Date.now() * 0.0001;
        particles.rotation.x = time * 0.25 + mouseY * 0.1;
        particles.rotation.y = time * 0.5 + mouseX * 0.1;

        // تحريك الكاميرا قليلاً بناءً على الماوس
        // camera.position.x += (mouseX - camera.position.x) * 0.01;
        // camera.position.y += (-mouseY - camera.position.y) * 0.01;
        // camera.lookAt(scene.position); // اجعل الكاميرا تنظر دائمًا إلى مركز المشهد

        renderer.render(scene, camera); // عرض المشهد
    }


    // --- البدء عند تحميل الصفحة ---
    loadEntries(); // تحميل البيانات من localStorage
    renderEntries(); // عرض البيانات في الواجهة
    initThreeBackground(); // تهيئة خلفية Three.js

}); // نهاية DOMContentLoaded
