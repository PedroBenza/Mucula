import { isAuthenticated, openGuestWall } from '../state/session.js';
import { setResumePath } from './resume.js';
import { pathFromLocation } from './router.js';

export function requireAuth({ context, action, resumePath }) {
  if (isAuthenticated()) {
    action();
    return true;
  }
  try {
    setResumePath(resumePath || pathFromLocation() || '');
  } catch (e) {}
  openGuestWall(context || null);
  return false;
}
