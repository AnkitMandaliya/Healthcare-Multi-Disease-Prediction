// Firebase Configuration & Phone Auth Service
// Provides Firebase Phone Authentication for 2FA mobile number verification

import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential
} from "firebase/auth";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyC__5RnjW43zy3zZROy_A-b_wjiZ3Ghq2k",
  authDomain: "healthai-80476.firebaseapp.com",
  projectId: "healthai-80476",
  storageBucket: "healthai-80476.firebasestorage.app",
  messagingSenderId: "84008493999",
  appId: "1:84008493999:web:ac61dd40af8785520f855a",
  measurementId: "G-JYLC4BVPHW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported (prevents SSR errors)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Firebase Auth
const auth = getAuth(app);

// Disable reCAPTCHA locally to completely bypass the invalid-app-credential error
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  auth.settings.appVerificationDisabledForTesting = true;
  console.log('[Firebase] Test mode enabled - reCAPTCHA bypassed for local development');
}

/**
 * Sets up the invisible reCAPTCHA verifier and renders it.
 * Must be called before sending OTP. The verifier is stored on window for reuse.
 * @param {string} containerId - The ID of the container element for reCAPTCHA
 * @returns {Promise<RecaptchaVerifier>} The rendered reCAPTCHA verifier instance
 */
export const setupRecaptcha = async (containerId = 'firebase-recaptcha-container') => {
  // Clear any existing verifier to prevent duplicates
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // Verifier may already be cleared
    }
    window.recaptchaVerifier = null;
  }

  // Also remove any leftover reCAPTCHA iframes/badges from previous attempts
  const existingBadges = document.querySelectorAll('.grecaptcha-badge');
  existingBadges.forEach(badge => {
    if (badge.parentElement) {
      badge.parentElement.remove();
    }
  });

  // Ensure the container exists
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  // Clear the container's children
  container.innerHTML = '';

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('[Firebase] reCAPTCHA verified successfully');
    },
    'expired-callback': () => {
      console.warn('[Firebase] reCAPTCHA expired, will re-render on next attempt');
      window.recaptchaVerifier = null;
    }
  });

  // IMPORTANT: Render the reCAPTCHA widget before using it
  try {
    await verifier.render();
    console.log('[Firebase] reCAPTCHA rendered successfully');
  } catch (renderError) {
    console.error('[Firebase] reCAPTCHA render failed:', renderError);
    throw new Error('Security verification setup failed. Please refresh the page.');
  }

  window.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Sends an OTP to the specified phone number using Firebase Phone Auth.
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +919876543210)
 * @returns {Promise<object>} confirmationResult object with .confirm(code) method
 */
export const sendFirebaseOTP = async (phoneNumber) => {
  try {
    // Ensure reCAPTCHA is set up and rendered
    if (!window.recaptchaVerifier) {
      await setupRecaptcha('firebase-recaptcha-container');
    }

    const appVerifier = window.recaptchaVerifier;

    // Enforce E.164 format (e.g. +91...)
    let e164Phone = phoneNumber.replace(/[^0-9+]/g, '');
    if (!e164Phone.startsWith('+')) {
      // Default to India (+91) if no country code provided
      if (e164Phone.length === 10) {
        e164Phone = '+91' + e164Phone;
      } else {
        e164Phone = '+' + e164Phone;
      }
    }

    console.log('[Firebase] Sending OTP to:', e164Phone.replace(/\d(?=\d{4})/g, '*'));
    const confirmationResult = await signInWithPhoneNumber(auth, e164Phone, appVerifier);
    
    // Store confirmation result for later verification
    window.confirmationResult = confirmationResult;
    
    console.log('[Firebase] OTP sent successfully');
    return { success: true, confirmationResult };
  } catch (error) {
    console.error('[Firebase] OTP send error:', error.code, error.message);
    
    // Reset reCAPTCHA on failure so user can retry
    cleanupFirebaseAuth();
    
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/invalid-phone-number': 'Invalid phone number format. Ensure it starts with +91.',
      'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
      'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
      'auth/captcha-check-failed': 'Security verification failed. Please refresh the page and try again.',
      'auth/missing-phone-number': 'Phone number is required.',
      'auth/user-disabled': 'This phone number has been disabled.',
      // Removed to see the real Firebase error:
      // 'auth/invalid-app-credential': 'Phone Authentication is not enabled in Firebase Console. Please enable it at: Firebase Console → Authentication → Sign-in method → Phone.',
      'auth/billing-not-enabled': 'Firebase Phone Auth requires the Blaze (pay-as-you-go) plan. Please upgrade at Firebase Console.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/internal-error': 'Firebase internal error. Ensure Phone Auth is enabled and billing is set up.',
    };

    const message = errorMessages[error.code] || `Firebase Error (${error.code || 'unknown'}): ${error.message}`;
    throw new Error(message);
  }
};

/**
 * Verifies the OTP code entered by the user.
 * @param {string} otp - The 6-digit OTP code
 * @returns {Promise<object>} Firebase user credential with ID token
 */
export const verifyFirebaseOTP = async (otp) => {
  try {
    if (!window.confirmationResult) {
      throw new Error('No pending OTP verification. Please request a new code.');
    }

    const result = await window.confirmationResult.confirm(otp);
    
    // Get the Firebase ID token to send to backend for verification
    const idToken = await result.user.getIdToken();
    
    return { 
      success: true, 
      user: result.user, 
      idToken,
      phoneNumber: result.user.phoneNumber 
    };
  } catch (error) {
    console.error('[Firebase] OTP verify error:', error);
    
    const errorMessages = {
      'auth/invalid-verification-code': 'Invalid OTP code. Please check and try again.',
      'auth/code-expired': 'OTP has expired. Please request a new code.',
      'auth/missing-verification-code': 'Please enter the verification code.',
    };

    const message = errorMessages[error.code] || error.message || 'Verification failed';
    throw new Error(message);
  }
};

/**
 * Gets the current Firebase ID token for the authenticated user.
 * Used to send to backend for server-side verification.
 * @returns {Promise<string|null>} The ID token string or null
 */
export const getFirebaseIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken(true);
};

/**
 * Signs out the Firebase user (cleanup after backend auth is complete).
 */
export const signOutFirebase = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    // Silent cleanup
  }
};

/**
 * Cleanup function to clear reCAPTCHA and confirmation state
 */
export const cleanupFirebaseAuth = () => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // Already cleared
    }
    window.recaptchaVerifier = null;
  }
  window.confirmationResult = null;
};

export { app, auth, analytics };
