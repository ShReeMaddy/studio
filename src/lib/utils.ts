import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FirebaseError } from "firebase/app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Firebase error handler
export function getFirebaseErrorMessage(error: any): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email address is already in use by another account.";
      case "auth/invalid-email":
        return "The email address is not valid.";
      case "auth/operation-not-allowed":
        return "Email/password accounts are not enabled.";
      case "auth/weak-password":
        return "The password is too weak.";
      case "auth/user-disabled":
        return "This user account has been disabled.";
      case "auth/user-not-found":
        return "No user found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-credential":
         return "Invalid credentials. Please check your email and password.";
      case "auth/too-many-requests":
        return "Too many unsuccessful login attempts. Please try again later or reset your password.";
      case "auth/requires-recent-login":
        return "This operation is sensitive and requires recent authentication. Please log in again before retrying this request.";
      // Add more specific Firebase error codes as needed
      default:
        return error.message || "An unexpected error occurred. Please try again.";
    }
  }
  if (error && typeof error.message === 'string') {
    return error.message;
  }
  return "An unknown error occurred. Please try again.";
}