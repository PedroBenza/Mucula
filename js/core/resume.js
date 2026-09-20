var KEY = 'mc_resume_path';

export function setResumePath(path) {
  try {
    if (path) sessionStorage.setItem(KEY, path);
  } catch (e) {}
}

export function consumeResumePath() {
  try {
    var p = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return p || null;
  } catch (e) {
    return null;
  }
}

export function peekResumePath() {
  try {
    return sessionStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
}
