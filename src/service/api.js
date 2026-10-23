
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      details || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const body = await response.text();
  return body ? JSON.parse(body) : null;
}

// Fetch all saved repositories
export function getRepositories() {
  return request("/api/repositories");
}

// Import a public GitHub repository
export function importRepository(githubUrl) {
  return request("/api/repositories/import", {
    method: "POST",
    body: JSON.stringify({ githubUrl }),
  });
}

// Delete a saved repository
export function deleteRepository(repositoryId) {
  return request(`/api/repositories/${repositoryId}`, {
    method: "DELETE",
  });
}

// Start analysis for a saved repository
export function analyzeRepository(repositoryId) {
  return request(`/api/analysis/repositories/${repositoryId}`, {
    method: "POST",
  });
}

// Fetch all analysis reports
export function getAnalysisReports() {
  return request("/api/analysis");
}

// Fetch a specific analysis report
export function getAnalysisReport(reportId) {
  return request(`/api/analysis/${reportId}`);
}

// Delete a saved analysis report
export function deleteAnalysisReport(reportId) {
  return request(`/api/analysis/${reportId}`, {
    method: "DELETE",
  });
}

// Fetch chat history for a repository.
export function listRepositoryChats(repositoryId) {
  return request(`/api/repositories/${repositoryId}/chats`);
}

// Create a chat and optionally submit its first question.
export function createRepositoryChat(repositoryId, question = "") {
  return request(`/api/repositories/${repositoryId}/chats`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// Fetch messages from a chat.
export function getChatMessages(chatId) {
  return request(`/api/chats/${chatId}/messages`);
}

// Submit a question to an existing chat.
export function sendChatMessage(chatId, question) {
  return request(`/api/chats/${chatId}/messages`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}


// Start repository indexing in the background (HTTP 202 Accepted).
export function startRepositoryIndexing(repositoryId) {
  return request(`/api/repositories/${repositoryId}/index`, {
    method: "POST",
  });
}

// Read the persisted indexing status for a repository.
export function getRepositoryIndexingStatus(repositoryId) {
  return request(`/api/repositories/${repositoryId}/index/status`);
}