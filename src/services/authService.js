const USERS_KEY = "taskflow_users";
const CURRENT_USER_KEY = "taskflow_current_user";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser({
  name,
  email,
  password,
}) {
  const users = getUsers();

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = users.find(
    (user) => user.email === normalizedEmail
  );

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(password);

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  saveUsers(users);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(safeUser)
  );

  return safeUser;
}

export async function loginUser({
  email,
  password,
}) {
  const users = getUsers();

  const normalizedEmail = email.trim().toLowerCase();

  const user = users.find(
    (item) => item.email === normalizedEmail
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== user.passwordHash) {
    throw new Error("Invalid email or password.");
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify(safeUser)
  );

  return safeUser;
}

export function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem(CURRENT_USER_KEY)
    );
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentUser());
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getUserStorageKey(baseKey) {
  const user = getCurrentUser();

  if (!user?.id) {
    return baseKey;
  }

  return `${baseKey}_${user.id}`;
}

export async function changePassword({
  currentPassword,
  newPassword,
}) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    throw new Error("You are not logged in.");
  }

  const users = getUsers();

  const userIndex = users.findIndex(
    (user) => user.id === currentUser.id
  );

  if (userIndex === -1) {
    throw new Error("Account not found.");
  }

  const currentHash =
    await hashPassword(currentPassword);

  if (
    users[userIndex].passwordHash !== currentHash
  ) {
    throw new Error("Current password is incorrect.");
  }

  users[userIndex].passwordHash =
    await hashPassword(newPassword);

  saveUsers(users);
}

export async function resetPassword({
  email,
  newPassword,
}) {
  const users = getUsers();

  const normalizedEmail =
    email.trim().toLowerCase();

  const userIndex = users.findIndex(
    (user) => user.email === normalizedEmail
  );

  if (userIndex === -1) {
    throw new Error("No account was found for this email.");
  }

  users[userIndex].passwordHash =
    await hashPassword(newPassword);

  saveUsers(users);
}