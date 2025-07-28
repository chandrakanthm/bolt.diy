/**
 * This client-only module that contains everything related to auth and is used
 * to avoid importing runtime-specific APIs in the server bundle.
 */

export { auth, type AuthAPI } from '@webcontainer/api';
