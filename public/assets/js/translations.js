/**
 * ملف الترجمة والنصوص العربية — المجلس العام لمحافظة المهرة
 * Centralized Arabic translations for the Membership Verification system.
 * All texts can be edited directly here.
 */

export const t = {
    // نصوص عامة والعنوان
    appName: "المجلس العام لأبناء محافظة المهرة",
    appSubtitle: "نظام التحقق الرسمي من بطاقات العضوية",
    officialCouncil: "المجلس العام لأبناء محافظتي المهرة وسقطرى",
    verifiedOfficialRecord: "سجل رسمي معتمد وموثق",
    secureVerificationNote: "نظام التحقق الرقمي المعتمد — المجلس العام لمحافظة المهرة",

    // الحقول والبيانات
    fields: {
        serialNumber: "الرقم التسلسلي",
        fullName: "الاسم الكامل",
        job: "المهنة / الوظيفة",
        province: "المحافظة",
        status: "حالة العضوية",
        creationDate: "تاريخ الإصدار",
        expirationDate: "تاريخ الانتهاء",
        terminationDate: "تاريخ إنهاء العضوية",
        photo: "الصورة الشخصية",
        actions: "الإجراءات"
    },

    // حالات العضوية
    status: {
        active: "عضوية سارية",
        expired: "منتهية الصلاحية",
        terminated: "تم إنهاء العضوية",
        activeShort: "سارية",
        expiredShort: "منتهية",
        terminatedShort: "ملغية"
    },

    // صفحة التحقق (verify.html)
    verify: {
        pageTitle: "التحقق من العضوية — المجلس العام لمحافظة المهرة",
        checkingTitle: "جاري التحقق من العضوية…",
        checkingDesc: "يتم البحث في السجل الرسمي المعتمد للمجلس.",
        notFoundTitle: "عضو غير مسجل",
        notFoundDesc: "لم يتم العثور على أي سجل يطابق هذا الرمز في السجل الرسمي للمجلس.",
        contactOffice: "يرجى مراجعة إدارة المجلس في حال وجود أي خطأ.",
        unableToVerifyTitle: "تعذر التحقق",
        noSerialProvided: "لم يتم توفير الرقم التسلسلي للعضوية. يرجى إعادة مسح رمز الاستجابة (QR).",
        networkError: "تعذر الاتصال بالسجل الرسمي. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.",
        permissionDenied: "خدمة التحقق غير متاحة مؤقتاً. يرجى المحاولة لاحقاً."
    },

    // صفحة الإدارة (admin.html)
    admin: {
        pageTitle: "لوحة إدارة العضويات — المجلس العام",
        headerTitle: "لوحة إدارة بطاقات العضوية",
        addNewMember: "إضافة عضو جديد",
        registeredMembers: "الأعضاء المسجلين",
        editMember: "تعديل بيانات العضو",
        logout: "تسجيل الخروج",
        addBtn: "حفظ وإضافة العضو",
        saveChangesBtn: "حفظ التعديلات",
        cancelBtn: "إلغاء",
        editBtn: "تعديل",
        deleteBtn: "حذف",
        photoUploadHint: "الحد الأقصى لحجم الصورة 5 ميجابايت (JPG, PNG, WebP)",
        photoChangeHint: "اختر صورة جديدة لتغيير الصورة الحالية",
        noMembersFound: "لا توجد سجلات أعضاء مسجلة حتى الآن.",
        noSearchResults: "لا توجد نتائج تطابق البحث.",
        serialReadonlyNotice: "الرقم التسلسلي (لا يمكن تعديله بعد الإنشاء)",
        loadingEdit: "جاري تحميل بيانات العضو...",
        noPhoto: "بدون صورة",
        searchPlaceholder: "بحث بالاسم أو الرقم التسلسلي أو المهنة أو المحافظة…",
        filterAll: "جميع الحالات",
        prevPage: "السابق",
        nextPage: "التالي",
        pageOf: "صفحة {current} من {total}",
        totalMembers: "إجمالي: {count}",
        cropTitle: "اقتصاص الصورة الشخصية",
        cropConfirm: "اقتصاص وتأكيد",
        cropCancel: "إلغاء"
    },

    // صفحة تسجيل الدخول (index.html)
    login: {
        pageTitle: "تسجيل الدخول — إدارة العضويات",
        headerTitle: "إدارة العضويات",
        subTitle: "يرجى تسجيل الدخول للوصول إلى لوحة التحكم",
        emailLabel: "البريد الإلكتروني",
        passwordLabel: "كلمة المرور",
        submitBtn: "تسجيل الدخول",
        signingIn: "جاري الدخول…",
        footer: "المجلس العام لمحافظة المهرة — وصول المشرفين المصرح لهم فقط",
        failed: "فشل تسجيل الدخول. يرجى التأكد من البريد الإلكتروني وكلمة المرور."
    },

    // الرسائل والتنبيهات
    alerts: {
        memberAdded: "تمت إضافة العضو بنجاح.",
        memberUpdated: "تم تحديث بيانات العضو بنجاح.",
        memberDeleted: "تم حذف العضو بنجاح.",
        fillAllFields: "يرجى ملء جميع الحقول المطلوبة.",
        photoSizeExceeded: "حجم الصورة يتجاوز الحد المسموح به (5 ميجابايت). يرجى اختيار صورة أصغر.",
        photoUploadFailed: "فشل رفع الصورة إلى التخزين. يرجى التحقق من اتصالك والمحاولة لاحقاً.",
        confirmDelete: "هل أنت متأكد من حذف سجل العضو التالي؟\n\nلا يمكن التراجع عن هذا الإجراء.",
        permissionDeniedAction: "ليس لديك الصلاحية لتنفيذ هذا الإجراء.",
        memberAlreadyExists: "يوجد عضو مسجل بهذا الرقم التسلسلي مسبقاً."
    }
};

/**
 * إضافة سنة واحدة إلى التاريخ بالصيغة YYYY-MM-DD
 */
export function addOneYear(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        if (!isNaN(year)) {
            return `${year + 1}-${parts[1]}-${parts[2]}`;
        }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split("T")[0];
    }
    return "";
}

/**
 * تقييم حالة العضو ديناميكياً:
 * 1. إذا تم إنهاء العضوية (terminated) -> تظهر ملغية مع تاريخ الإنهاء
 * 2. إذا مر تاريخ الانتهاء (expiration_date < today) -> تتحول تلقائياً إلى منتهية
 * 3. إذا حُددت يدوياً كـ expired -> منتهية
 * 4. غير ذلك -> سارية (active)
 */
export function computeMemberStatus(member) {
    const rawStatus = (member?.status || "").trim().toLowerCase();

    if (rawStatus === "terminated") {
        return {
            key: "terminated",
            label: t.status.terminated,
            badgeClass: "badge-terminated",
            isTerminated: true,
            isExpired: false,
            isActive: false
        };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const expDate = (member?.expiration_date || "").trim();

    // التحقق التلقائي من انتهاء الصلاحية
    if (expDate && expDate < todayStr) {
        return {
            key: "expired",
            label: t.status.expired,
            badgeClass: "badge-expired",
            isTerminated: false,
            isExpired: true,
            isActive: false
        };
    }

    if (rawStatus === "expired") {
        return {
            key: "expired",
            label: t.status.expired,
            badgeClass: "badge-expired",
            isTerminated: false,
            isExpired: true,
            isActive: false
        };
    }

    return {
        key: "active",
        label: t.status.active,
        badgeClass: "badge-active",
        isTerminated: false,
        isExpired: false,
        isActive: true
    };
}

