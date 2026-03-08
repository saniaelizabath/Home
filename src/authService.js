/**
 * authService.js
 * Central Firestore-based authentication for all three roles.
 *
 * APPROACH:
 *  - Student  : Firebase Auth (email/password) + Firestore `students` collection for profile
 *  - Admin    : Firebase Auth (email/password) + Firestore `admins` collection for role verification
 *  - Teacher  : Firestore `teachers` collection (set by admin), plain password comparison
 *
 * WHY NOT Firebase Auth for teacher?
 *   Teachers are created by admin from the dashboard. Creating Firebase Auth users client-side
 *   would switch the active session and log out the admin. Firestore-only login avoids this.
 */

import { db, auth } from "./firebase";
import {
    doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp,
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, sendPasswordResetEmail
} from "firebase/auth";

// ─── ADMIN ────────────────────────────────────────────────────────────────────

/**
 * Seeds the admin document into Firestore on first run (idempotent).
 * Called automatically on first admin login.
 */
export async function seedAdmin(user) {
    try {
        const ref = doc(db, "admins", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, {
                name: "Commerce Academy Admin",
                email: user.email,
                role: "admin",
                uid: user.uid,
                createdAt: serverTimestamp(),
            });
        }
    } catch (e) {
        console.warn("Could not seed admin doc:", e.message);
    }
}

/**
 * Login as admin via Firebase Authentication.
 * After auth, verifies role from Firestore `admins` collection.
 * Credentials are managed entirely in Firebase — nothing is hardcoded.
 */
export async function loginAdmin(email, password) {
    // 1. Authenticate via Firebase Auth
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // 2. Verify this Firebase user is actually an admin
    const adminSnap = await getDocs(
        query(collection(db, "admins"), where("uid", "==", cred.user.uid))
    );

    if (adminSnap.empty) {
        // First login after migration — seed the admin doc automatically
        await seedAdmin(cred.user);
        return {
            name: "Commerce Academy Admin",
            email: cred.user.email,
            role: "admin",
            uid: cred.user.uid,
        };
    }

    const adminData = adminSnap.docs[0].data();
    return {
        ...adminData,
        role: "admin",
        uid: cred.user.uid,
    };
}


// ─── STUDENT ─────────────────────────────────────────────────────────────────

/**
 * Sign up student: creates Firebase Auth account + stores full profile in
 * Firestore `students/{uid}`.
 */
export async function signupStudent(form) {
    const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
    await updateProfile(cred.user, { displayName: form.name });

    const profileData = {
        name: form.name, email: form.email,
        phone: form.phone ?? "", parentEmail: form.parentEmail ?? "",
        parentPhone: form.parentPhone ?? "", course: form.course ?? "",
        class: form.class ?? "", favSubject: form.favSubject ?? "",
        studyTime: form.studyTime ?? "", dailyHours: form.dailyHours ?? "",
        studyPlan: form.studyPlan ?? "", focusLevel: form.focusLevel ?? "",
        currentAggregate: form.currentAggregate ?? "",
        targetAggregate: form.targetAggregate ?? "",
        role: "student", uid: cred.user.uid,
        createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "students", cred.user.uid), profileData);
    return { ...profileData };
}

/**
 * Login student: validates via Firebase Auth then fetches their Firestore profile.
 */
export async function loginStudent(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "students", cred.user.uid));
    const profile = snap.exists() ? snap.data() : {};
    // Spread profile first so Firestore name takes priority over Firebase Auth displayName
    return {
        email, role: "student", uid: cred.user.uid,
        name: profile.name || cred.user.displayName || email.split("@")[0],
        ...profile,
    };
}

/**
 * Reset student/admin password via Firebase Auth.
 * Firebase automatically sends an email to reset the password.
 */
export async function resetStudentPassword(email) {
    if (!email) throw new Error("Please provide an email address.");
    await sendPasswordResetEmail(auth, email);
}

// ─── TEACHER ─────────────────────────────────────────────────────────────────

/**
 * Login teacher: looks up by email in `teachers` collection and validates password.
 * Teachers are registered by admin in TeacherManagement — no Firebase Auth involved.
 */
export async function loginTeacher(email, password) {
    const q = query(collection(db, "teachers"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No teacher account found for this email.");
    const teacherDoc = snap.docs[0];
    const data = teacherDoc.data();
    if (data.password !== password) throw new Error("Incorrect password.");
    return { ...data, id: teacherDoc.id, role: "teacher" };
}

/**
 * Handles generating and verifying OTPs for teacher password resets. 
 * Teachers use Firestore for auth, so they need a custom flow.
 */
export async function generateTeacherOtp(email) {
    const q = query(collection(db, "teachers"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No teacher account found for this email.");

    const teacherRef = snap.docs[0].ref;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    await setDoc(teacherRef, {
        resetOtp: otp,
        resetExpiry: expiry
    }, { merge: true });

    return { otp, teacherId: teacherRef.id };
}

export async function resetTeacherPassword(email, otpStr, newPassword) {
    const q = query(collection(db, "teachers"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error("No teacher account found.");

    const teacherDoc = snap.docs[0];
    const data = teacherDoc.data();

    if (!data.resetOtp || data.resetOtp !== otpStr) {
        throw new Error("Invalid verification code.");
    }
    if (!data.resetExpiry || Date.now() > data.resetExpiry) {
        throw new Error("Verification code has expired. Please request a new one.");
    }

    // Update password and clear OTP
    await setDoc(teacherDoc.ref, {
        password: newPassword,
        resetOtp: null,
        resetExpiry: null
    }, { merge: true });
}
